"""
채팅 라우터 — POST /chat
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.schemas import ChatRequest, ChatResponse
from services.llm_service import (
    load_persona, build_system_prompt, llm_chat
)
from models.models import Character, Memory, Progress, User, Economy
from routers.progress import record_daily_affinity
from services.access_control import check_character_access
import uuid

router = APIRouter(prefix="/chat", tags=["chat"])

FREE_CHAT_LIMIT = 10
CHAT_COIN_COST = 2


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    """LLM 대화 엔드포인트"""

    # 1. 캐릭터 존재 확인
    character = db.query(Character).filter(Character.id == req.character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail=f"Character '{req.character_id}' not found")

    # 1-1. 무료 회원 대화 횟수 제한 — 계정(User row)에 귀속되므로 재접속해도 초기화되지
    # 않는다. LLM을 부르기 전에 먼저 막아서 어차피 거절할 요청에 API 비용을 쓰지 않는다.
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{req.user_id}' not found")

    # 1-1-1. 프리미엄 전용 캐릭터인데 이 유저는 접근 권한이 없으면 여기서 막는다 —
    # 프론트 잠금 화면은 API를 직접 호출하면 우회되므로 서버에서도 검증해야 한다.
    check_character_access(user, character)

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

    # 6. LLM 호출 (기본 모델 = gemini-flash-lite-latest, llm_chat 기본값 그대로 사용)
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
    # Chat can grow affinity, but only completed lessons earn a day streak.
    record_daily_affinity(progress)

    # 7-1. 무료 회원이면 대화 횟수 차감(정상적으로 답변을 받은 경우에만 카운트)
    # with_for_update로 다시 잠깐 잠가서 증가시킨다 — LLM 호출이 끝난 뒤라 잠그는 구간이
    # 짧다(맨 위에서부터 잠그면 LLM 응답 기다리는 몇 초 동안 같은 유저의 다른 요청이
    # 전부 막혀버린다). 이 좁은 구간만 잠가도 카운터가 두 요청 사이에 유실되는 걸 막을 수 있다.
    free_messages_remaining = None
    coins_spent = 0
    remaining_coins = None
    if user.membership != "premium":
        locked_user = db.query(User).filter(User.id == req.user_id).with_for_update().first()
        if locked_user.free_chat_count < FREE_CHAT_LIMIT:
            locked_user.free_chat_count += 1
            free_messages_remaining = FREE_CHAT_LIMIT - locked_user.free_chat_count
        else:
            economy = (
                db.query(Economy)
                .filter(Economy.user_id == req.user_id)
                .with_for_update()
                .first()
            )
            if not economy or economy.coins < CHAT_COIN_COST:
                raise HTTPException(
                    status_code=402,
                    detail=f"Free messages are used. Each chat costs {CHAT_COIN_COST} coins.",
                )
            from services.wallet import change_coins
            economy = change_coins(db, req.user_id, -CHAT_COIN_COST, "chat_message", reference_type="character", reference_id=req.character_id)
            coins_spent = CHAT_COIN_COST
            remaining_coins = economy.coins

    db.commit()

    # 대화는 친밀도와 기억에만 사용한다. 수업용 단어장은 정규 학습에서만 채운다.
    # 8. 되짚기 카드 — 세션 초반(첫 대화)에만, 저장된 기억이 있으면 보여준다
    callback_memory = (
        memory_contents[0] if memory_contents and len(req.session_history) <= 1 else None
    )

    return ChatResponse(
        reply=reply,
        callback_memory=callback_memory,
        word_suggestion=None,
        affinity_delta=1,
        free_messages_remaining=free_messages_remaining,
        coins_spent=coins_spent,
        remaining_coins=remaining_coins,
    )
