"""
채팅 라우터 — POST /chat
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.schemas import ChatRequest, ChatResponse, WordSuggestion
from services.llm_service import (
    load_persona, build_system_prompt, llm_chat, extract_word_suggestion
)
from models.models import Character, Memory, Progress
from routers.progress import apply_streak
import uuid

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    """LLM 대화 엔드포인트"""

    # 1. 캐릭터 존재 확인
    character = db.query(Character).filter(Character.id == req.character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail=f"Character '{req.character_id}' not found")

    # 2. 기장 페르소나 로드
    persona = load_persona(req.character_id)

    # 3. 기억 로드 (최근 5개)
    memories = (
        db.query(Memory)
        .filter(Memory.user_id == req.user_id, Memory.character_id == req.character_id)
        .order_by(Memory.created_at.desc())
        .limit(5)
        .all()
    )
    memory_contents = [m.content for m in memories]

    # 4. 시스템 프롬프트 조합
    system_prompt = build_system_prompt(
        persona=persona,
        memories=memory_contents,
        user_language=req.user_language,
    )

    # 5. 메시지 구성
    messages = [{"role": "system", "content": system_prompt}]
    for msg in req.session_history[-10:]:  # 최근 10개만
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.user_message})

    # 6. LLM 호출
    reply = await llm_chat(messages, temperature=0.6, max_tokens=256)

    # 7. 호감도 업데이트 + 연속 일수 갱신
    progress = (
        db.query(Progress)
        .filter(Progress.user_id == req.user_id, Progress.character_id == req.character_id)
        .first()
    )
    if not progress:
        progress = Progress(id=str(uuid.uuid4()), user_id=req.user_id, character_id=req.character_id)
        db.add(progress)
        db.flush()
    progress.affinity = min(100, progress.affinity + 1)
    apply_streak(progress)
    db.commit()

    # 8. 단어 추출
    word_data = extract_word_suggestion(reply)
    word_suggestion = WordSuggestion(**word_data) if word_data else None

    # 9. 되짚기 카드 — 세션 초반(첫 대화)에만, 저장된 기억이 있으면 보여준다
    callback_memory = (
        memory_contents[0] if memory_contents and len(req.session_history) <= 1 else None
    )

    return ChatResponse(
        reply=reply,
        callback_memory=callback_memory,
        word_suggestion=word_suggestion,
        affinity_delta=1,
    )
