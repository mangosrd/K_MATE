"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { MOCK_REGIONS, MOCK_ALL_PROGRESS, MOCK_ECONOMY, MOCK_USER, MOCK_CHARACTERS, getChaptersForCharacter } from "@/lib/db/mock";
import { getEffectiveUserId } from "@/lib/auth/store";
import { useLanguage, type Language } from "@/components/LanguageContext";
import type { Progress } from "@/types/database";
import styles from "./map.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type AttendanceDay = { date: string; reward: number; claimed: boolean; is_today: boolean; is_past: boolean };
type AttendanceStatus = {
  week_start: string; today: string; claimed_today: boolean; can_claim: boolean;
  current_coins: number; coins_awarded?: number; days: AttendanceDay[];
};

const ATTENDANCE_COPY: Record<Language, {
  title: string; subtitle: string; claim: string; claimed: string; missed: string;
  upcoming: string; today: string; close: string; retry: string; success: (coins: number) => string;
}> = {
  ko: { title: "7일 출석 보상", subtitle: "접속한 날의 코인만 받을 수 있어요", claim: "오늘 보상 받기", claimed: "받음", missed: "놓침", upcoming: "예정", today: "오늘", close: "닫기", retry: "잠시 후 다시 시도해 주세요.", success: (n) => `${n}코인을 받았어요!` },
  en: { title: "7-Day Check-in", subtitle: "Claim coins only on the days you visit", claim: "Claim today's reward", claimed: "Claimed", missed: "Missed", upcoming: "Upcoming", today: "Today", close: "Close", retry: "Please try again shortly.", success: (n) => `You received ${n} coins!` },
  ru: { title: "Награды за 7 дней", subtitle: "Монеты выдаются только в день входа", claim: "Получить награду", claimed: "Получено", missed: "Пропущено", upcoming: "Скоро", today: "Сегодня", close: "Закрыть", retry: "Повторите попытку позже.", success: (n) => `Получено монет: ${n}!` },
  zh: { title: "7天签到奖励", subtitle: "仅可领取当天登录奖励", claim: "领取今日奖励", claimed: "已领取", missed: "已错过", upcoming: "未开始", today: "今天", close: "关闭", retry: "请稍后再试。", success: (n) => `获得了${n}枚金币！` },
  ja: { title: "7日間ログイン報酬", subtitle: "ログインした日のコインだけ受け取れます", claim: "今日の報酬を受け取る", claimed: "受取済み", missed: "未受取", upcoming: "予定", today: "今日", close: "閉じる", retry: "しばらくしてから再試行してください。", success: (n) => `${n}コインを獲得しました！` },
  "zh-TW": { title: "7天簽到獎勵", subtitle: "僅可領取當天登入獎勵", claim: "領取今日獎勵", claimed: "已領取", missed: "已錯過", upcoming: "未開始", today: "今天", close: "關閉", retry: "請稍後再試。", success: (n) => `獲得了${n}枚金幣！` },
  th: { title: "รางวัลเช็กอิน 7 วัน", subtitle: "รับเหรียญได้เฉพาะวันที่เข้าใช้งาน", claim: "รับรางวัลวันนี้", claimed: "รับแล้ว", missed: "พลาด", upcoming: "เร็ว ๆ นี้", today: "วันนี้", close: "ปิด", retry: "โปรดลองอีกครั้งในภายหลัง", success: (n) => `ได้รับ ${n} เหรียญ!` },
};

const DATE_LOCALES: Record<Language, string> = {
  ko: "ko-KR", en: "en-US", ru: "ru-RU", zh: "zh-CN", ja: "ja-JP", "zh-TW": "zh-TW", th: "th-TH",
};

type RegionCopy = { origin: string; name: string; nameEn: string; open: string; locked: string };

