"""
기억 라우터 — POST /memory
채팅 세션 종료 시 추출된 기억을 저장한다 (추출 자체는 프론트에서 LLM으로 수행).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.schemas import MemoryCreateRequest, MemoryCreateResponse, MemoryResponse
from models.models import Character, Memory, User
from services.access_control import check_character_access
from services.session_auth import require_current_user, require_same_user
import uuid

router = APIRouter(prefix="/memory", tags=["memory"])

MAX_MEMORIES_PER_REQUEST = 4
MAX_MEMORY_CONTENT_CHARS = 500
MAX_MEMORIES_PER_CHARACTER = 50


def validate_memory_payload(req: MemoryCreateRequest) -> None:
    if len(req.memories) > MAX_MEMORIES_PER_REQUEST:
        raise HTTPException(status_code=413, detail="Too many memories in one request.")
    if any(not item.content.strip() for item in req.memories):
        raise HTTPException(status_code=400, detail="Memory content cannot be empty.")
    if any(len(item.content) > MAX_MEMORY_CONTENT_CHARS for item in req.memories):
        raise HTTPException(status_code=413, detail="Memory content is too long.")


@router.post("", response_model=MemoryCreateResponse)
def create_memories(req: MemoryCreateRequest, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, req.user_id)
    validate_memory_payload(req)
    """추출된 기억들을 저장한다"""
    user = db.query(User).filter(User.id == req.user_id).first()
    character = db.query(Character).filter(Character.id == req.character_id).first()
    if not user or not character:
        raise HTTPException(status_code=404, detail="User or character not found.")
    check_character_access(user, character)

    existing = (
        db.query(Memory)
        .filter(Memory.user_id == req.user_id, Memory.character_id == req.character_id)
        .order_by(Memory.created_at.desc())
        .limit(MAX_MEMORIES_PER_CHARACTER)
        .all()
    )
    existing_contents = {entry.content.strip() for entry in existing}
    available_slots = max(0, MAX_MEMORIES_PER_CHARACTER - len(existing))
    new_items = []
    for item in req.memories[:available_slots]:
        normalized = item.content.strip()
        if normalized in existing_contents:
            continue
        existing_contents.add(normalized)
        new_items.append((item, normalized))

    saved: list[Memory] = []
    for m, normalized_content in new_items:
        entry = Memory(
            id=str(uuid.uuid4()),
            user_id=req.user_id,
            character_id=req.character_id,
            type=m.type,
            content=normalized_content,
        )
        db.add(entry)
        saved.append(entry)
    db.commit()
    for entry in saved:
        db.refresh(entry)

    return MemoryCreateResponse(
        saved_memories=[
            MemoryResponse(
                id=e.id,
                character_id=e.character_id,
                type=e.type.value if hasattr(e.type, "value") else e.type,
                content=e.content,
                created_at=e.created_at.isoformat(),
            )
            for e in saved
        ]
    )
