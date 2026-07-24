"use client";

import Link from "next/link";
import Image from "next/image";
import BottomNav from "@/components/ui/BottomNav";
import { MOCK_CHARACTERS, MOCK_USER, MOCK_ALL_PROGRESS, canAccessCharacter } from "@/lib/db/mock";
import { useLanguage } from "@/components/LanguageContext";
import styles from "./chat-select.module.css";

export default function ChatSelectPage() {
  const { t } = useLanguage();
  const isPremium = MOCK_USER.membership === "premium";

  const getRouteName = (regionId: string) => {
    switch (regionId) {
      case "seoul": return t("seoulRoute");
      case "jeonju": return t("jeonjuRoute");
      case "busan": return t("busanRoute");
      case "chungcheong": return t("chungcheongRoute");
      case "jeju": return t("jejuRoute");
      default: return `${regionId} ${t("routeLabel")}`;
    }
  };

  return (
    <>
      <div className="page-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">{t("chatTitle")}</h1>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
              {t("chatSub")}
            </p>
          </div>
        </header>

        <div className={styles.inner}>
          {/* 안내 배너 */}
          <div className={styles.banner}>
            <span className={styles.bannerIcon}>✈️</span>
            <div>
              <p className={styles.bannerTitle}>{t("selectCaptain")}</p>
              <p className={styles.bannerSub}>{t("selectCaptainSub")}</p>
            </div>
          </div>

          {/* 캐릭터 그리드 */}
          <div className={styles.charGrid}>
            {MOCK_CHARACTERS.map((char) => {
              const canAccess = canAccessCharacter(
                char.id, MOCK_USER.membership, MOCK_USER.free_character_slots
              );
              const progress = MOCK_ALL_PROGRESS[char.id];
              const affinity = progress?.affinity ?? 0;
              const affinityStars = Math.round(affinity / 20);

              return (
                <div
                  key={char.id}
                  className={`${styles.charCard} ${!canAccess ? styles.charLocked : ""}`}
                  id={`char-card-${char.id}`}
                >
                  {/* 기장 배지 */}
                  <div className={styles.captainBadge}>
                    {canAccess
                      ? <span className="badge badge-blue">✈️ {t("captainBadge")}</span>
                      : <span className="badge badge-gold">⭐ {t("premiumOnly")}</span>}
                  </div>

                  {/* 기장 일러스트 */}
                  <div className={styles.charIconWrap}>
                    <div className={`${styles.charIcon} ${!canAccess ? styles.charIconLocked : ""}`}>
                      <Image
                        src={`/characters/${char.id}.png`}
                        alt={`${char.name} ${t("captainBadge")}`}
                        width={80}
                        height={80}
                        className={styles.charImg}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <span className={styles.charEmojiBack}>{char.emoji}</span>
                      {!canAccess && <div className={styles.lockOverlay}>🔒</div>}
                    </div>
                  </div>

                  {/* 이름 & 노선 */}
                  <div className={styles.charMeta}>
                    <p className={styles.charName}>{char.name} {t("captainBadge")}</p>
                    <p className={styles.charRoute}>
                      🛫 {getRouteName(char.region_id)}
                    </p>
                  </div>

                  {/* 호감도 */}
                  {canAccess && (
                    <div className={styles.affinityRow}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} style={{ fontSize: 12 }}>
                          {i < affinityStars ? "❤️" : "🤍"}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 버튼 */}
                  {canAccess ? (
                    <Link
                      href={`/chat/${char.id}`}
                      className={`btn btn-primary btn-sm ${styles.chatBtn}`}
                      id={`btn-chat-${char.id}`}
                    >
                      {t("startChat")}
                    </Link>
                  ) : (
                    <button
                      disabled
                      className={`btn btn-secondary btn-sm ${styles.chatBtn}`}
                      id={`btn-unlock-${char.id}`}
                      style={{ opacity: 0.6, cursor: "not-allowed" }}
                    >
                      {t("lockedPremium")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* 무료 안내 */}
          {!isPremium && (
            <div className={styles.freeNotice}>
              <p className={styles.freeNoticeText}>
                🆓 OPEN: <strong>양규현 · 오하늘</strong> {t("captainBadge")}
              </p>
              <Link href="/premium" className={styles.freeNoticeLink}>
                ⭐ {t("premiumOnly")} →
              </Link>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
