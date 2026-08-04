/**
 * adStore.ts — 광고 시청 코인 보상 관리
 *
 * 규칙
 * - 1회 광고 시청당 +5 코인
 * - 하루 최대 획득 가능 코인: 100코인 (= 하루 최대 20회)
 * - 남은 횟수는 localStorage에 { date: 'YYYY-MM-DD', count: number } 형태로 저장
 * - 날짜가 바뀌면 자동 초기화
 */

const STORAGE_KEY = "kmate_ad_views";
const COINS_PER_AD = 5;
const MAX_ADS_PER_DAY = 20; // 20회 × 5코인 = 100코인
const MAX_COINS_PER_DAY = 100;

interface AdRecord {
  date: string;
  count: number;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function loadRecord(): AdRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: todayStr(), count: 0 };
    const parsed: AdRecord = JSON.parse(raw);
    if (parsed.date !== todayStr()) return { date: todayStr(), count: 0 };
    return parsed;
  } catch {
    return { date: todayStr(), count: 0 };
  }
}

function saveRecord(record: AdRecord) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

/** 오늘 남은 광고 시청 가능 횟수 */
export function getRemainingAds(): number {
  const record = loadRecord();
  return Math.max(0, MAX_ADS_PER_DAY - record.count);
}

/** 오늘 이미 획득한 코인 (광고로만) */
export function getTodayAdCoins(): number {
  const record = loadRecord();
  return Math.min(record.count * COINS_PER_AD, MAX_COINS_PER_DAY);
}

/** 광고 1회 완료 처리 → 획득 코인 반환 (이미 최대면 0 반환) */
export function completeAdView(): number {
  const record = loadRecord();
  if (record.count >= MAX_ADS_PER_DAY) return 0;
  record.count += 1;
  saveRecord(record);
  return COINS_PER_AD;
}

export { COINS_PER_AD, MAX_ADS_PER_DAY, MAX_COINS_PER_DAY };
