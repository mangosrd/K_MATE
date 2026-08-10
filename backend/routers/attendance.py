"""Weekly attendance rewards, calculated using Korea Standard Time."""

import uuid
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models.models import User, WeeklyAttendanceClaim
from services.wallet import change_coins, get_wallet

router = APIRouter(prefix="/attendance", tags=["attendance"])
KST = ZoneInfo("Asia/Seoul")


def _today():
    return datetime.now(KST).date()


def _reward(day) -> int:
    return 3 if day.weekday() < 5 else 5


def _status(db: Session, user_id: str):
    today = _today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    claims = db.query(WeeklyAttendanceClaim).filter(
        WeeklyAttendanceClaim.user_id == user_id,
        WeeklyAttendanceClaim.claim_date.between(week_start, week_end),
    ).all()
    claimed = {row.claim_date: row.reward_coins for row in claims}
    wallet = get_wallet(db, user_id, lock=False)
    return {
        "week_start": week_start.isoformat(),
        "today": today.isoformat(),
        "claimed_today": today in claimed,
        "can_claim": today not in claimed,
        "current_coins": wallet.coins,
        "days": [
            {
                "date": (week_start + timedelta(days=index)).isoformat(),
                "reward": _reward(week_start + timedelta(days=index)),
                "claimed": (week_start + timedelta(days=index)) in claimed,
                "is_today": (week_start + timedelta(days=index)) == today,
                "is_past": (week_start + timedelta(days=index)) < today,
            }
            for index in range(7)
        ],
    }


@router.get("/{user_id}")
def attendance_status(user_id: str, db: Session = Depends(get_db)):
    if not db.query(User.id).filter(User.id == user_id).first():
        raise HTTPException(status_code=404, detail="User not found")
    return _status(db, user_id)


@router.post("/{user_id}/claim")
def claim_attendance(user_id: str, db: Session = Depends(get_db)):
    if not db.query(User.id).filter(User.id == user_id).first():
        raise HTTPException(status_code=404, detail="User not found")
    today = _today()
    week_start = today - timedelta(days=today.weekday())
    if db.query(WeeklyAttendanceClaim.id).filter(
        WeeklyAttendanceClaim.user_id == user_id,
        WeeklyAttendanceClaim.claim_date == today,
    ).first():
        result = _status(db, user_id)
        result["coins_awarded"] = 0
        return result

    reward = _reward(today)
    try:
        db.add(WeeklyAttendanceClaim(
            id=str(uuid.uuid4()), user_id=user_id, claim_date=today,
            week_start=week_start, reward_coins=reward,
        ))
        db.flush()
        change_coins(
            db, user_id, reward, "weekly_attendance",
            reference_type="attendance", reference_id=today.isoformat(),
            description=f"Weekly attendance reward ({reward} coins)",
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        reward = 0

    result = _status(db, user_id)
    result["coins_awarded"] = reward
    return result
