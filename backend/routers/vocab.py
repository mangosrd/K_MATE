"""
단어장 라우터 — GET/POST /vocab
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.schemas import VocabItemCreate, VocabItemResponse, VocabReviewUpdate
from models.models import Character, User, VocabItem
import uuid
from services.access_control import check_character_access
from services.session_auth import require_current_user, require_same_user

router = APIRouter(prefix="/vocab", tags=["vocab"])
MAX_VOCAB_ITEMS_PER_USER = 2000
MAX_TAG_LENGTH = 50


def _clean_optional(value: str | None) -> str | None:
    cleaned = value.strip() if value else ""
    return cleaned or None


@router.get("/{user_id}", response_model=list[VocabItemResponse])
def get_all_vocab(user_id: str, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, user_id)
    """전체 단어장 조회"""
    items = db.query(VocabItem).filter(VocabItem.user_id == user_id).all()
    return _serialize_list(items)


@router.get("/{user_id}/region/{region_id}", response_model=list[VocabItemResponse])
def get_vocab_by_region(user_id: str, region_id: str, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, user_id)
    """지역별 단어장 조회"""
    items = (
        db.query(VocabItem)
        .filter(VocabItem.user_id == user_id, VocabItem.region_id == region_id)
        .all()
    )
    return _serialize_list(items)


@router.get("/{user_id}/character/{character_id}", response_model=list[VocabItemResponse])
def get_vocab_by_character(user_id: str, character_id: str, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, user_id)
    """캐릭터별 단어장 조회"""
    items = (
        db.query(VocabItem)
        .filter(VocabItem.user_id == user_id, VocabItem.character_id == character_id)
        .all()
    )
    return _serialize_list(items)


@router.post("", response_model=VocabItemResponse, status_code=201)
def add_vocab(req: VocabItemCreate, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, req.user_id)
    """단어 저장"""
    user = db.query(User).filter(User.id == req.user_id).first()
    character = db.query(Character).filter(Character.id == req.character_id).first()
    if not user or not character:
        raise HTTPException(status_code=404, detail="User or character not found")
    check_character_access(user, character)

    word = req.word.strip()
    meaning = req.meaning.strip()
    if not word or not meaning:
        raise HTTPException(status_code=422, detail="Word and meaning are required")

    region_id = _clean_optional(req.region_id)
    if region_id and region_id != character.region_id:
        raise HTTPException(status_code=422, detail="Character does not belong to this region")

    tags = [tag.strip() for tag in req.tags if tag.strip()]
    if any(len(tag) > MAX_TAG_LENGTH for tag in tags):
        raise HTTPException(status_code=422, detail=f"Tags must be at most {MAX_TAG_LENGTH} characters")

    existing = db.query(VocabItem).filter(
        VocabItem.user_id == req.user_id,
        VocabItem.character_id == req.character_id,
        VocabItem.word == word,
    ).first()
    if existing:
        existing.reading = _clean_optional(req.reading)
        existing.meaning = meaning
        existing.sentence = _clean_optional(req.sentence)
        existing.sentence_translation = _clean_optional(req.sentence_translation)
        existing.tags = tags
        db.commit()
        db.refresh(existing)
        return _serialize(existing)

    item_count = db.query(VocabItem).filter(VocabItem.user_id == req.user_id).count()
    if item_count >= MAX_VOCAB_ITEMS_PER_USER:
        raise HTTPException(status_code=409, detail="Vocab storage limit reached")

    item = VocabItem(
        id=str(uuid.uuid4()),
        user_id=req.user_id,
        character_id=req.character_id,
        region_id=region_id or character.region_id,
        word=word,
        reading=_clean_optional(req.reading),
        meaning=meaning,
        sentence=_clean_optional(req.sentence),
        sentence_translation=_clean_optional(req.sentence_translation),
        mastery="new",
        tags=tags,
        review_count=0,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _serialize(item)


@router.delete("/{user_id}", status_code=204)
def delete_all_vocab(user_id: str, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, user_id)
    """단어장 전체 초기화 — 해당 유저의 모든 단어를 DB에서 삭제한다."""
    db.query(VocabItem).filter(VocabItem.user_id == user_id).delete()
    db.commit()
    return


@router.put("/review", response_model=VocabItemResponse)
def update_mastery(req: VocabReviewUpdate, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    """단어 마스터리 업데이트"""
    item = db.query(VocabItem).filter(VocabItem.id == req.vocab_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Vocab item not found")
    require_same_user(current_user_id, item.user_id)
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
