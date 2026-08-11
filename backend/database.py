"""
K-MATE MySQL 데이터베이스 연결 설정
SQLAlchemy 2.x + PyMySQL
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from pydantic_settings import BaseSettings
from functools import lru_cache
import os
import traceback
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # Railway가 자동으로 주입하는 통합 DB URL (있으면 최우선 사용)
    database_url: str = ""
    # 개별 MySQL 접속 정보 (로컬 개발 또는 DATABASE_URL 없을 때 사용)
    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_user: str = "root"
    mysql_password: str = ""
    mysql_db: str = "kmate"
    gemini_api_key: str = ""
    frontend_url: str = "http://localhost:3000"
    google_play_package_name: str = "com.kmate.app"
    google_play_service_account_file: str = ""
    google_client_id: str = ""
    google_client_secret: str = ""
    # Railway public domain used by the Google OAuth redirect URI.
    backend_public_url: str = "https://kmate-production.up.railway.app"
    internal_api_secret: str = ""
    portone_api_secret: str = ""
    support_to_email: str = ""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    resend_api_key: str = ""
    support_from_email: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


def get_db_url(settings: Settings | None = None) -> str:
    s = settings or get_settings()
    # Railway가 DATABASE_URL을 자동으로 주입하면 그걸 우선 사용한다.
    # MySQL(mysql://) → pymysql 드라이버로 교체, PostgreSQL은 그대로.
    if s.database_url:
        url = s.database_url
        if url.startswith("mysql://"):
            url = url.replace("mysql://", "mysql+pymysql://", 1)
        return url
    # 로컬 개발: 개별 MYSQL_* 변수로 조합
    return (
        f"mysql+pymysql://{s.mysql_user}:{s.mysql_password}"
        f"@{s.mysql_host}:{s.mysql_port}/{s.mysql_db}"
        f"?charset=utf8mb4"
    )



# SQLAlchemy 엔진
engine = create_engine(
    get_db_url(),
    pool_pre_ping=True,        # 연결 유효성 확인
    pool_recycle=3600,         # 1시간마다 연결 재생성
    pool_size=10,
    max_overflow=20,
    echo=False,                # SQL 로깅 (개발시 True)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI 의존성 주입용 DB 세션 생성기"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_connection() -> bool:
    """DB 연결 상태 확인"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"[DB] 연결 실패: {e}")
        return False