const REGION_COPY: Record<Language, Record<string, RegionCopy>> = {
  ko: {
    seoul: { origin: "인천", name: "서울·경기", nameEn: "Seoul & Gyeonggi", open: "이용 가능", locked: "잠김" },
    jeonju: { origin: "인천", name: "전주·전라", nameEn: "Jeonju & Jeolla", open: "이용 가능", locked: "잠김" },
    busan: { origin: "인천", name: "부산·경남", nameEn: "Busan & Gyeongnam", open: "이용 가능", locked: "잠김" },
    chungcheong: { origin: "인천", name: "충청·공주", nameEn: "Chungcheong & Gongju", open: "이용 가능", locked: "잠김" },
    jeju: { origin: "인천", name: "제주", nameEn: "Jeju Island", open: "이용 가능", locked: "잠김" },
  },
  en: {
    seoul: { origin: "Incheon", name: "Seoul & Gyeonggi", nameEn: "Seoul & Gyeonggi", open: "OPEN", locked: "LOCKED" },
    jeonju: { origin: "Incheon", name: "Jeonju & Jeolla", nameEn: "Jeonju & Jeolla", open: "OPEN", locked: "LOCKED" },
    busan: { origin: "Incheon", name: "Busan & Gyeongnam", nameEn: "Busan & Gyeongnam", open: "OPEN", locked: "LOCKED" },
    chungcheong: { origin: "Incheon", name: "Chungcheong & Gongju", nameEn: "Chungcheong & Gongju", open: "OPEN", locked: "LOCKED" },
    jeju: { origin: "Incheon", name: "Jeju Island", nameEn: "Jeju Island", open: "OPEN", locked: "LOCKED" },
  },
  ru: {
    seoul: { origin: "Инчхон", name: "Сеул и Кёнгидо", nameEn: "Seoul & Gyeonggi", open: "ОТКРЫТО", locked: "ЗАКРЫТО" },
    jeonju: { origin: "Инчхон", name: "Чонджу и Чолла", nameEn: "Jeonju & Jeolla", open: "ОТКРЫТО", locked: "ЗАКРЫТО" },
    busan: { origin: "Инчхон", name: "Пусан и Кённам", nameEn: "Busan & Gyeongnam", open: "ОТКРЫТО", locked: "ЗАКРЫТО" },
    chungcheong: { origin: "Инчхон", name: "Чхунчхон и Конджу", nameEn: "Chungcheong & Gongju", open: "ОТКРЫТО", locked: "ЗАКРЫТО" },
    jeju: { origin: "Инчхон", name: "Чеджу", nameEn: "Jeju Island", open: "ОТКРЫТО", locked: "ЗАКРЫТО" },
  },
  zh: {
    seoul: { origin: "仁川", name: "首尔·京畿", nameEn: "Seoul & Gyeonggi", open: "开放", locked: "未开放" },
    jeonju: { origin: "仁川", name: "全州·全罗", nameEn: "Jeonju & Jeolla", open: "开放", locked: "未开放" },
    busan: { origin: "仁川", name: "釜山·庆南", nameEn: "Busan & Gyeongnam", open: "开放", locked: "未开放" },
    chungcheong: { origin: "仁川", name: "忠清·公州", nameEn: "Chungcheong & Gongju", open: "开放", locked: "未开放" },
    jeju: { origin: "仁川", name: "济州", nameEn: "Jeju Island", open: "开放", locked: "未开放" },
  },
  ja: {
    seoul: { origin: "仁川", name: "ソウル・京畿", nameEn: "Seoul & Gyeonggi", open: "利用可能", locked: "ロック中" },
    jeonju: { origin: "仁川", name: "全州・全羅", nameEn: "Jeonju & Jeolla", open: "利用可能", locked: "ロック中" },
    busan: { origin: "仁川", name: "釜山・慶南", nameEn: "Busan & Gyeongnam", open: "利用可能", locked: "ロック中" },
    chungcheong: { origin: "仁川", name: "忠清・公州", nameEn: "Chungcheong & Gongju", open: "利用可能", locked: "ロック中" },
    jeju: { origin: "仁川", name: "済州", nameEn: "Jeju Island", open: "利用可能", locked: "ロック中" },
  },
  "zh-TW": {
    seoul: { origin: "仁川", name: "首爾・京畿", nameEn: "Seoul & Gyeonggi", open: "開放", locked: "未開放" },
    jeonju: { origin: "仁川", name: "全州・全羅", nameEn: "Jeonju & Jeolla", open: "開放", locked: "未開放" },
    busan: { origin: "仁川", name: "釜山・慶南", nameEn: "Busan & Gyeongnam", open: "開放", locked: "未開放" },
    chungcheong: { origin: "仁川", name: "忠清・公州", nameEn: "Chungcheong & Gongju", open: "開放", locked: "未開放" },
    jeju: { origin: "仁川", name: "濟州", nameEn: "Jeju Island", open: "開放", locked: "未開放" },
  },
  th: {
    seoul: { origin: "อินชอน", name: "โซล·คยองกี", nameEn: "Seoul & Gyeonggi", open: "เปิดแล้ว", locked: "ล็อกอยู่" },
    jeonju: { origin: "อินชอน", name: "จอนจู·ชอลลา", nameEn: "Jeonju & Jeolla", open: "เปิดแล้ว", locked: "ล็อกอยู่" },
    busan: { origin: "อินชอน", name: "ปูซาน·คยองนัม", nameEn: "Busan & Gyeongnam", open: "เปิดแล้ว", locked: "ล็อกอยู่" },
    chungcheong: { origin: "อินชอน", name: "ชุงชอง·กงจู", nameEn: "Chungcheong & Gongju", open: "เปิดแล้ว", locked: "ล็อกอยู่" },
    jeju: { origin: "อินชอน", name: "เชจู", nameEn: "Jeju Island", open: "เปิดแล้ว", locked: "ล็อกอยู่" },
  },
};

