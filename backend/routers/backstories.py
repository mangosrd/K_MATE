import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.models import PremiumStory, User, UserStoryUnlock
from schemas.schemas import PremiumStoryItemResponse, PremiumStoryUnlockRequest, PremiumStoryUnlockResponse
from services.wallet import change_coins, get_wallet

router = APIRouter(prefix="/backstories", tags=["backstories"])
BACKSTORY_COST = 10


def _item(story: PremiumStory, unlocked: bool) -> PremiumStoryItemResponse:
    return PremiumStoryItemResponse(
        id=story.id, character_id=story.character_id,
        episode_number=story.episode_number, title=story.title,
        summary=story.summary, body=story.body if unlocked else None,
        unlock_cost=story.unlock_cost, unlocked=unlocked,
    )


@router.get("/{character_id}", response_model=list[PremiumStoryItemResponse])
def list_backstories(character_id: str, user_id: str, db: Session = Depends(get_db)):
    if not db.query(User.id).filter(User.id == user_id).first():
        raise HTTPException(status_code=404, detail="User not found")
    stories = db.query(PremiumStory).filter(
        PremiumStory.character_id == character_id, PremiumStory.is_published.is_(True)
    ).order_by(PremiumStory.episode_number).all()
    unlocked = {row.story_id for row in db.query(UserStoryUnlock).filter(UserStoryUnlock.user_id == user_id).all()}
    return [_item(story, story.id in unlocked) for story in stories]


@router.post("/{story_id}/unlock", response_model=PremiumStoryUnlockResponse)
def unlock_backstory(story_id: str, req: PremiumStoryUnlockRequest, db: Session = Depends(get_db)):
    story = db.query(PremiumStory).filter(PremiumStory.id == story_id, PremiumStory.is_published.is_(True)).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    if not db.query(User.id).filter(User.id == req.user_id).first():
        raise HTTPException(status_code=404, detail="User not found")
    existing = db.query(UserStoryUnlock).filter(
        UserStoryUnlock.user_id == req.user_id, UserStoryUnlock.story_id == story_id
    ).first()
    if existing:
        wallet = get_wallet(db, req.user_id)
        return PremiumStoryUnlockResponse(success=True, remaining_coins=wallet.coins, story=_item(story, True))
    wallet = change_coins(
        db, req.user_id, -story.unlock_cost, "backstory_unlock",
        reference_type="premium_story", reference_id=story.id,
        description=f"{story.character_id} backstory episode {story.episode_number}",
    )
    db.add(UserStoryUnlock(
        id=str(uuid.uuid4()), user_id=req.user_id, story_id=story.id,
        coins_spent=story.unlock_cost,
    ))
    db.commit()
    return PremiumStoryUnlockResponse(success=True, remaining_coins=wallet.coins, story=_item(story, True))
