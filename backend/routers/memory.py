"""
기억 라우터 — POST /memory
채팅 세션 종료 시 추출된 기억을 저장한다 (추출 자체는 프론트에서 LLM으로 수행).
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.schemas import MemoryCreateRequest, MemoryCreateResponse, MemoryResponse
from models.models import Memory
import uuid

router = APIRouter(prefix="/memory", tags=["memory"])


@router.post("", response_model=MemoryCreateResponse)
def create_memories(req: MemoryCreateRequest, db: Session = Depends(get_db)):
    """추출된 기억들을 저장한다"""
    saved: list[Memory] = []
    for m in req.memories:
        entry = Memory(
            id=str(uuid.uuid4()),
            user_id=req.user_id,
            character_id=req.character_id,
            type=m.type,
            content=m.content,
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
