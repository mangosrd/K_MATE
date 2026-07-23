# K-MATE Python 백엔드

K-MATE 여행·학습 플랫폼의 **Python FastAPI 백엔드**입니다.  
LLM 채팅(Groq), 일기 생성, 단어장, 진도 관리 API를 제공합니다.

---

## 📦 기술 스택

| 항목 | 버전 |
|------|------|
| Python | 3.11+ |
| FastAPI | 0.115 |
| SQLAlchemy | 2.0 |
| MySQL | 8.0+ |
| PyMySQL | 1.1 |
| Groq SDK | 0.11 |

---

## 🚀 빠른 시작

### 1. MySQL 준비

**옵션 A — 로컬 MySQL**
```bash
mysql -u root -p < sql/schema.sql
```

**옵션 B — Docker MySQL (MySQL 없을 때)**
```bash
docker run -d \
  --name kmate-mysql \
  -e MYSQL_ROOT_PASSWORD=kmate1234 \
  -e MYSQL_DATABASE=kmate \
  -p 3306:3306 \
  mysql:8.0

# DB 스키마 적용 (잠시 후 MySQL 기동 대기)
sleep 15
docker exec -i kmate-mysql mysql -u root -pkmate1234 kmate < sql/schema.sql
```

### 2. 환경변수 설정
```bash
cp .env.example .env
# .env 파일을 열어 MySQL 비밀번호와 Groq API 키 입력
```

### 3. 패키지 설치 & 실행
```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. 확인
브라우저에서 http://localhost:8000 접속  
API 문서: http://localhost:8000/docs

---

## 📡 API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 헬스체크 |
| POST | `/chat` | LLM 대화 |
| POST | `/diary/generate` | 일기 생성 |
| POST | `/diary/unlock` | 일기 해금 |
| GET | `/diary/{user_id}/{char_id}` | 일기 조회 |
| GET | `/vocab/{user_id}` | 전체 단어장 |
| GET | `/vocab/{user_id}/region/{region_id}` | 지역별 단어장 |
| POST | `/vocab` | 단어 저장 |
| PUT | `/vocab/review` | 마스터리 업데이트 |
| GET | `/progress/{user_id}/{char_id}` | 진도 조회 |
| PUT | `/progress` | 진도 업데이트 |
| GET | `/regions` | 전체 권역 |
| GET | `/region/{region_id}/characters` | 지역 캐릭터 |
| GET | `/user/{user_id}` | 사용자 정보 |

---

## 🔑 환경변수

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DB=kmate
GROQ_API_KEY=your_groq_key
FRONTEND_URL=http://localhost:3000
```

---

## 📁 디렉터리 구조

```
backend/
├── main.py              ← FastAPI 진입점
├── database.py          ← SQLAlchemy + MySQL 연결
├── requirements.txt
├── .env.example
├── models/
│   └── models.py        ← ORM 모델
├── schemas/
│   └── schemas.py       ← Pydantic 요청/응답 모델
├── routers/
│   ├── chat.py          ← POST /chat
│   ├── diary.py         ← /diary/*
│   ├── vocab.py         ← /vocab/*
│   └── progress.py      ← /progress, /regions, /user
├── services/
│   └── llm_service.py   ← Groq LLM + 기장 페르소나
└── sql/
    └── schema.sql       ← MySQL DDL + 시드 데이터
```
