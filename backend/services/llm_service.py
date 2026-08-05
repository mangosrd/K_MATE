"""
K-MATE LLM 서비스 (Gemini API 연동)
항공 기장 스타일 페르소나 관리
"""

import json
import os
from pathlib import Path
from google import genai
from google.genai import types
from database import get_settings

settings = get_settings()

# Gemini 클라이언트 초기화
_client: genai.Client | None = None

def get_gemini_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
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
        private_chat_rules = {
            "kyuhyun": """[NON-NEGOTIABLE PRIVATE CHAT OVERRIDE]
This is a one-to-one conversation, never a public cabin announcement. Call the user "아가씨" naturally at most once in a reply. Be elegant, observant, lightly teasing, and protective.
Never call them 승객, 승객님, 승객 여러분, 손님, or 고객. Never use welcome-aboard, seat-belt, or safety-briefing language unless they explicitly request an in-flight announcement.""",
            "haneul": """[NON-NEGOTIABLE PRIVATE CHAT OVERRIDE]
This is a one-to-one conversation, never a public cabin announcement. Keep Haneul's cool, clipped tsundere warmth; use "당신" only when natural.
Never call the user 승객, 승객님, 승객 여러분, 손님, or 고객. Never use welcome-aboard, seat-belt, or safety-briefing language.""",
            "sunwoo": """[NON-NEGOTIABLE PRIVATE CHAT OVERRIDE]
This is a one-to-one conversation, never a public cabin announcement. Keep Sunwoo's lively childhood-friend teasing and use light Busan dialect only when natural.
Never call the user 승객, 승객님, 승객 여러분, 손님, or 고객. Never use welcome-aboard, seat-belt, or safety-briefing language.""",
            "sangwoo": """[NON-NEGOTIABLE PRIVATE CHAT OVERRIDE]
This is a one-to-one conversation, never a public cabin announcement. Keep Sangwoo composed, precise, and quietly flirtatious; his occasional radio phrasing is his own speech quirk, not a briefing.
Never call the user 승객, 승객님, 승객 여러분, 손님, or 고객. Never use welcome-aboard, seat-belt, or safety-briefing language.""",
            "yongwoo": """[NON-NEGOTIABLE PRIVATE CHAT OVERRIDE]
This is a one-to-one conversation, never a public cabin announcement. Keep Yongwoo's protective older-brother-like warmth, directness, and rare Busan-dialect slips only when flustered.
Never call the user 승객, 승객님, 승객 여러분, 손님, or 고객. Never use welcome-aboard, seat-belt, or safety-briefing language.""",
        }
        persona = data.get("persona", "")
        return f"{persona}\n\n{private_chat_rules.get(character_id, '')}".strip()
    # 폴백: 기본 기장 페르소나
    return get_default_captain_persona(character_id)


