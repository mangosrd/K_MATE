"""
단어장 라우터 — GET/POST /vocab
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.schemas import VocabItemCreate, VocabItemResponse, VocabReviewUpdate
from models.models import VocabItem
import uuid

router = APIRouter(prefix="/vocab", tags=["vocab"])


@router.get("/{user_id}", response_model=list[VocabItemResponse])
def get_all_vocab(user_id: str, db: Session = Depends(get_db)):
    """전체 단어장 조회"""
    items = db.query(VocabItem).filter(VocabItem.user_id == user_id).all()
    return _serialize_list(items)


@router.get("/{user_id}/region/{region_id}", response_model=list[VocabItemResponse])
def get_vocab_by_region(user_id: str, region_id: str, db: Session = Depends(get_db)):
    """지역별 단어장 조회"""
    items = (
        db.query(VocabItem)
        .filter(VocabItem.user_id == user_id, VocabItem.region_id == region_id)
        .all()
    )
    return _serialize_list(items)


@router.get("/{user_id}/character/{character_id}", response_model=list[VocabItemResponse])
def get_vocab_by_character(user_id: str, character_id: str, db: Session = Depends(get_db)):
    """캐릭터별 단어장 조회"""
    items = (
        db.query(VocabItem)
        .filter(VocabItem.user_id == user_id, VocabItem.character_id == character_id)
        .all()
    )
    return _serialize_list(items)


@router.post("", response_model=VocabItemResponse, status_code=201)
def add_vocab(req: VocabItemCreate, db: Session = Depends(get_db)):
    """단어 저장"""
    item = VocabItem(
        id=str(uuid.uuid4()),
        user_id=req.user_id,
        character_id=req.character_id,
        region_id=req.region_id,
        word=req.word,
        reading=req.reading,
        meaning=req.meaning,
        sentence=req.sentence,
        sentence_translation=req.sentence_translation,
        mastery="new",
        tags=req.tags,
        review_count=0,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _serialize(item)


@router.delete("/{user_id}", status_code=204)
def delete_all_vocab(user_id: str, db: Session = Depends(get_db)):
    """단어장 전체 초기화 — 해당 유저의 모든 단어를 DB에서 삭제한다."""
    db.query(VocabItem).filter(VocabItem.user_id == user_id).delete()
    db.commit()
    return


@router.put("/review", response_model=VocabItemResponse)
def update_mastery(req: VocabReviewUpdate, db: Session = Depends(get_db)):
    """단어 마스터리 업데이트"""
    item = db.query(VocabItem).filter(VocabItem.id == req.vocab_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Vocab item not found")
    item.mastery = req.mastery
    item.review_count = (item.review_count or 0) + 1
    db.commit()
    db.refresh(item)
    return _serialize(item)


# ── 직렬화 헬퍼 ───────────────────────────────────────────
def _serialize(item: VocabItem) -> VocabItemResponse:
    return VocabItemResponse(
        id=item.id,
        character_id=item.character_id,
        region_id=item.region_id,
        word=item.word,
        reading=item.reading,
        meaning=item.meaning,
        sentence=item.sentence,
        sentence_translation=item.sentence_translation,
        mastery=item.mastery,
        tags=item.tags or [],
        review_count=item.review_count or 0,
        last_reviewed_at=item.last_reviewed_at.isoformat() if item.last_reviewed_at else None,
    )

def _serialize_list(items: list) -> list[VocabItemResponse]:
    return [_serialize(i) for i in items]
