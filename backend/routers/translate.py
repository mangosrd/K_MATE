"""
번역 라우터 — POST /translate

챕터 콘텐츠(단어 뜻, 예문 번역 등)는 한국어+영어로만 작성돼 있다. UI 언어가 영어가
아닌 다른 언어(러시아어/중국어/일본어/태국어 등)일 때, 그 영어 텍스트를 LLM으로
번역해서 보여주고 결과를 캐싱한다. 수백 개 단어를 언어마다 전부 미리 번역해두는
대신, 실제로 조회되는 시점에만 번역하고 이후로는 DB 캐시로 즉시 응답한다.
"""

import hashlib
import re
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.schemas import TranslateRequest, TranslateResponse, TranslateItem
from models.models import TranslationCache
from services.llm_service import llm_chat

router = APIRouter(tags=["translate"])

LANG_NAMES = {
    "en": "English",
    "ko": "Korean",
    "ru": "Russian",
    "zh": "Simplified Chinese",
    "ja": "Japanese",
    "zh-TW": "Traditional Chinese",
    "th": "Thai",
}


def _hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


async def _translate_batch(items: list[TranslateItem], lang_name: str) -> list[str]:
    """번호가 매겨진 평문 목록으로 번역을 요청한다 — 작은 모델일수록 JSON 배열보다
    "1. 번역문" 같은 단순 줄바꿈 포맷이 훨씬 안정적으로 파싱된다.

    영어 글로스만 단독으로 주면 뜻이 모호해서(예: "Rumor" 혼자면 속어로 오역되기 쉬움)
    원본 한국어 단어/문장을 괄호로 같이 줘서 문맥을 잡아준다.
    """
    lines = []
    for i, item in enumerate(items):
        if item.context_ko:
            lines.append(f"{i+1}. {item.text} (Korean source: {item.context_ko})")
        else:
            lines.append(f"{i+1}. {item.text}")
    numbered = "\n".join(lines)

    prompt = (
        f"You are a precise dictionary translator for a Korean-language-learning app. "
        f"Translate each numbered line below into standard, dictionary-accurate {lang_name} — "
        f"the kind of wording you'd find in a formal bilingual dictionary, not slang or a loose "
        f"paraphrase. Each line is either a short vocabulary gloss (a word's core meaning) or an "
        f"example-sentence translation, given in Korean or English. Where a '(Korean source: ...)' note is "
        f"included, use it to resolve any ambiguity — translate the actual meaning of the Korean source, "
        f"not just the text in isolation. Output ONLY the {lang_name} "
        f"translation itself, without the Korean source note. "
        f"Reply with the exact same numbering, one translation per line, and nothing else "
        f"(no explanations, no extra commentary).\n\n{numbered}"
    )
    try:
        # temperature=0으로 최대한 결정적으로 — 짧은 단어 하나만 놓고 번역할 때 슬랭/오역으로
        # 새는 경우가 있어(예: "Rumor"→속어로 오역) 창의성을 최대한 배제한다.
        raw = await llm_chat(
            [{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=1024,
        )
    except Exception:
        return [item.text for item in items]

    parsed: dict[int, str] = {}
    for line in raw.splitlines():
        m = re.match(r"^\s*(\d+)[.\)]\s*(.+)$", line.strip())
        if m:
            idx = int(m.group(1)) - 1
            parsed[idx] = m.group(2).strip()

    return [parsed.get(i, items[i].text) for i in range(len(items))]


@router.post("/translate", response_model=TranslateResponse)
async def translate_texts(req: TranslateRequest, db: Session = Depends(get_db)):
    # items(문맥 포함)가 있으면 그걸 쓰고, 없으면 texts(하위 호환)로 문맥 없이 처리한다
    items = req.items if req.items else [TranslateItem(text=t) for t in req.texts]

    lang_name = LANG_NAMES.get(req.target_lang)
    if not lang_name or not items:
        return TranslateResponse(translations=[i.text for i in items])

    results: list[str | None] = [None] * len(items)
    to_translate: list[tuple[int, TranslateItem, str]] = []

    for i, item in enumerate(items):
        if not item.text or not item.text.strip():
            results[i] = item.text
            continue
        # 캐시 키는 원문+문맥까지 합쳐서 해시한다 — 같은 영어 글로스라도 문맥이 다르면
        # 다른 번역이 나올 수 있다
        h = _hash_text(item.text + "||" + (item.context_ko or ""))
        cached = (
            db.query(TranslationCache)
            .filter(TranslationCache.text_hash == h, TranslationCache.target_lang == req.target_lang)
            .first()
        )
        if cached:
            results[i] = cached.translated_text
        else:
            to_translate.append((i, item, h))

    if to_translate:
        translated_list = await _translate_batch([item for _, item, _ in to_translate], lang_name)
        for (orig_idx, item, h), translated in zip(to_translate, translated_list):
            results[orig_idx] = translated
            db.add(TranslationCache(
                id=str(uuid.uuid4()),
                text_hash=h,
                target_lang=req.target_lang,
                source_text=item.text,
                translated_text=translated,
            ))
        db.commit()

    return TranslateResponse(translations=[r if r is not None else "" for r in results])