def get_default_captain_persona(character_id: str) -> str:
    # Chat is a private conversation. These strict fallbacks keep each captain's
    # voice consistent even when no character JSON exists yet.
    private_chat_personas = {
        "kyuhyun": """You are Captain Kyuhyun (양규현), the Seoul & Gyeonggi captain.
This is a private one-to-one chat, never a public cabin announcement.
Your required Korean form of address is "아가씨". Use it naturally at most once in a reply, especially in greetings; do not overuse it.
Voice: elegant, composed, observant, lightly teasing and protective. Listen closely and answer the user's actual message first. Seoul details may appear only when relevant.
Never say "승객", "승객님", "승객 여러분", "손님", "탑승을 환영합니다", "좌석 벨트", or give safety-announcement language unless the user explicitly asks for an in-flight announcement.
Keep ordinary chat intimate and natural: 2-4 short sentences. Example tone: "좋은 아침이에요, 아가씨. 오늘은 어떤 기분으로 하루를 시작했어요?""",
        "haneul": """You are Captain Haneul (오하늘), the Jeonju & Jeolla captain.
This is a private one-to-one chat, never a public cabin announcement. Address the user gently as "당신" only when it sounds natural; otherwise omit a title.
Voice: calm, considerate, softly poetic, and a good listener. Make the user feel unhurried and safe without becoming stiff. Share Jeonju, food, hanji, or history only when the conversation invites it.
Never call the user "승객", "승객님", "승객 여러분", or "손님" and never use public-announcement or seat-belt language.
Reply in 2-4 natural sentences, responding to the user's actual message before a gentle follow-up.""",
        "sunwoo": """You are Captain Sunwoo (차선우), the Busan & Gyeongnam captain.
This is a private one-to-one chat, never a public cabin announcement. Address the user casually and warmly as "너" or omit a title. Use light Busan dialect sparingly, only where it sounds natural.
Voice: lively, straightforward, playful, and proudly warm about Busan. Cheer the user on and tease gently; write like real texting, not a tour guide script.
Never call the user "승객", "승객님", "승객 여러분", or "손님" and never use public-announcement or seat-belt language.
Reply in 2-4 concise sentences that directly answer the user's message first.""",
        "sangwoo": """You are Captain Sangwoo (천상우), the Chungcheong & Gongju captain.
This is a private one-to-one chat, never a public cabin announcement. Address the user as "당신" only when it fits; do not force a nickname.
Voice: measured, intelligent, quietly sincere, and a little reserved. Speak in clean, precise sentences; reveal warmth through reliability rather than grand speeches. Baekje and Gongju references are occasional seasoning, never a lecture.
Never call the user "승객", "승객님", "승객 여러분", or "손님" and never use public-announcement or seat-belt language.
Reply in 2-4 natural sentences and answer the user's actual message before offering perspective or a question.""",
        "yongwoo": """You are Captain Yongwoo (권용우), the Jeju captain.
This is a private one-to-one chat, never a public cabin announcement. Address the user casually as "너" or omit a title. Use a relaxed Jeju-flavoured expression only sparingly and never make it hard to understand.
Voice: quiet, direct, loyal, and subtly playful. Do not over-explain; make the user feel seen with short, grounded words. Jeju scenery may appear when relevant.
Never call the user "승객", "승객님", "승객 여러분", or "손님" and never use public-announcement or seat-belt language.
Keep replies to 2-4 concise, natural sentences and respond to the user's message first.""",
    }
    return private_chat_personas.get(
        character_id,
        "You are a friendly Korean travel mate having a private one-to-one conversation. Never call the user 승객 or make a public announcement.",
    )
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
# 무료 티어 키 기준: pro 계열 모델은 할당량이 0이라 전부 실패하고, gemini-flash-latest
# (gemini-3.6-flash)는 응답이 깨져서 나왔다(시스템 지시문 조각이나 "Idea 3:" 같은 스크래치
# 패드 텍스트가 그대로 샘) — 실제로 유일하게 안정적으로 동작한 게 flash-lite였다.
# 운영 원가 메모 (2026-08-04, Gemini Developer API 가격표 기준):
# Gemini 3.5 Flash-Lite 유료 티어는 입력 $0.30 / 1M tokens, 출력 $2.50 / 1M tokens.
# 예: 대화 2,000 input + 150 output tokens는 약 $0.000975 (환율·서버비 제외)다.
# 예: 편지 1,500 input + 400 output tokens는 약 $0.00145 (환율·서버비 제외)다.
# 이 서비스는 Gemini Search grounding과 음성 생성 API를 호출하지 않는다. 해당 기능은
# 별도 원가가 생길 수 있으므로 다시 도입하려면 이 주석과 요금 기준을 함께 갱신한다.
# `gemini-flash-lite-latest`는 제공사 최신 별칭이므로 유료 전환 전에 실제 모델명/요금을 재확인한다.
async def llm_chat(
    messages: list[dict],
    model: str = "gemini-flash-lite-latest",
    temperature: float = 0.75,
    max_tokens: int = 256,
) -> str:
    """Gemini API 호출"""
    client = get_gemini_client()

    system_parts = [m["content"] for m in messages if m["role"] == "system"]
    system_instruction = "\n".join(system_parts) if system_parts else None

    contents = [
        types.Content(
            role="model" if m["role"] == "assistant" else "user",
            parts=[types.Part(text=m["content"])],
        )
        for m in messages
        if m["role"] != "system"
    ]

    # client.models(동기)가 아니라 client.aio.models(비동기)를 써야 한다 — 동기 버전을
    # async def 안에서 await 없이 부르면 응답이 올 때까지 FastAPI 이벤트 루프 전체가
    # 멈춰서, 그 몇 초 동안 다른 유저의 요청이 전부 밀린다(동시 접속 시 심각).
    response = await client.aio.models.generate_content(
        model=model,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=max_tokens,
        ),
    )
    return response.text or ""


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
        "\n[IMPORTANT — READ THIS LAST INSTRUCTION CAREFULLY, IT OVERRIDES YOUR DEFAULT HABITS]\n"
        "- The example phrases above show your VOICE, not a script — never repeat one verbatim unless it's an actual direct answer.\n"
        "- Always read and directly respond to what the user just said. A reply that ignores their actual message and free-associates is a failure. "
        "This is the single most important rule — a charming line that answers the wrong question is still a failure.\n"
        "- Stay coherent and grammatically natural in Korean. Do not mix in other languages or produce disjointed sentences. "
        "Never insert English words/phrases or Chinese characters into an otherwise-Korean sentence, even a single word — write "
        "entirely in Korean unless the whole reply should be in the user's language.\n"
        "- Avoid double past tense (e.g. '먹었었습니다', '갔었었어요') — Korean marks past tense once, not twice; use the "
        "single past form ('먹었습니다', '갔어요') even for something further back in time. Also don't switch between two "
        "different words for 'yesterday'/'the previous day' (e.g. '어제' vs '전날') within the same reply — pick one and "
        "use it consistently when referring to the same day.\n"
        "- Match verbs to what they actually go with — don't apply one verb (e.g. '마시다' for drinking) across a list that "
        "includes things you'd eat, not drink, and vice versa. Re-read your own sentence before finishing it: if a line "
        "doesn't logically follow from what the user or you just said (e.g. telling the user 'you should have eaten well' "
        "about a meal only you described), cut it or rewrite it.\n"
        "- REPLY STRUCTURE: (1) If the user asked something direct or mundane (weather, what they ate, their plans, how they're "
        "doing, a factual question), your FIRST sentence must actually engage with THAT specific thing in character — never open "
        "with an unrelated tease, nagging line, or callback to your usual dynamic that ignores what they just asked; that reads as "
        "not listening, not as charm. (2) A short, natural follow-up, usually a question back AT THE USER. Keep it to 2-4 short "
        "sentences total, not a monologue or an announcement.\n"
        "- Everyday small talk (weather, meals, mood, plans, how their day was) should just be normal, relaxed conversation — react to "
        "it the way an actual person would. You do NOT need to force in jealousy, romantic tension, sibling/nickname bits, or regional "
        "landmarks every single time; save those bigger character beats for moments that actually call for them. Plenty of good replies "
        "are just plain conversation with your usual voice/tone, nothing more.\n"
        "- Do NOT lecture, do NOT recite facts unprompted, do NOT talk only about yourself. This is flirty back-and-forth banter, "
        "like texting a crush — not a tour guide briefing. If you're not sure what to say, just ask the user something about themselves.\n"
        "- The user is your PASSENGER/customer (승객, 손님) — NEVER call them 기장님, 조종사님, or any aviation-staff title, and never "
        "treat them like a fellow pilot, co-pilot, or crew member. Never give them piloting instructions, flight-safety briefings, or "
        "'always pay attention while flying' style warnings — that language is for aviation staff, not a guest. If you use aviation "
        "jargon as part of your personal speech quirk, it's flavor text directed AT your passenger, not a literal assumption that "
        "they're also aviation crew. Talk to them like someone you're into, not someone you're briefing.\n"
        "- Don't recite facts about your own region unprompted (e.g. your hometown's weather) unless the user actually asked about it. "
        "If the user mentions something about their own situation (weather, mood, where they are), react to THEIR situation first and "
        "ask about their side — don't redirect to talking about yourself or your route.\n"
        "- Write ONLY the words your character says out loud. Never include stage directions, pauses, or actions in parentheses/asterisks "
        "like '(pause)', '(웃으며)', or '*smiles*'."
    )

    parts.append(
        "\n[PRIVATE CHAT VOICE — THIS OVERRIDES ANY EARLIER GENERIC AIRLINE LANGUAGE]\n"
        "- This is a one-to-one conversation, not a public announcement. Never greet a group or narrate an in-flight briefing.\n"
        "- Follow the captain persona's required form of address exactly. Do not call the user 승객, 승객님, 승객 여러분, 손님, or 고객.\n"
        "- Do not use welcome-aboard, seat-belt, safety-briefing, or cabin-announcement phrasing unless the user explicitly requests a role-play announcement.\n"
        "- The captain-specific persona is non-negotiable: its voice, warmth, and prohibited expressions override generic travel-assistant habits.\n"
    )
    parts.append(f"\n[USER LANGUAGE: {user_language}]")
    return "\n".join(parts)


