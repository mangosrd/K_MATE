"""
K-MATE FastAPI 메인 앱
Python 백엔드 진입점

실행:
  cd backend
  uvicorn main:app --reload --port 8000
"""

import sys
from threading import Thread
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import check_connection, get_settings, initialize_database
from routers import chat, diary, vocab, progress, memory, auth, account, translate, gallery, billing, letters, notifications, learning, backstories, attendance, notes
from schemas.schemas import HealthResponse

# Windows 콘솔(cp949)에서 이모지 print 시 UnicodeEncodeError로 서버가 죽는 것 방지
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 훅"""
    # Do not hold the HTTP server in startup while MySQL schema/seed work runs.
    # A slow connection or metadata lock previously left Railway at
    # "Waiting for application startup" and made every endpoint unavailable.
    def initialize_in_background():
        db_ok = initialize_database()
        if db_ok:
            print("[DB] MySQL initialization complete", flush=True)
        else:
            print("[DB] MySQL initialization failed", flush=True)

    Thread(target=initialize_in_background, name="database-initializer", daemon=True).start()
    yield
    print("👋 K-MATE 백엔드 종료")


app = FastAPI(
    title="K-MATE API",
    description="K-MATE 여행·학습 플랫폼 Python 백엔드",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 설정 (Next.js 프론트엔드 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(chat.router)
app.include_router(diary.router)
app.include_router(vocab.router)
app.include_router(progress.router)
app.include_router(memory.router)
app.include_router(auth.router)
app.include_router(account.router)
app.include_router(translate.router)
app.include_router(gallery.router)
app.include_router(billing.router)
app.include_router(letters.router)
app.include_router(notifications.router)
app.include_router(notes.router)
app.include_router(learning.router)
app.include_router(backstories.router)
app.include_router(attendance.router)


# ── 헬스체크 ──────────────────────────────────────────────
@app.get("/", response_model=HealthResponse, tags=["health"])
def health():
    return HealthResponse(
        status="ok",
        db_connected=check_connection(),
        version="1.0.0",
    )


@app.get("/health", response_model=HealthResponse, tags=["health"])
def health_detail():
    db_ok = check_connection()
    return HealthResponse(
        status="ok" if db_ok else "db_error",
        db_connected=db_ok,
    )