def initialize_database() -> bool:
    """Create tables and essential reference data for a new deployment."""
    try:
        # Register every model before creating the schema. Local import avoids
        # the database <-> model import cycle during normal application load.
        import models.models  # noqa: F401

        Base.metadata.create_all(bind=engine)
        # create_all does not add columns to an already deployed table. Keep this
        # tiny migration idempotent so Railway upgrades existing user data safely.
        with engine.begin() as connection:
            has_last_study_at = connection.execute(
                text("""
                    SELECT COUNT(*) FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                      AND table_name = 'progress'
                      AND column_name = 'last_study_at'
                """)
            ).scalar()
            if not has_last_study_at:
                connection.execute(text("ALTER TABLE progress ADD COLUMN last_study_at DATETIME NULL"))
            user_columns = {
                row[0] for row in connection.execute(
                    text("""
                        SELECT column_name FROM information_schema.columns
                        WHERE table_schema = DATABASE() AND table_name = 'users'
                    """)
                ).all()
            }
            if "timezone_name" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN timezone_name VARCHAR(64) NOT NULL DEFAULT 'UTC'"))
            if "timezone_mode" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN timezone_mode VARCHAR(10) NOT NULL DEFAULT 'auto'"))
            if "timezone_updated_at" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN timezone_updated_at DATETIME NULL"))
        regions = [
            ("seoul", "서울·경기", "Seoul & Gyeonggi", "SEL", False),
            ("jeonju", "전주·전라", "Jeonju & Jeolla", "JWJ", False),
            ("busan", "부산·경남", "Busan & Gyeongnam", "PUS", True),
            ("chungcheong", "충청·공주", "Chungcheong & Gongju", "OSN", True),
            ("jeju", "제주", "Jeju Island", "CJU", True),
        ]
        characters = [
            ("kyuhyun", "seoul", "규현", False),
            ("haneul", "jeonju", "하늘", False),
            ("sunwoo", "busan", "선우", True),
            ("sangwoo", "chungcheong", "상우", True),
            ("yongwoo", "jeju", "용우", True),
        ]
        gallery_images = [
            ("gallery-kyuhyun-01", "kyuhyun", "/gallery/kyuhyun/standing-01.png", "Yang Kyuhyun", 1, 0),
            ("gallery-haneul-01", "haneul", "/gallery/haneul/standing-01.png", "Oh Haneul", 1, 0),
            ("gallery-sunwoo-01", "sunwoo", "/gallery/sunwoo/standing-01.png", "Cha Sunwoo", 1, 0),
            ("gallery-sangwoo-01", "sangwoo", "/gallery/sangwoo/standing-01.png", "Cheon Sangwoo", 1, 0),
            ("gallery-yongwoo-01", "yongwoo", "/gallery/yongwoo/standing-01.png", "Kwon Yongwoo", 1, 0),
        ]
        # First portrait is free. The remaining uploaded gallery images are
        # individual coin unlocks and are seeded safely on every startup.
        gallery_photo_numbers = {
            "kyuhyun": [*range(1, 12), 13],
            "haneul": list(range(1, 12)),
            "sunwoo": list(range(1, 8)),
            "sangwoo": list(range(1, 11)),
            "yongwoo": list(range(1, 11)),
        }
        for character_id, photo_numbers in gallery_photo_numbers.items():
            for image_order, photo_number in enumerate(photo_numbers, start=2):
                gallery_images.append(
                    (
                        f"gallery-{character_id}-{image_order:02d}",
                        character_id,
                        f"/gallery/{character_id}/photo-{photo_number:02d}.png",
                        None,
                        image_order,
                        5,
                    )
                )
        with engine.begin() as connection:
            for region_id, name, name_en, airport_code, is_locked in regions:
                connection.execute(
                    text("INSERT INTO regions (id, name, name_en, airport_code, is_locked) VALUES (:id, :name, :name_en, :airport_code, :is_locked) ON DUPLICATE KEY UPDATE id = id"),
                    {"id": region_id, "name": name, "name_en": name_en, "airport_code": airport_code, "is_locked": is_locked},
                )
            for character_id, region_id, name, requires_premium in characters:
                connection.execute(
                    text("INSERT INTO characters (id, region_id, name, requires_premium) VALUES (:id, :region_id, :name, :requires_premium) ON DUPLICATE KEY UPDATE id = id"),
                    {"id": character_id, "region_id": region_id, "name": name, "requires_premium": requires_premium},
                )
        with engine.begin() as connection:
            for image_id, character_id, image_url, title, image_order, unlock_cost in gallery_images:
                connection.execute(
                    text("INSERT INTO gallery_images (id, character_id, image_url, title, `order`, unlock_cost) VALUES (:id, :character_id, :image_url, :title, :image_order, :unlock_cost) ON DUPLICATE KEY UPDATE id = id"),
                    {"id": image_id, "character_id": character_id, "image_url": image_url, "title": title, "image_order": image_order, "unlock_cost": unlock_cost},
                )
        story_seed = {
            "kyuhyun": [("첫 비행", "베테랑 기장이 처음 조종간을 잡던 날"), ("밤의 활주로", "웃음 뒤에 숨겨 둔 오래된 약속"), ("다시, 이 노선", "그가 같은 노선을 계속 선택한 이유")],
            "haneul": [("말보다 느린 마음", "무뚝뚝한 부기장의 첫 진심"), ("구름 사이", "흐린 날에만 떠오르는 기억"), ("착륙 후에", "끝내 전하지 못했던 한마디")],
            "sunwoo": [("여름의 비행장", "장난꾸러기 소년의 꿈"), ("비타민의 비밀", "늘 웃어야 했던 진짜 이유"), ("네가 탄 비행기", "친구라는 선을 넘은 순간")],
            "sangwoo": [("관제탑의 원칙", "FM 기장이 원칙을 세운 날"), ("예외 항목", "완벽한 계획에 없던 한 사람"), ("직진 허가", "사랑만큼은 우회하지 않기로 한 결심")],
            "yongwoo": [("형의 자리", "누군가를 지키는 일이 익숙해진 이유"), ("잔소리의 온도", "거친 말 뒤에 감춘 걱정"), ("제주로 가는 길", "다시 돌아오겠다는 약속")],
        }
        with engine.begin() as connection:
            for character_id, episodes in story_seed.items():
                for episode_number, (title, summary) in enumerate(episodes, start=1):
                    story_id = f"backstory-{character_id}-{episode_number}"
                    body = f"{title}\n\n{summary}. 비행 전 조용한 라운지에서 {character_id}은 오래 간직해 온 기억을 천천히 꺼냈다. 익숙한 유니폼과 침착한 표정 뒤에도 처음 하늘을 올려다보던 날의 설렘은 그대로 남아 있었다.\n\n그날의 선택은 지금의 그를 만들었다. 그리고 이제, 누구에게도 말하지 않았던 이 이야기를 당신에게만 들려주기로 했다."
                    connection.execute(
                        text("INSERT INTO premium_stories (id, character_id, episode_number, title, summary, body, unlock_cost, is_published) VALUES (:id, :character_id, :episode_number, :title, :summary, :body, 10, 1) ON DUPLICATE KEY UPDATE title=VALUES(title), summary=VALUES(summary), body=VALUES(body), unlock_cost=10"),
                        {"id": story_id, "character_id": character_id, "episode_number": episode_number, "title": title, "summary": summary, "body": body},
                    )
        print("[DB] schema and seed data are ready", flush=True)
        return True
    except Exception as e:
        print(f"[DB] schema initialization failed ({type(e).__name__}): {e!r}", flush=True)
        traceback.print_exc()
        return False