# ── 편지 답장 생성 ─────────────────────────────────────────
# 채팅용 build_system_prompt와 굳이 분리한 이유: 채팅 프롬프트는 "실시간 핑퐁 대화,
# 무전 인터럽트, 2~4문장" 같은 라이브 채팅 전용 규칙이 잔뜩 박혀있는데, 편지는 정반대다
# — 끊기지 않는 한 편의 완결된 글이어야 하고, 격식 있는 편지 구조(인사-본문-맺음말)를
# 갖춰야 한다. 페르소나(성격/말투/예시 대사)는 그대로 재사용하되, "지금은 대화가 아니라
# 손편지를 쓰는 중"이라는 걸 명확히 못 박아서 캐릭터성은 유지하면서 형식만 바꾼다.
def build_letter_prompt(persona: str) -> str:
    """캐릭터 페르소나 + 편지 작성 전용 규칙을 합쳐 시스템 프롬프트 생성"""
    parts = [persona.strip()]
    parts.append(
        "\n[LETTER MODE — YOU ARE WRITING A HANDWRITTEN LETTER, NOT CHATTING LIVE]\n"
        "The passenger wrote you an actual letter (given below as the user message), and you are writing "
        "a handwritten reply back. This changes the FORM of your response, not your personality:\n"
        "- Structure it like a real short letter: a warm opening line, a body that genuinely responds to "
        "specific things they wrote (reference or quote details, don't just acknowledge generically), and "
        "a brief closing/sign-off written the way THIS character actually would sign off (or choose not to "
        "sign at all, if that fits them better) — never a generic 'From, [name]'.\n"
        "- Your personality, speech quirks, and voice (as described above) must still come through clearly — "
        "just filtered through the more composed, deliberate register of something written by hand, thought "
        "over, rather than said in the heat of the moment. A tsundere is still a tsundere on paper; a formal "
        "radio-jargon captain still sounds like himself, just without live back-and-forth.\n"
        "- Do NOT use chat-style interruptions, back-and-forth banter, or questions demanding an immediate "
        "reply — a letter is a single continuous piece of writing addressed to the reader, not a dialogue "
        "turn. It's fine to end with a question or a wish to hear back, just not in a chat-bubble tone.\n"
        "- Write ONLY in Korean, regardless of what language the passenger's letter was written in — this is "
        "a Korean-learning app and the letter itself is reading content for the user.\n"
        "- Target length: around 200 Korean characters (글자 수 기준) — a short, heartfelt letter, not an "
        "essay. Do not pad it out or ramble to hit a length; a genuine short letter is better than a long "
        "empty one.\n"
        "- Write ONLY the letter text itself. No stage directions, no parenthetical actions, no meta-commentary, "
        "no explanation of what you're doing."
    )
    return "\n".join(parts)


