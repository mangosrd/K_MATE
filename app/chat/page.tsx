"use client";

import { useCallback, useState } from "react";
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
  const [videoState, setVideoState] = useState<"loading" | "ready" | "failed">("loading");
  // Some Android WebViews stop instead of honoring the native `loop` attribute.
  // Explicitly restarting on the final frame keeps the lobby alive after 10 seconds.
  const restartLobbyVideo = useCallback((video: HTMLVideoElement) => {
    video.currentTime = 0;
    void video.play().catch(() => {
      // A muted video is normally allowed to autoplay. If a device temporarily
      // blocks it, the next tap on a captain still proceeds to the chat route.
    });
  }, []);

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
              className={`${styles.lobbyVideo} ${videoState === "ready" ? styles.lobbyVideoReady : ""}`}
              src="/media/captain-lobby.mp4"
              autoPlay
              muted
              playsInline
              preload="auto"
              onCanPlay={() => setVideoState("ready")}
              onError={() => setVideoState("failed")}
              onEnded={(event) => restartLobbyVideo(event.currentTarget)}
              onTimeUpdate={(event) => {
                const video = event.currentTarget;
                if (video.duration && video.currentTime >= video.duration - 0.08) {
                  restartLobbyVideo(video);
                }
              }}
              aria-hidden="true"
            />
            {videoState !== "ready" && (
              <div
                className={`${styles.videoLoading} ${videoState === "failed" ? styles.videoLoadingFallback : ""}`}
                role="status"
                aria-live="polite"
              >
                <span className={styles.loadingPlane} aria-hidden="true">✈️</span>
                <strong>{videoState === "failed" ? "기장님들이 로비로 이동 중이에요…" : "기장님들이 꽃단장 하는 중…"}</strong>
                <small>잠시만 기다려 주세요</small>
              </div>
            )}
            <div className={styles.videoShade} aria-hidden="true" />

            {CAPTAIN_HOTSPOTS.map(({ characterId, className }) => {
              const char = MOCK_CHARACTERS.find((item) => item.id === characterId);
              if (!char) return null;

              const canAccess = canAccessCharacter(char.id, membership, freeSlots);
              // Open a free captain's room first; locked content still routes
              // to the premium screen at the actual access point.
              const href = canAccess ? `/captain/${char.id}` : "/premium";

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
