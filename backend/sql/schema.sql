-- ============================================================
-- K-MATE MySQL 스키마 v1
-- 실행: mysql -u root -p < backend/sql/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS kmate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kmate;

-- ── 사용자 ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  language      VARCHAR(10)  NOT NULL DEFAULT 'en',
  level         INT          NOT NULL DEFAULT 1,
  membership    ENUM('free','premium') NOT NULL DEFAULT 'free',
  free_char_slots JSON       DEFAULT ('[]'),
  free_chat_count INT        NOT NULL DEFAULT 0,
  ad_coins_today  INT        NOT NULL DEFAULT 0,
  ad_coins_date   DATE       NULL,
  theme_pref       VARCHAR(10) NOT NULL DEFAULT 'light',
  notify_chat      BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_diary     BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_marketing BOOLEAN     NOT NULL DEFAULT FALSE,
  is_withdrawn  BOOLEAN      NOT NULL DEFAULT FALSE,
  withdrawn_at  DATETIME,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB;
-- 회원탈퇴 시 id/email(식별 정보)만 남기고 나머지 개인 데이터는 하드 삭제된다.
-- 전자상거래법 시행령 제6조에 따라 결제 관련 기록은 5년간 보관 필요 — is_withdrawn/withdrawn_at으로
-- 탈퇴 시점을 기록해두고, 보관기간 경과 후 별도 배치로 완전 파기한다 (routers/auth.py withdraw 참고).

-- ── 권역 ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS regions (
  id            VARCHAR(50)  PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  name_en       VARCHAR(100) NOT NULL,
  airport_code  VARCHAR(5)   NOT NULL,
  description   TEXT,
  description_en TEXT,
  place_count   INT          NOT NULL DEFAULT 0,
  is_locked     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── 캐릭터 ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS characters (
  id              VARCHAR(50)  PRIMARY KEY,
  region_id       VARCHAR(50)  NOT NULL,
  name            VARCHAR(50)  NOT NULL,
  emoji           VARCHAR(10),
  description     TEXT,
  description_en  TEXT,
  tags            JSON         DEFAULT ('[]'),
  persona         TEXT,
  requires_premium BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id)
) ENGINE=InnoDB;

-- ── 진도 ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress (
  id              VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id         VARCHAR(36) NOT NULL,
  character_id    VARCHAR(50) NOT NULL,
  affinity        INT         NOT NULL DEFAULT 0,
  stamps          JSON        DEFAULT ('[]'),
  current_step    INT         NOT NULL DEFAULT 1,
  visited_places  JSON        DEFAULT ('[]'),
  streak_days     INT         NOT NULL DEFAULT 0,
  last_active_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_char (user_id, character_id),
  FOREIGN KEY (user_id)      REFERENCES users(id),
  FOREIGN KEY (character_id) REFERENCES characters(id)
) ENGINE=InnoDB;

-- ── 기억 ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memories (
  id           VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  user_id      VARCHAR(36)  NOT NULL,
  character_id VARCHAR(50)  NOT NULL,
  type         ENUM('fact','preference','progress','emotion') NOT NULL,
  content      TEXT         NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(id),
  FOREIGN KEY (character_id) REFERENCES characters(id),
  INDEX idx_user_char (user_id, character_id)
) ENGINE=InnoDB;

-- ── 일기 ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diary_entries (
  id           VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  user_id      VARCHAR(36)  NOT NULL,
  character_id VARCHAR(50)  NOT NULL,
  body_ko      TEXT         NOT NULL,
  place_name   VARCHAR(200),
  unlocked     BOOLEAN      NOT NULL DEFAULT FALSE,
  unlock_cost  INT          NOT NULL DEFAULT 5,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(id),
  FOREIGN KEY (character_id) REFERENCES characters(id),
  INDEX idx_user_char (user_id, character_id)
) ENGINE=InnoDB;

-- ── 편지 (지연 답장 — 답장은 reply_ready_at 이후 우편함을 열 때 그 자리에서 생성) ──
CREATE TABLE IF NOT EXISTS letters (
  id             VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  user_id        VARCHAR(36)  NOT NULL,
  character_id   VARCHAR(50)  NOT NULL,
  content        TEXT         NOT NULL,
  reply_content  TEXT         NULL,
  sent_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reply_ready_at DATETIME     NOT NULL,
  is_read        BOOLEAN      NOT NULL DEFAULT FALSE,
  FOREIGN KEY (user_id)      REFERENCES users(id),
  FOREIGN KEY (character_id) REFERENCES characters(id),
  INDEX idx_user_char (user_id, character_id)
) ENGINE=InnoDB;

-- ── 단어장 ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vocab_items (
  id                   VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  user_id              VARCHAR(36)  NOT NULL,
  character_id         VARCHAR(50)  NOT NULL,
  region_id            VARCHAR(50),
  word                 VARCHAR(100) NOT NULL,
  reading              VARCHAR(200),
  meaning              VARCHAR(500) NOT NULL,
  sentence             TEXT,
  sentence_translation TEXT,
  mastery ENUM('new','learning','reviewing','mastered') NOT NULL DEFAULT 'new',
  tags                 JSON         DEFAULT ('[]'),
  last_reviewed_at     DATETIME,
  review_count         INT          NOT NULL DEFAULT 0,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(id),
  FOREIGN KEY (character_id) REFERENCES characters(id),
  INDEX idx_user_region (user_id, region_id)
) ENGINE=InnoDB;