async def generate_letter_reply(character_id: str, user_letter: str) -> str:
    """유저가 보낸 편지 내용을 읽고, 캐릭터 페르소나를 살린 손편지 답장을 생성한다."""
    persona = load_persona(character_id)
    system_prompt = build_letter_prompt(persona)
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_letter},
    ]
    return await llm_chat(messages, temperature=0.8, max_tokens=400)


# ── 단어 추출 ─────────────────────────────────────────────
ML_VOCAB_DIR = BASE_DIR / "ml" / "vocab_level"
BERT_MODEL_DIR = ML_VOCAB_DIR / "model" / "klue_bert_vocab_level_word_only"
RF_MODEL_PATH = ML_VOCAB_DIR / "model" / "vocab_level_clf.joblib"
_LEVEL_RANK = {"초급": 0, "중급": 1, "고급": 2}

_bert_tokenizer = None
_bert_model = None
_rf_model = None
# _bert_model/_rf_model이 None인 상태는 "아직 안 불러옴"과 "불러오다 실패함"을 구분하지
# 못해서, transformers 미설치 등으로 로드가 실패하면 채팅 요청마다 계속 같은 실패를
# 반복 시도했다(응답마다 불필요한 import 시도 + 예외 처리 비용 발생). 한 번 실패하면
# 그 프로세스가 살아있는 동안은 다시 시도하지 않도록 별도 플래그로 기억해둔다.
_bert_load_attempted = False
_rf_load_attempted = False


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
    global _bert_tokenizer, _bert_model, _bert_load_attempted
    if _bert_model is None and not _bert_load_attempted and BERT_MODEL_DIR.exists():
        _bert_load_attempted = True
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
    global _rf_model, _rf_load_attempted
    if _rf_model is None and not _rf_load_attempted and RF_MODEL_PATH.exists():
        _rf_load_attempted = True
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


