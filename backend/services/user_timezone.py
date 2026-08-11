"""User-local calendar helpers while database timestamps remain UTC."""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def user_zone(user) -> ZoneInfo:
    try:
        return ZoneInfo(user.timezone_name or "UTC")
    except ZoneInfoNotFoundError:
        return ZoneInfo("UTC")


def local_today(user):
    return datetime.now(user_zone(user)).date()


def local_day_utc_bounds(user):
    zone = user_zone(user)
    now = datetime.now(zone)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    return (
        start.astimezone(timezone.utc).replace(tzinfo=None),
        end.astimezone(timezone.utc).replace(tzinfo=None),
    )
