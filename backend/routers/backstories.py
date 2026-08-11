import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.models import Character, PremiumStory, User, UserStoryUnlock
from schemas.schemas import PremiumStoryItemResponse, PremiumStoryUnlockRequest, PremiumStoryUnlockResponse
from services.wallet import change_coins, get_wallet
from services.access_control import check_character_access
from services.session_auth import require_current_user, require_same_user

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
def list_backstories(character_id: str, user_id: str, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, user_id)
    user = db.query(User).filter(User.id == user_id).first()
    character = db.query(Character).filter(Character.id == character_id).first()
    if not user or not character:
        raise HTTPException(status_code=404, detail="User or character not found")
    check_character_access(user, character)
    stories = db.query(PremiumStory).filter(
        PremiumStory.character_id == character_id, PremiumStory.is_published.is_(True)
    ).order_by(PremiumStory.episode_number).all()
    unlocked = {row.story_id for row in db.query(UserStoryUnlock).filter(UserStoryUnlock.user_id == user_id).all()}
    return [_item(story, story.id in unlocked) for story in stories]


@router.post("/{story_id}/unlock", response_model=PremiumStoryUnlockResponse)
def unlock_backstory(story_id: str, req: PremiumStoryUnlockRequest, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, req.user_id)
    story = db.query(PremiumStory).filter(PremiumStory.id == story_id, PremiumStory.is_published.is_(True)).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    user = db.query(User).filter(User.id == req.user_id).first()
    character = db.query(Character).filter(Character.id == story.character_id).first()
    if not user or not character:
        raise HTTPException(status_code=404, detail="User or character not found")
    check_character_access(user, character)
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