const TICKET_LABELS: Record<Language, { mate: string; gate: string; progress: string; visitUnit: string; placeUnit: string }> = {
  ko: { mate: "방문", gate: "장소", progress: "진도", visitUnit: "방문", placeUnit: "곳" },
  en: { mate: "VISITS", gate: "PLACES", progress: "PROGRESS", visitUnit: "visits", placeUnit: "places" },
  ru: { mate: "ПОСЕЩЕНИЯ", gate: "МЕСТА", progress: "ПРОГРЕСС", visitUnit: "посещений", placeUnit: "мест" },
  zh: { mate: "访问", gate: "地点", progress: "进度", visitUnit: "次访问", placeUnit: "处" },
  ja: { mate: "訪問", gate: "場所", progress: "進捗", visitUnit: "回訪問", placeUnit: "か所" },
  "zh-TW": { mate: "造訪", gate: "地點", progress: "進度", visitUnit: "次造訪", placeUnit: "處" },
  th: { mate: "เยี่ยมชม", gate: "สถานที่", progress: "ความคืบหน้า", visitUnit: "ครั้ง", placeUnit: "แห่ง" },
};

export default function MapPage() {
  const { t, language } = useLanguage();
  const [coins, setCoins] = useState(MOCK_ECONOMY.coins);
  const [membership, setMembership] = useState(MOCK_USER.membership);
  const [allProgress, setAllProgress] = useState<Record<string, Progress>>(MOCK_ALL_PROGRESS);
  const [attendance, setAttendance] = useState<AttendanceStatus | null>(null);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState("");

  const loadAttendance = async () => {
    const userId = getEffectiveUserId();
    const response = await fetch(`${BACKEND_URL}/attendance/${userId}`);
    if (!response.ok) throw new Error("attendance unavailable");
    const data: AttendanceStatus = await response.json();
    setAttendance(data);
    setCoins(data.current_coins);
  };

  useEffect(() => {
    const userId = getEffectiveUserId();

    fetch(`${BACKEND_URL}/user/${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) { setCoins(data.coins); setMembership(data.membership); } })
      .catch(() => {});

    fetch(`${BACKEND_URL}/attendance/${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AttendanceStatus | null) => {
        if (data) { setAttendance(data); setCoins(data.current_coins); }
      })
      .catch(() => {});

    Promise.all(
      MOCK_CHARACTERS.map((c) =>
        fetch(`${BACKEND_URL}/progress/${userId}/${c.id}`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      const merged: Record<string, Progress> = {};
      results.forEach((p) => { if (p) merged[p.character_id] = p; });
      if (Object.keys(merged).length > 0) setAllProgress(merged);
    });
  }, []);

  const claimAttendance = async () => {
    if (attendanceLoading || attendance?.claimed_today) return;
    setAttendanceLoading(true);
    setAttendanceMessage("");
    try {
      const userId = getEffectiveUserId();
      const response = await fetch(`${BACKEND_URL}/attendance/${userId}/claim`, { method: "POST" });
      if (!response.ok) throw new Error("claim failed");
      const data: AttendanceStatus = await response.json();
      setAttendance(data);
      setCoins(data.current_coins);
      setAttendanceMessage(ATTENDANCE_COPY[language].success(data.coins_awarded ?? 0));
    } catch {
      setAttendanceMessage(ATTENDANCE_COPY[language].retry);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const totalVisited = Object.values(allProgress).reduce(
    (acc, p) => acc + p.visited_places.length, 0
  );
  const streak = allProgress["kyuhyun"]?.streak_days ?? 0;
  const isPremium = membership === "premium";

  return (
    <>
      <div className={`page-content ${styles.mapPage}`} data-language={language}>
        {/* 헤더 */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>{t("travel")}</h1>
            <p className={styles.headerSub}>{t("selectDestination")}</p>
          </div>
          <div className={styles.headerActions}>
          <div className="coin-badge">
            <span className="coin-icon">🪙</span>
            <span>{coins}</span>
          </div>
            <button
              type="button"
              className={`${styles.attendanceButton} ${attendance?.can_claim ? styles.attendanceButtonReady : ""}`}
              onClick={() => { setAttendanceOpen(true); setAttendanceMessage(""); loadAttendance().catch(() => {}); }}
              aria-label={ATTENDANCE_COPY[language].title}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 3v3M17 3v3M4.5 8.5h15M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
                <path d="m9 15 2 2 4-5" />
              </svg>
              {attendance?.can_claim && <span className={styles.readyDot} />}
            </button>
          </div>
        </header>

        {/* 🌺 태극 붉은색 그라디언트 히어로 배너 */}
        <div className={styles.heroBanner}>
          <div>
            <p className={styles.bannerTitle}>{t("whereToGo")} ✈️</p>
            <p className={styles.bannerSub}>{t("mateAwaits")}</p>
          </div>
          <div className={styles.streakPill}>
            <span>🔥</span>
            <span>{streak} {t("daysStreak")}</span>
          </div>
        </div>

        {/* 통계 행 */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{MOCK_REGIONS.filter((r) => !r.is_locked).length}</span>
            <span className={styles.statKo}>{t("openRegions")}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNum}>{totalVisited}</span>
            <span className={styles.statKo}>{t("visitedPlaces")}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNum}>{isPremium ? "⭐" : "FREE"}</span>
            <span className={styles.statKo}>{t("membership")}</span>
          </div>
        </div>

        {/* 탑승권 목록 */}
        <div className={styles.ticketList}>
          <p className={styles.sectionLabel}>{t("boardingPass")}</p>

          {MOCK_REGIONS.map((region) => {
            const copy = REGION_COPY[language][region.id] ?? REGION_COPY.en[region.id];
            const ticketLabels = TICKET_LABELS[language];
            const progress = Object.values(allProgress).find(
              (p) => p.character_id === region.character_ids[0]
            );
            // "방문 장소"는 예전엔 지역 페이지에 들어가기만 하면 명소 전체가 즉시
            // "방문함"으로 기록돼서, 실제로 아무것도 안 배워도 진도가 꽉 차 보이는
            // 의미 없는 숫자였다. 대신 그 지역 캐릭터의 실제 지역 챕터(ch-*) 완료
            // 비율에 비례해서 계산한다 — 예: 10개 챕터 중 3개를 끝냈으면 명소 5곳 중
            // round(5 * 3/10) = 2곳 방문한 것으로 표시.
            const regionChapters = getChaptersForCharacter(region.character_ids[0])
              .filter((ch) => ch.id.startsWith("ch-"));
            const completedCount = (progress?.stamps ?? [])
              .filter((id) => regionChapters.some((ch) => ch.id === id)).length;
            const visited = regionChapters.length > 0
              ? Math.round((completedCount / regionChapters.length) * region.place_count)
              : 0;
            const pct = Math.round((visited / region.place_count) * 100);
            const isRegionLocked = region.is_locked;

            const emojiMap: Record<string, string> = {
              seoul: "🏯", jeonju: "🏮", busan: "⚓", chungcheong: "🏛️", jeju: "🌋",
            };

            return (
              <Link
                key={region.id}
                href={isRegionLocked ? "/premium" : `/region/${region.id}`}
                id={`ticket-${region.id}`}
                className={`${styles.ticket} ${isRegionLocked ? styles.ticketLocked : ""}`}
              >
                {/* 티켓 상단 */}
                <div className={styles.ticketTop}>
                  <div className={styles.ticketOrigin}>
                    <span className={styles.ticketCodeSmall}>ICN</span>
                    <span className={styles.ticketCitySmall}>{copy.origin}</span>
                  </div>

                  <div className={styles.ticketMid}>
                    <span className={styles.ticketEmoji}>{emojiMap[region.id]}</span>
                    <div className={styles.ticketFlight}>
                      <div className={styles.flightLine} />
                      <span className={styles.planeIcon}>✈</span>
                    </div>
                    <span className={styles.openBadge}>
                      {isRegionLocked ? `🔒 ${copy.locked}` : copy.open}
                    </span>
                  </div>

                  <div className={styles.ticketDest}>
                    <span className={styles.ticketCode}>{region.airport_code}</span>
                    <span className={styles.ticketCity}>{copy.name}</span>
                    <span className={styles.ticketCityEn}>{copy.nameEn}</span>
                  </div>
                </div>

                {/* ✂️ 원형 노치(Notch) 점선 구분선 */}
                <div className={styles.ticketDivider}>
                  <div className={styles.notchLeft} />
                  <div className={styles.dashedLine} />
                  <div className={styles.notchRight} />
                </div>

                {/* 티켓 하단 진도 */}
                <div className={styles.ticketBottom}>
                  <div className={styles.ticketMeta}>
                    <span className={styles.metaLabel}>{ticketLabels.mate}</span>
                    <span className={styles.metaValue}>{visited}/{region.place_count} {ticketLabels.visitUnit}</span>
                  </div>
                  <div className={styles.ticketMeta}>
                    <span className={styles.metaLabel}>{ticketLabels.gate}</span>
                    <span className={styles.metaValue}>{region.place_count} {ticketLabels.placeUnit}</span>
                  </div>
                  <div className={styles.ticketProgressWrap}>
                    <span className={styles.metaLabel}>{ticketLabels.progress}</span>
                    <div className={styles.progressRow}>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={styles.progressPct}>{pct}%</span>
                    </div>
                  </div>
                  <span className={styles.ticketArrow}>›</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      {attendanceOpen && (
        <div className={styles.attendanceOverlay} role="dialog" aria-modal="true" aria-labelledby="attendance-title" onClick={() => setAttendanceOpen(false)}>
          <section className={styles.attendanceModal} onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.modalClose} onClick={() => setAttendanceOpen(false)} aria-label={ATTENDANCE_COPY[language].close}>×</button>
            <div className={styles.calendarMark}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3M17 3v3M4.5 8.5h15M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>
            </div>
            <h2 id="attendance-title">{ATTENDANCE_COPY[language].title}</h2>
            <p className={styles.attendanceSubtitle}>{ATTENDANCE_COPY[language].subtitle}</p>
            <div className={styles.attendanceWeek}>
              {attendance?.days.map((day) => {
                const label = new Intl.DateTimeFormat(DATE_LOCALES[language], { weekday: "short", timeZone: "Asia/Seoul" }).format(new Date(`${day.date}T12:00:00+09:00`));
                const status = day.claimed ? ATTENDANCE_COPY[language].claimed : day.is_past ? ATTENDANCE_COPY[language].missed : day.is_today ? ATTENDANCE_COPY[language].today : ATTENDANCE_COPY[language].upcoming;
                return <div key={day.date} className={`${styles.attendanceDay} ${day.claimed ? styles.dayClaimed : ""} ${day.is_today ? styles.dayToday : ""}`}>
                  <span className={styles.weekday}>{label}</span>
                  <span className={styles.dayCoin}>+{day.reward}</span>
                  <span className={styles.dayStatus}>{status}</span>
                </div>;
              })}
            </div>
            {attendanceMessage && <p className={styles.attendanceMessage}>{attendanceMessage}</p>}
            <button type="button" className={styles.claimButton} onClick={claimAttendance} disabled={attendanceLoading || !attendance?.can_claim}>
              {attendance?.claimed_today ? ATTENDANCE_COPY[language].claimed : ATTENDANCE_COPY[language].claim}
            </button>
          </section>
        </div>
      )}
      <BottomNav />
    </>
  );
}
