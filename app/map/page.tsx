import type { Metadata } from "next";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { MOCK_REGIONS, MOCK_ALL_PROGRESS, MOCK_ECONOMY, MOCK_USER } from "@/lib/db/mock";
import styles from "./map.module.css";

export const metadata: Metadata = {
  title: "여행 지도 — K-MATE",
  description: "한국의 권역을 탐험하며 언어 여행을 시작하세요.",
};

export default function MapPage() {
  const totalVisited = Object.values(MOCK_ALL_PROGRESS).reduce(
    (acc, p) => acc + p.visited_places.length, 0
  );
  const streak = MOCK_ALL_PROGRESS["kyuhyun"]?.streak_days ?? 0;
  const isPremium = MOCK_USER.membership === "premium";

  return (
    <>
      <div className="page-content">
        {/* 헤더 */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>여행하기</h1>
            <p className={styles.headerSub}>Travel · 목적지를 선택하세요</p>
          </div>
          <div className="coin-badge">
            <span className="coin-icon">🪙</span>
            <span>{MOCK_ECONOMY.coins}</span>
          </div>
        </header>

        {/* 배너 */}
        <div className={styles.heroBanner}>
          <div>
            <p className={styles.bannerTitle}>어디로 떠날까요? ✈️</p>
            <p className={styles.bannerSub}>목적지를 선택하면 메이트가 기다려요</p>
          </div>
          <div className={styles.streakPill}>
            <span>🔥</span>
            <span>{streak}일 연속</span>
          </div>
        </div>

        {/* 통계 행 */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{MOCK_REGIONS.filter((r) => !r.is_locked).length}</span>
            <span className={styles.statKo}>개방 지역</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNum}>{totalVisited}</span>
            <span className={styles.statKo}>방문 장소</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNum}>{isPremium ? "⭐" : "FREE"}</span>
            <span className={styles.statKo}>멤버십</span>
          </div>
        </div>

        {/* 탑승권 목록 */}
        <div className={styles.ticketList}>
          <p className={styles.sectionLabel}>BOARDING PASS · 탑승권</p>

          {MOCK_REGIONS.map((region) => {
            const progress = Object.values(MOCK_ALL_PROGRESS).find(
              (p) => p.character_id === region.character_ids[0]
            );
            const visited = progress?.visited_places.length ?? 0;
            const pct = Math.round((visited / region.place_count) * 100);
            const isPremiumLocked = region.is_locked && !isPremium;
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
                  {/* 출발 */}
                  <div className={styles.ticketOrigin}>
                    <span className={styles.ticketCodeSmall}>ICN</span>
                    <span className={styles.ticketCitySmall}>인천</span>
                  </div>

                  {/* 가운데 */}
                  <div className={styles.ticketMid}>
                    <span className={styles.ticketEmoji}>{emojiMap[region.id]}</span>
                    <div className={styles.ticketFlight}>
                      <div className={styles.flightLine} />
                      <span className={styles.planeIcon}>✈</span>
                    </div>
                    {isRegionLocked
                      ? <span className={styles.lockIcon}>🔒</span>
                      : <span className={styles.ticketStatusBadge}>OPEN</span>
                    }
                  </div>

                  {/* 도착 */}
                  <div className={styles.ticketDest}>
                    <span className={styles.ticketCode}>{region.airport_code}</span>
                    <span className={styles.ticketCity}>{region.name}</span>
                    <span className={styles.ticketCityEn}>{region.name_en}</span>
                  </div>
                </div>

                {/* 점선 구분선 */}
                <div className={styles.ticketDivider}>
                  <div className={styles.notchLeft} />
                  <div className={styles.dashedLine} />
                  <div className={styles.notchRight} />
                </div>

                {/* 티켓 하단 */}
                <div className={styles.ticketBottom}>
                  {isRegionLocked ? (
                    <div className={styles.premiumNotice}>
                      <span className={styles.premiumIcon}>⭐</span>
                      <div>
                        <p className={styles.premiumText}>프리미엄 전용</p>
                        <p className={styles.premiumSub}>Premium only · ₩4,900/월</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.ticketInfo}>
                        <div className={styles.ticketInfoItem}>
                          <span className={styles.ticketLabel}>MATE</span>
                          <span className={styles.ticketValue}>
                            {MOCK_ALL_PROGRESS[region.character_ids[0]]
                              ? `${visited}/${region.place_count} 방문`
                              : "미시작"}
                          </span>
                        </div>
                        <div className={styles.ticketInfoItem}>
                          <span className={styles.ticketLabel}>GATE</span>
                          <span className={styles.ticketValue}>{region.place_count}곳</span>
                        </div>
                        <div className={styles.ticketInfoItem}>
                          <span className={styles.ticketLabel}>PROGRESS</span>
                          <span className={styles.ticketValue}>{pct}%</span>
                        </div>
                      </div>

                      {/* 프로그레스 바 */}
                      <div className={styles.ticketProgress}>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </>
                  )}
                  <span className={styles.ticketArrow}>›</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 프리미엄 배너 */}
        {!isPremium && (
          <Link href="/premium" className={styles.premiumBanner} id="btn-go-premium">
            <div className={styles.premiumBannerLeft}>
              <p className={styles.premiumBannerTitle}>⭐ K-MATE 프리미엄</p>
              <p className={styles.premiumBannerSub}>선우·상우·용우와 함께하기 · ₩4,900/월</p>
            </div>
            <span className={styles.premiumBannerArrow}>›</span>
          </Link>
        )}
      </div>
      <BottomNav />
    </>
  );
}
