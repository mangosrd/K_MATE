"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { MOCK_REGIONS, MOCK_ALL_PROGRESS, MOCK_ECONOMY, MOCK_USER, MOCK_CHARACTERS, getChaptersForCharacter } from "@/lib/db/mock";
import { getEffectiveUserId } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import type { Progress } from "@/types/database";
import styles from "./map.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function MapPage() {
  const { t } = useLanguage();
  const [coins, setCoins] = useState(MOCK_ECONOMY.coins);
  const [membership, setMembership] = useState(MOCK_USER.membership);
  const [allProgress, setAllProgress] = useState<Record<string, Progress>>(MOCK_ALL_PROGRESS);

  useEffect(() => {
    const userId = getEffectiveUserId();

    fetch(`${BACKEND_URL}/user/${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) { setCoins(data.coins); setMembership(data.membership); } })
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

  const totalVisited = Object.values(allProgress).reduce(
    (acc, p) => acc + p.visited_places.length, 0
  );
  const streak = allProgress["kyuhyun"]?.streak_days ?? 0;
  const isPremium = membership === "premium";

  return (
    <>
      <div className="page-content">
        {/* 헤더 */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>{t("travel")}</h1>
            <p className={styles.headerSub}>{t("selectDestination")}</p>
          </div>
          <div className="coin-badge">
            <span className="coin-icon">🪙</span>
            <span>{coins}</span>
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
                    <span className={styles.ticketCitySmall}>인천</span>
                  </div>

                  <div className={styles.ticketMid}>
                    <span className={styles.ticketEmoji}>{emojiMap[region.id]}</span>
                    <div className={styles.ticketFlight}>
                      <div className={styles.flightLine} />
                      <span className={styles.planeIcon}>✈</span>
                    </div>
                    <span className={styles.openBadge}>
                      {isRegionLocked ? "🔒 LOCKED" : "OPEN"}
                    </span>
                  </div>

                  <div className={styles.ticketDest}>
                    <span className={styles.ticketCode}>{region.airport_code}</span>
                    <span className={styles.ticketCity}>{region.name}</span>
                    <span className={styles.ticketCityEn}>{region.name_en}</span>
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
                    <span className={styles.metaLabel}>MATE</span>
                    <span className={styles.metaValue}>{visited}/{region.place_count} {t("visit")}</span>
                  </div>
                  <div className={styles.ticketMeta}>
                    <span className={styles.metaLabel}>GATE</span>
                    <span className={styles.metaValue}>{region.place_count} {t("placesCount")}</span>
                  </div>
                  <div className={styles.ticketProgressWrap}>
                    <span className={styles.metaLabel}>PROGRESS</span>
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
      <BottomNav />
    </>
  );
}
