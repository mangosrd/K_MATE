"""
일회성 유지보수 스크립트 — 레벨 시스템을 새로 붙이면서(routers/progress.py의
compute_level), 이미 활동 기록이 있는 기존 계정들의 users.level이 그동안 계속
갱신 안 된 채로(기본값 1) 멈춰 있던 걸 지금 시점의 실제 누적 진도 기준으로
한 번에 맞춰준다. 그 이후로는 PUT /progress가 호출될 때마다 자동으로 갱신된다.

실행: cd backend && python scripts/recompute_levels.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models.models import User, Progress
from routers.progress import compute_level
from sqlalchemy import func


def main():
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.is_withdrawn == False).all()  # noqa: E712
        changed = 0
        for user in users:
            total_xp = (
                db.query(func.sum(Progress.current_step))
                .filter(Progress.user_id == user.id)
                .scalar()
            ) or 0
            new_level = compute_level(total_xp)
            if new_level != user.level:
                print(f"{user.id} ({user.name}): level {user.level} -> {new_level} (xp={total_xp})")
                user.level = new_level
                changed += 1
        db.commit()
        print(f"\n완료: 총 {len(users)}명 중 {changed}명 레벨 갱신됨")
    finally:
        db.close()


if __name__ == "__main__":
    main()
