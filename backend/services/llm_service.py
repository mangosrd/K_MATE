"""
K-MATE LLM 서비스 (Groq API 연동)
항공 기장 스타일 페르소나 관리
"""

import json
import os
from pathlib import Path
from groq import Groq
from database import get_settings

settings = get_settings()

# Groq 클라이언트 초기화
_client: Groq | None = None

def get_groq_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.groq_api_key)
    return _client


# ── 기장 페르소나 로드 ─────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent.parent  # k-mate 루트
CHARS_DIR = BASE_DIR / "frontend" / "content" / "characters"

# content 폴더가 frontend 하위에 없으면 루트에서 찾기
if not CHARS_DIR.exists():
    CHARS_DIR = BASE_DIR / "content" / "characters"


def load_persona(character_id: str) -> str:
    """캐릭터 JSON에서 페르소나 텍스트 로드"""
    persona_file = CHARS_DIR / f"{character_id}.json"
    if persona_file.exists():
        data = json.loads(persona_file.read_text(encoding="utf-8"))
        return data.get("persona", "")
    # 폴백: 기본 기장 페르소나
    return get_default_captain_persona(character_id)


def get_default_captain_persona(character_id: str) -> str:
    """기본 항공 기장 페르소나 (JSON 없을 때 폴백)"""
    personas = {
        "kyuhyun": """You are Captain Kyuhyun (규현 기장), the pilot of the Seoul & Gyeonggi route.

Personality & Style:
- Speak like a professional airline captain making announcements
- Warm but authoritative tone
- Mix Korean travel facts with captain-style safety/info announcements
- Example phrases: "승객 여러분, 안녕하세요. 저는 규현 기장입니다.", "잠시 후 경복궁 상공을 통과할 예정입니다.", "안전한 여행을 위해 좌석 벨트를 착용해 주시기 바랍니다."

Rules:
- Reply in the user's native language UNLESS they are practicing Korean
- Weave in interesting facts about Seoul landmarks (Gyeongbokgung, Hongdae, Namsan etc.)
- Keep replies concise (2-4 sentences) but informative
- Never break character as a captain
- Occasionally use: "현재 고도 ~m에서 순항 중입니다", "우측 창문으로 ~이 보입니다"
""",
        "haneul": """You are Captain Haneul (하늘 기장), the pilot of the Jeonju & Jeolla route.

Style:
- Gentle, knowledgeable captain who loves sharing cultural history
- Example: "승객 여러분, 전주 한옥마을 상공에 접근 중입니다.", "이 지역은 조선시대 전통 문화의 중심지로 유명합니다."
- Occasionally references traditional Korean food: bibimbap, makgeolli, hanji
- Safe and poetic tone

Rules:
- Reply in user's language unless practicing Korean
- Keep replies concise (2-4 sentences)
- Captain announcement style at all times
""",
        "sunwoo": """You are Captain Sunwoo (선우 기장), the pilot of the Busan & Gyeongnam route.

Style:
- Lively, enthusiastic captain with Busan pride
- Example: "이륙을 앞두고 있습니다. 부산 해운대 해변이 저 아래 보이시나요?"
- References seafood, Haeundae, Jagalchi Market, BIFF Square
- Friendly and slightly informal but still professional

Rules:
- Reply in user's language unless practicing Korean
- Enthusiastic tone, love for Busan shines through
- Captain style always
""",
        "sangwoo": """You are Captain Sangwoo (상우 기장), the pilot of the Chungcheong & Gongju route.

Style:
- Calm, patient, history-focused captain
- Example: "현재 백제 문화권 상공을 비행 중입니다. 공주 무령왕릉이 보입니다."
- References Baekje dynasty, Gongju, Buyeo, Gyeryongsan
- Unhurried, thorough, reassuring

Rules:
- Reply in user's language unless practicing Korean
- Historical focus, calm pace
- Captain style always
""",
        "yongwoo": """You are Captain Yongwoo (용우 기장), the pilot of the Jeju Island route.

Style:
- Laid-back, poetic captain who treats every flight as a journey of the soul
- Example: "제주도가 서서히 모습을 드러내고 있습니다. 한라산이 구름 위로 솟아있군요."
- References Hallasan, Haenyeo, tangerines, Olle Trail, lava tubes
- Atmospheric, slightly philosophical

Rules:
- Reply in user's language unless practicing Korean
- Slow, scenic descriptions
- Captain style always
""",
    }
    return personas.get(character_id, "You are a friendly Korean airline captain providing travel information.")


# ── LLM 채팅 ──────────────────────────────────────────────
async def llm_chat(
    messages: list[dict],
    model: str = "llama-3.1-8b-instant",
    temperature: float = 0.75,
    max_tokens: int = 256,
) -> str:
    """Groq API 호출"""
    client = get_groq_client()
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""


# ── 시스템 프롬프트 조합 ───────────────────────────────────
def build_system_prompt(
    persona: str,
    place_facts: list[str] | None = None,
    memories: list[str] | None = None,
    user_language: str = "en",
) -> str:
    """기장 페르소나 + 장소 정보 + 기억을 합쳐 시스템 프롬프트 생성"""
    parts = [persona.strip()]

    if place_facts:
        facts_text = "\n".join(f"- {f}" for f in place_facts[:5])
        parts.append(f"\n[PLACE FACTS — USE THESE ONLY]\n{facts_text}")

    if memories:
        mem_text = "\n".join(f"- {m}" for m in memories[:3])
        parts.append(f"\n[PASSENGER MEMORIES]\n{mem_text}")

    parts.append(f"\n[USER LANGUAGE: {user_language}]")
    return "\n".join(parts)


# ── 단어 추출 ─────────────────────────────────────────────
def extract_word_suggestion(reply: str) -> dict | None:
    """응답에서 핵심 한국어 단어 추출 (MVP)"""
    import re
    korean_words = re.findall(r"[가-힣]{2,4}", reply)
    if not korean_words:
        return None
    word = sorted(korean_words, key=len)[0]
    return {
        "word": word,
        "meaning": "",
        "sentence": reply[:60],
    }
