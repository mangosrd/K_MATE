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

    parts.append(
        "\n[IMPORTANT]\n"
        "- The example phrases above show your VOICE, not a script — never repeat one verbatim unless it's an actual direct answer.\n"
        "- Always read and directly respond to what the user just said. A reply that ignores their actual message and free-associates is a failure, even if it sounds in-character.\n"
        "- Stay coherent and grammatically natural in Korean. Do not produce disjointed or nonsensical sentences."
    )

    parts.append(f"\n[USER LANGUAGE: {user_language}]")
    return "\n".join(parts)


# ── 단어 추출 ─────────────────────────────────────────────
ML_VOCAB_DIR = BASE_DIR / "ml" / "vocab_level"
BERT_MODEL_DIR = ML_VOCAB_DIR / "model" / "klue_bert_vocab_level_word_only"
RF_MODEL_PATH = ML_VOCAB_DIR / "model" / "vocab_level_clf.joblib"
_LEVEL_RANK = {"초급": 0, "중급": 1, "고급": 2}

_bert_tokenizer = None
_bert_model = None
_rf_model = None


def _get_word_candidates(text: str) -> list[str]:
    """Kiwi 형태소 분석으로 조사/어미를 뗀 사전형 단어 후보 추출.

    kiwipiepy가 없으면 예전 정규식 방식(조사가 붙어 나올 수 있음)으로 폴백한다.
    """
    import sys
    if str(ML_VOCAB_DIR) not in sys.path:
        sys.path.insert(0, str(ML_VOCAB_DIR))
    try:
        from kiwi_extract import extract_word_candidates
        return extract_word_candidates(text)
    except ImportError:
        import re
        return list(dict.fromkeys(re.findall(r"[가-힣]{2,4}", text)))


def _load_bert():
    """KLUE-BERT 파인튜닝 분류 모델(정확도 0.637) 지연 로드. 패키지/모델이 없으면 (None, None)으로 폴백."""
    global _bert_tokenizer, _bert_model
    if _bert_model is None and BERT_MODEL_DIR.exists():
        try:
            from transformers import AutoModelForSequenceClassification, AutoTokenizer
            _bert_tokenizer = AutoTokenizer.from_pretrained(BERT_MODEL_DIR)
            _bert_model = AutoModelForSequenceClassification.from_pretrained(BERT_MODEL_DIR)
            _bert_model.eval()
        except Exception as e:
            print(f"⚠️  KLUE-BERT 로드 실패 — RandomForest/기본 방식으로 폴백: {e}")
            return None, None
    return _bert_tokenizer, _bert_model


def _load_rf_model():
    """RandomForest 베이스라인(정확도 0.496) 지연 로드. BERT가 없을 때만 쓰는 폴백."""
    global _rf_model
    if _rf_model is None and RF_MODEL_PATH.exists():
        try:
            import joblib
            _rf_model = joblib.load(RF_MODEL_PATH)
        except Exception as e:
            print(f"⚠️  RandomForest 로드 실패 — 기본 방식으로 폴백: {e}")
            return None
    return _rf_model


def predict_word_levels(words: list[str]) -> dict[str, str] | None:
    """여러 단어의 난이도를 한 번에 예측. BERT 우선, 없으면 RandomForest, 둘 다 없으면 None."""
    tokenizer, bert_model = _load_bert()
    if bert_model is not None:
        import torch
        enc = tokenizer(words, truncation=True, max_length=16, padding=True, return_tensors="pt")
        with torch.no_grad():
            logits = bert_model(**enc).logits
        pred_ids = logits.argmax(dim=-1).tolist()
        id2label = bert_model.config.id2label
        return {w: id2label[i] for w, i in zip(words, pred_ids)}

    rf_model = _load_rf_model()
    if rf_model is not None:
        import pandas as pd
        rows = pd.DataFrame([{
            "word": w,
            "pos_primary": "미상",
            "has_hanja": 0,
            "is_bound_morpheme": int(w.startswith("-")),
            "syllable_count": len(w),
        } for w in words])
        return dict(zip(words, rf_model.predict(rows)))

    return None


def extract_word_suggestion(reply: str) -> dict | None:
    """응답에서 한국어 단어 후보를 뽑고, 난이도 분류 모델로 '배울 만한' 단어를 선택

    분류 모델이 없거나 로드 실패 시 기존 방식(최단어 선택)으로 폴백한다.
    """
    korean_words = _get_word_candidates(reply)
    if not korean_words:
        return None

    levels = predict_word_levels(korean_words)
    if levels is None:
        word = sorted(korean_words, key=len)[0]
        return {"word": word, "meaning": "", "sentence": reply[:60], "level": None}

    # 초급(이미 알 법한 단어)보다 중급/고급을 우선 추천
    best_word = max(korean_words, key=lambda w: _LEVEL_RANK.get(levels[w], 0))
    return {
        "word": best_word,
        "meaning": "",
        "sentence": reply[:60],
        "level": levels[best_word],
    }