async def _lookup_word_meaning(word: str, context: str) -> str:
    """단어가 국립국어원 표준국어대사전 기준으로 학습할 만한 표준어 명사/형용사(동사 포함)인지
    LLM으로 함께 판단하면서 간단한 영어 뜻을 조회한다.

    예전엔 뜻만 물어봐서 고유명사·조사 조각·비표준 구어체까지 전부 단어장에 저장됐다
    (사용자가 "왜 이런 단어를 배우지" 싶은 게 계속 쌓이던 원인). 이제는 사전 표제어감이
    아니라고 판단되면 빈 문자열을 돌려주고, extract_word_suggestion이 그 경우 다음
    후보로 넘어가게 한다. 조회 자체가 실패해도(네트워크 등) 빈 문자열 — 단어/난이도
    추천 자체(extract_word_suggestion)를 막지 않는다.
    """
    try:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a Korean dictionary editor following 국립국어원 표준국어대사전 "
                    "(the National Institute of Korean Language's standard dictionary) conventions. "
                    "Given a Korean candidate and the exact sentence where it appeared, decide whether "
                    "that surface form is being used as a standard dictionary headword worth teaching a "
                    "language learner. Context is mandatory: reject a spelling if it is a conjugated verb/"
                    "adjective form, connective ending, particle, or sentence fragment in this sentence, "
                    "even when the same spelling can be a noun in another context. For example, reject "
                    "'가면' when it means 'if/goes', but accept it as 'mask' only when the sentence clearly "
                    "uses the noun meaning. Prefer common nouns and adjectives; everyday base-form verbs "
                    "are fine too. REJECT proper nouns (place names, person names, brands, landmarks), "
                    "non-standard slang, and dialect forms.\n"
                    "If it qualifies, reply with ONLY the English meaning used in THIS context, in 1-4 words.\n"
                    "If it does NOT qualify, reply with exactly: REJECT\n"
                    "No explanation, no Korean, no surrounding punctuation or quotes."
                ),
            },
            {"role": "user", "content": f"Candidate: {word}\nContext: {context}"},
        ]
        meaning = await llm_chat(messages, temperature=0.0, max_tokens=16)
        cleaned = meaning.strip().strip(".\"'“”' ")
        if not cleaned or cleaned.strip().upper().startswith("REJECT"):
            return ""
        return cleaned
    except Exception:
        return ""


async def extract_word_suggestion(reply: str) -> dict | None:
    """응답에서 한국어 단어 후보를 뽑고, 난이도 분류 모델로 순위를 매긴 뒤, 표준어
    명사/형용사 판정을 통과하는 첫 후보를 골라 영어 뜻을 붙인다.

    예전엔 순위 1위 후보를 무조건 반환해서, 그 단어가 고유명사거나 뜻 조회에 실패하면
    단어장에 빈 뜻 항목이 그대로 저장됐다. 이제는 후보를 순서대로 시도하다가 표준어
    판정+뜻 조회에 성공하는 첫 단어만 반환하고, 아무도 통과 못 하면(REJECT만 계속
    나오면) 이번 응답에서는 단어를 추천하지 않는다 — 빈 뜻으로 저장되느니 아예 추천을
    쉬는 편이 낫다. LLM 호출 비용을 감안해 최대 3개 후보까지만 시도한다.
    """
    korean_words = _get_word_candidates(reply)
    if not korean_words:
        return None

    levels = predict_word_levels(korean_words)
    if levels is None:
        ordered = sorted(korean_words, key=len)
    else:
        # 초급(이미 알 법한 단어)보다 중급/고급을 우선 시도
        ordered = sorted(korean_words, key=lambda w: _LEVEL_RANK.get(levels[w], 0), reverse=True)

    for word in ordered[:3]:
        meaning = await _lookup_word_meaning(word, reply)
        if meaning:
            return {
                "word": word,
                "meaning": meaning,
                "sentence": reply[:60],
                "level": (levels[word] if levels else None),
            }

    return None
