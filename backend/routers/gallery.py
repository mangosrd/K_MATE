"""
기장 사진첩 라우터 — GET /gallery/{character_id}, POST /gallery/unlock

캐릭터별 스탠딩 일러스트 카탈로그(gallery_images, 모든 유저 공통)에서 이미지 목록을
가져오고, 유저별 해금 여부(user_gallery_unlocks)를 함께 계산해 돌려준다. 해금은
일기 해금(diary.py의 unlock_diary)과 동일하게 Economy 코인을 차감하는 방식이다.
"""

import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.schemas import GalleryImageResponse, GalleryUnlockRequest, GalleryUnlockResponse
from services.access_control import check_character_access
from models.models import GalleryImage, UserGalleryUnlock, Economy, User, Character
from services.wallet import change_coins
from services.session_auth import require_current_user, require_same_user

router = APIRouter(prefix="/gallery", tags=["gallery"])


@router.get("/{character_id}", response_model=list[GalleryImageResponse])
def get_gallery(character_id: str, user_id: str, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, user_id)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail=f"Character '{character_id}' not found")
    check_character_access(user, character)

    images = (
        db.query(GalleryImage)
        .filter(GalleryImage.character_id == character_id)
        .order_by(GalleryImage.order)
        .all()
    )
    unlocked_ids = {
        u.image_id
        for u in db.query(UserGalleryUnlock).filter(UserGalleryUnlock.user_id == user_id).all()
    }
    return [
        GalleryImageResponse(
            id=img.id,
            image_url=img.image_url,
            title=img.title,
            order=img.order,
            unlock_cost=img.unlock_cost,
            unlocked=(img.unlock_cost == 0) or (img.id in unlocked_ids),
        )
        for img in images
    ]


@router.post("/unlock", response_model=GalleryUnlockResponse)
def unlock_gallery_image(req: GalleryUnlockRequest, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, req.user_id)
    image = db.query(GalleryImage).filter(GalleryImage.id == req.image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다")

    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{req.user_id}' not found")
    character = db.query(Character).filter(Character.id == image.character_id).first()
    if character:
        check_character_access(user, character)

    # with_for_update로 잠가서, 연타나 이중 요청으로 같은 유저의 두 요청이 거의 동시에
    # 들어와도 코인 차감이 한쪽만 반영되거나 잔액이 꼬이지 않게 한다.
    economy = db.query(Economy).filter(Economy.user_id == req.user_id).with_for_update().first()
    if not economy:
        raise HTTPException(status_code=404, detail="Economy record not found")

    existing = (
        db.query(UserGalleryUnlock)
        .filter(UserGalleryUnlock.user_id == req.user_id, UserGalleryUnlock.image_id == req.image_id)
        .first()
    )
    if existing or image.unlock_cost == 0:
        # 이미 해금됐거나 원래 무료인 이미지 — 코인은 다시 차감하지 않고 현재 잔액만 돌려준다
        return GalleryUnlockResponse(success=True, remaining_coins=economy.coins, message="이미 해금된 사진입니다")

    if economy.coins < image.unlock_cost:
        raise HTTPException(status_code=400, detail="코인이 부족합니다")

    economy = change_coins(db, req.user_id, -image.unlock_cost, "gallery_unlock", reference_type="gallery_image", reference_id=image.id)
    db.add(UserGalleryUnlock(id=str(uuid.uuid4()), user_id=req.user_id, image_id=req.image_id))
    db.commit()

    return GalleryUnlockResponse(
        success=True,
        remaining_coins=economy.coins,
        message=f"사진을 해금했습니다. 잔여 코인: {economy.coins}",
    )
