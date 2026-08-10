"""
보상형 광고(리워드 광고) — 광고 한 편 볼 때마다 5코인, 하루 최대 100코인(20회)까지.

실제 서비스에서는 AdMob 같은 광고 SDK가 "광고가 끝까지 재생됐다"는 콜백을 주고 나서야
서버에 지급을 요청하는 게 원칙이다(안 그러면 광고 안 보고 그냥 버튼만 눌러서 코인을
받아갈 수 있다). 지금은 아직 광고 계정이 없어서 프론트가 시뮬레이션(카운트다운 모달)만
보여주고 바로 이 엔드포인트를 호출하는데, 나중에 실제 SDK를 붙이면 "보상 콜백이 온
경우에만 이 엔드포인트를 호출"하도록 프론트만 바꾸면 되고 이 로직은 그대로 재사용된다.
"""
from datetime import date
from sqlalchemy.orm import Session
from models.models import User
from services.wallet import change_coins

AD_COIN_REWARD = 5
AD_DAILY_CAP = 100
AD_MAX_WATCHES_PER_DAY = AD_DAILY_CAP // AD_COIN_REWARD  # 20


def _reset_if_new_day(user: User) -> None:
    today = date.today()
    if user.ad_coins_date != today:
        user.ad_coins_today = 0
        user.ad_coins_date = today


def get_ad_watches_remaining(db: Session, user: User) -> int:
    """오늘 남은 광고 시청 가능 횟수. 날짜가 바뀌었으면 그 자리에서 리셋하고 커밋한다."""
    _reset_if_new_day(user)
    db.commit()
    return (AD_DAILY_CAP - user.ad_coins_today) // AD_COIN_REWARD


def grant_ad_reward(db: Session, user_id: str) -> tuple[bool, int, int]:
    """광고 시청 보상을 지급한다. (성공 여부, 지급 후 오늘 남은 시청 가능 횟수, 지급 후 총 코인) 반환.

    with_for_update로 잠가서, 거의 동시에 두 번 눌러도(더블클릭 등) 하루 한도를
    넘겨 지급하지 않게 한다.
    """
    from models.models import Economy
    import uuid

    user = db.query(User).filter(User.id == user_id).with_for_update().first()
    if not user:
        raise ValueError("User not found")

    _reset_if_new_day(user)

    economy = db.query(Economy).filter(Economy.user_id == user_id).with_for_update().first()
    if not economy:
        economy = Economy(id=str(uuid.uuid4()), user_id=user_id, coins=0)
        db.add(economy)
        db.flush()

    if user.ad_coins_today + AD_COIN_REWARD > AD_DAILY_CAP:
        db.commit()
        return False, (AD_DAILY_CAP - user.ad_coins_today) // AD_COIN_REWARD, economy.coins

    user.ad_coins_today += AD_COIN_REWARD
    economy = change_coins(db, user_id, AD_COIN_REWARD, "ad_reward", reference_type="rewarded_ad")

    db.commit()
    return True, (AD_DAILY_CAP - user.ad_coins_today) // AD_COIN_REWARD, economy.coins
