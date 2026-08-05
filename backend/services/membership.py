"""Premium entitlement lifecycle helpers.

The payment provider confirms a purchase; this module owns the separate
question of how long that purchase grants access inside K-MATE.
"""
from calendar import monthrange
from datetime import datetime
import uuid

from sqlalchemy.orm import Session

from models.models import Membership, User


def _one_calendar_month_after(value: datetime) -> datetime:
    """Keep the same day where possible, otherwise use the month's last day."""
    year = value.year + (1 if value.month == 12 else 0)
    month = 1 if value.month == 12 else value.month + 1
    return value.replace(year=year, month=month, day=min(value.day, monthrange(year, month)[1]))


def activate_monthly_premium(db: Session, user: User, price_krw: int) -> datetime:
    """Grant one calendar month, extending an active entitlement if it exists."""
    now = datetime.now()
    membership = db.query(Membership).filter(Membership.user_id == user.id).with_for_update().first()
    starts_at = now

    if membership and membership.expires_at and membership.expires_at > now:
        starts_at = membership.expires_at

    expires_at = _one_calendar_month_after(starts_at)
    if not membership:
        membership = Membership(
            id=str(uuid.uuid4()),
            user_id=user.id,
            tier="premium",
            started_at=now,
            expires_at=expires_at,
            price_krw=price_krw,
        )
        db.add(membership)
    else:
        membership.tier = "premium"
        membership.expires_at = expires_at
        membership.price_krw = price_krw

    user.membership = "premium"
    return expires_at


def expire_premium_if_needed(db: Session, user: User) -> bool:
    """Downgrade an expired paid entitlement. Returns true when it changed."""
    membership = db.query(Membership).filter(Membership.user_id == user.id).first()
    if not membership or not membership.expires_at or membership.expires_at > datetime.now():
        return False
    if user.membership == "premium":
        user.membership = "free"
        membership.tier = "free"
        db.commit()
        return True
    return False
