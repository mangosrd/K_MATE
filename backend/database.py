"""
K-MATE MySQL 데이터베이스 연결 설정
SQLAlchemy 2.x + PyMySQL
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_user: str = "root"
    mysql_password: str = ""
    mysql_db: str = "kmate"
    groq_api_key: str = ""
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


def get_db_url(settings: Settings | None = None) -> str:
    s = settings or get_settings()
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
