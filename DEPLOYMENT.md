# K-MATE 배포 가이드 (Vercel + Railway)

실제로 "배포" 버튼을 누르기 전, 준비 상태를 정리한 문서. 아래 순서대로 하면 됨.

## 순서가 중요한 이유

백엔드(Railway)와 프론트(Vercel)가 서로의 주소를 알아야 해서, 배포 순서가 있음:
1. **백엔드(Railway) 먼저 배포** → Railway가 주는 URL을 받음 (예: `https://kmate-backend.up.railway.app`)
2. **프론트(Vercel) 배포** — 위에서 받은 백엔드 URL을 `NEXT_PUBLIC_BACKEND_URL`에 넣음 → Vercel이 주는 URL을 받음
3. **백엔드로 돌아가서** `FRONTEND_URL` 환경변수를 Vercel URL로 업데이트 (CORS 허용을 위해 필요)

## 1. Railway (백엔드 + MySQL)

- 새 프로젝트 생성 → GitHub 저장소(`mangosrd/K_MATE`) 연결, **root directory를 `backend`로 지정**
- MySQL 플러그인 추가 (Railway가 자동으로 `MYSQLHOST`/`MYSQLPORT`/`MYSQLUSER`/`MYSQLPASSWORD`/`MYSQLDATABASE` 같은 변수를 만들어줌 — 이름이 우리 코드가 기대하는 `MYSQL_HOST` 등과 다를 수 있으니, Railway 대시보드에서 아래 이름으로 직접 매핑/입력)
- 첫 배포 후 `sql/schema.sql`을 Railway MySQL에 한 번 실행해서 테이블 생성 (Railway 콘솔의 MySQL 쿼리 탭 또는 `mysql -h ... < sql/schema.sql`)
- 환경변수:
  ```
  MYSQL_HOST=<Railway MySQL 호스트>
  MYSQL_PORT=<Railway MySQL 포트>
  MYSQL_USER=<Railway MySQL 유저>
  MYSQL_PASSWORD=<Railway MySQL 비번>
  MYSQL_DB=<Railway MySQL DB명>
  GEMINI_API_KEY=<.env.local에 있는 값>
  FRONTEND_URL=<2단계에서 나온 Vercel URL — 처음엔 임시로 비워두거나 localhost로 두고 나중에 업데이트>
  GOOGLE_PLAY_PACKAGE_NAME=com.kmate.app
  GOOGLE_PLAY_SERVICE_ACCOUNT_FILE=<Play Console 준비되면 채움>
  INTERNAL_API_SECRET=<backend/.env에 있는 값 — Vercel의 INTERNAL_API_SECRET(NEXT_PUBLIC_ 없는 쪽)과 반드시 동일해야 함>
  ```
  ⚠️ **`INTERNAL_API_SECRET`을 안 넣으면 코인/캐릭터/프리미엄 구매가 전부 401로 실패함** — 웹 결제 시뮬레이션 엔드포인트를 브라우저가 직접 두드리는 걸 막으려고 이번에 추가한 게이트라, 값이 비어있으면 무조건 막힌다(보안상 의도된 동작).
- 시작 명령은 이미 `backend/Procfile`, `backend/railway.json`에 설정해둠 — Railway가 알아서 씀
- `requirements.txt`에 `torch`/`transformers`가 있어서 빌드 이미지가 꽤 큼(수백MB) — 안 써도(폴백으로) 동작은 하니, Railway 빌드가 느리거나 용량 문제 생기면 그때 가볍게 만드는 걸 고려

## 2. Vercel (프론트)

- 새 프로젝트 생성 → 같은 GitHub 저장소 연결, root directory는 프로젝트 루트(기본값)
- 환경변수 (`.env.local` 내용 기준):
  ```
  GEMINI_API_KEY=<.env.local에 있는 값>       ← /api/memory (기억 추출)에서 씀
  ELEVENLABS_API_KEY=<.env.local에 있는 값>
  NEXT_PUBLIC_BACKEND_URL=<1단계 Railway URL>
  INTERNAL_API_SECRET=<.env.local에 있는 값 — Railway의 INTERNAL_API_SECRET과 반드시 동일해야 함, NEXT_PUBLIC_ 접두사 절대 붙이지 말 것(붙이면 브라우저에 그대로 노출돼서 이 값을 넣은 의미가 없어짐)>
  ```
- **`NEXT_PUBLIC_DEV_MODE`는 배포 환경에 절대 넣지 마세요** — 로컬 전용 값이고, 이게 `true`면 프리미엄 잠금이 전부 풀려서 아무나 결제 없이 프리미엄 캐릭터를 쓸 수 있게 됨

## 3. 안드로이드 앱

- `capacitor.config.ts`의 `server.url`을 `http://10.0.2.2:3000`(로컬 전용)에서 Vercel URL(`https://...`)로 변경, `cleartext: true` 줄도 제거(https는 필요 없음)
- 변경 후 `npx cap sync android` 다시 실행

## 체크 안 된 것 (배포 시점에 실제로 확인 필요)

- Railway MySQL 변수명이 정확히 어떻게 오는지는 실제로 연결해봐야 확정됨 (위 표는 일반적인 패턴 기준)
- PlanetScale 등 다른 MySQL 호스팅으로 바꿀 경우 이 문서의 Railway MySQL 부분만 대체하면 됨