-- ── 경제 ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS economies (
  id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id    VARCHAR(36) NOT NULL UNIQUE,
  coins      INT         NOT NULL DEFAULT 0,
  updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ── 멤버십 ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memberships (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id     VARCHAR(36) NOT NULL UNIQUE,
  tier        ENUM('free','premium') NOT NULL DEFAULT 'free',
  started_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME,
  price_krw   INT         NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ── 결제 수단 (실제 카드 연동 없음 — 브랜드/끝 4자리만 저장하는 시뮬레이션) ───
CREATE TABLE IF NOT EXISTS payment_methods (
  id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id    VARCHAR(36) NOT NULL,
  brand      VARCHAR(20) NOT NULL,
  last4      VARCHAR(4)  NOT NULL,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ── 결제 내역 (실제 결제 검증 기록, 웹=포트원 / 안드로이드 앱=Google Play) ─────
CREATE TABLE IF NOT EXISTS purchases (
  id             VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  user_id        VARCHAR(36)  NOT NULL,
  platform       VARCHAR(20)  NOT NULL,
  product_id     VARCHAR(100) NOT NULL,
  purchase_token VARCHAR(500) NOT NULL,
  status         VARCHAR(20)  NOT NULL DEFAULT 'verified',
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uq_purchase_token (platform, purchase_token)
) ENGINE=InnoDB;

-- ── 고객 지원 문의 ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id    VARCHAR(36),
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  category   VARCHAR(50)  NOT NULL,
  message    TEXT         NOT NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'open',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ── 번역 캐시 (챕터 콘텐츠 영어 텍스트 → UI 언어 번역, LLM 결과 캐싱) ──────
CREATE TABLE IF NOT EXISTS translation_cache (
  id              VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  text_hash       VARCHAR(64) NOT NULL,
  target_lang     VARCHAR(10) NOT NULL,
  source_text     TEXT        NOT NULL,
  translated_text TEXT        NOT NULL,
  created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_hash_lang (text_hash, target_lang)
) ENGINE=InnoDB;

-- ── 기장 사진첩 (캐릭터별 스탠딩 일러스트 카탈로그 + 유저별 코인 해금) ──────
CREATE TABLE IF NOT EXISTS gallery_images (
  id           VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  character_id VARCHAR(50) NOT NULL,
  image_url    VARCHAR(255) NOT NULL,
  title        VARCHAR(100),
  `order`      INT         NOT NULL DEFAULT 0,
  unlock_cost  INT         NOT NULL DEFAULT 0,
  created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_gallery_unlocks (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id     VARCHAR(36) NOT NULL,
  image_id    VARCHAR(36) NOT NULL,
  unlocked_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_image (user_id, image_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (image_id) REFERENCES gallery_images(id)
) ENGINE=InnoDB;

-- ── 시드 데이터: 권역 ─────────────────────────────────────────
INSERT INTO regions (id, name, name_en, airport_code, description, description_en, place_count, is_locked) VALUES
  ('seoul',       '서울·경기', 'Seoul & Gyeonggi',     'SEL', '조선의 수도, 현대 한국의 심장',     'Capital of Korea, hub of modernity and tradition', 8, FALSE),
  ('jeonju',      '전주·전라', 'Jeonju & Jeolla',      'JWJ', '한옥마을과 비빔밥의 고향',          'Home of hanok villages and bibimbap',               6, FALSE),
  ('busan',       '부산·경남', 'Busan & Gyeongnam',    'PUS', '바다와 사람의 도시',               'City of the sea — Korea''s second largest city',      7, TRUE),
  ('chungcheong', '충청·공주', 'Chungcheong & Gongju', 'OSN', '백제의 숨결이 살아있는 역사의 땅',   'Land of history — heartland of the Baekje kingdom',  5, TRUE),
  ('jeju',        '제주',      'Jeju Island',           'CJU', '화산섬의 신비로운 자연과 해녀 문화', 'Volcanic island of mystery and haenyeo culture',      6, TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- ── 시드 데이터: 캐릭터 ─────────────────────────────────────
INSERT INTO characters (id, region_id, name, emoji, description, description_en, requires_premium) VALUES
  ('kyuhyun', 'seoul',       '규현', '✈️', '서울·경기 노선 담당 기장', 'Captain of the Seoul & Gyeonggi route', FALSE),
  ('haneul',  'jeonju',      '하늘', '🛫', '전주·전라 노선 담당 기장', 'Captain of the Jeonju & Jeolla route',  FALSE),
  ('sunwoo',  'busan',       '선우', '⚓', '부산·경남 노선 담당 기장', 'Captain of the Busan & Gyeongnam route',TRUE),
  ('sangwoo', 'chungcheong', '상우', '🏛️', '충청·공주 노선 담당 기장', 'Captain of the Chungcheong route',       TRUE),
  ('yongwoo', 'jeju',        '용우', '🌋', '제주 노선 담당 기장',      'Captain of the Jeju Island route',       TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- ── 시드 데이터: 테스트 사용자 ──────────────────────────────
INSERT INTO users (id, name, email, language, level, membership, free_char_slots) VALUES
  ('user-001', 'Kim Traveler', 'test@kmate.app', 'en', 1, 'free', '["kyuhyun","haneul"]')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO economies (user_id, coins) VALUES ('user-001', 35)
ON DUPLICATE KEY UPDATE coins=coins;
