"use client";

import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { MOCK_CHARACTERS, canAccessCharacter } from "@/lib/db/mock";
import { useMembership, useFreeCharSlots } from "@/lib/auth/useAuthUser";
import { useLanguage } from "@/components/LanguageContext";
import styles from "./chat-select.module.css";

type Hotspot = {
  characterId: string;
  className: string;
};

// The video is composed around these five fixed seats. Percentage hit areas
// preserve the intended positions on every phone width.
const CAPTAIN_HOTSPOTS: Hotspot[] = [
  { characterId: "sangwoo", className: "sangwoo" },
  { characterId: "haneul", className: "haneul" },
  { characterId: "kyuhyun", className: "kyuhyun" },
  { characterId: "yongwoo", className: "yongwoo" },
  { characterId: "sunwoo", className: "sunwoo" },
];

export default function ChatSelectPage() {
  const { t } = useLanguage();
  const { membership } = useMembership();
  const { freeSlots } = useFreeCharSlots();

  return (
    <>
      <div className="page-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">{t("chatTitle")}</h1>
            <p className={styles.pageSub}>{t("chatSub")}</p>
          </div>
        </header>

        <main className={styles.lobby}>
          <div className={styles.lobbyIntro}>
            <p className={styles.lobbyEyebrow}>K-MATE FLIGHT LOUNGE</p>
            <h2>{t("selectCaptain")}</h2>
            <p>{t("selectCaptainSub")}</p>
          </div>

          <section className={styles.videoStage} aria-label={t("selectCaptain")}>
            <video
              className={styles.lobbyVideo}
              src="/media/captain-lobby.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
            <div className={styles.videoShade} aria-hidden="true" />

            {CAPTAIN_HOTSPOTS.map(({ characterId, className }) => {
              const char = MOCK_CHARACTERS.find((item) => item.id === characterId);
              if (!char) return null;

              const canAccess = canAccessCharacter(char.id, membership, freeSlots);
              const href = canAccess ? `/chat/${char.id}` : "/premium";

              return (
                <Link
                  key={char.id}
                  href={href}
                  className={`${styles.hotspot} ${styles[className]} ${!canAccess ? styles.hotspotLocked : ""}`}
                  id={`captain-hotspot-${char.id}`}
                  aria-label={canAccess
                    ? `${char.name} ${t("captainBadge")} ${t("startChat")}`
                    : `${char.name} ${t("premiumOnly")}`}
                >
                  <span className={styles.hotspotLabel}>
                    <strong>{char.name}</strong>
                    <small>{canAccess ? t("startChat") : `🔒 ${t("premiumOnly")}`}</small>
                  </span>
                </Link>
              );
            })}
          </section>

          <p className={styles.tapHint}>기장님을 탭하면 바로 대화를 시작할 수 있어요.</p>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
