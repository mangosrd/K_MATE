"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { MOCK_CHARACTERS, canAccessCharacter } from "@/lib/db/mock";
import { useMembership, useFreeCharSlots } from "@/lib/auth/useAuthUser";
import { useLanguage } from "@/components/LanguageContext";
import styles from "./chat-select.module.css";

// ── 뮤직 플레이어 ──────────────────────────────────────────────────────────
const RAW_TRACKS = [
  {
    id: "title",
    src: "/media/music/title.mp3",
    ko: { title: "K-MATE 타이틀곡", artist: "K-MATE OST" },
    en: { title: "K-MATE Main Theme", artist: "K-MATE OST" },
  },
  {
    id: "kyuhyun",
    src: "/media/music/kyuhyun.mp3",
    ko: { title: "규현 테마", artist: "양규현 기장" },
    en: { title: "Kyuhyun Theme", artist: "Captain Kyuhyun" },
  },
  {
    id: "haneul",
    src: "/media/music/haneul.mp3",
    ko: { title: "하늘 테마", artist: "오하늘 기장" },
    en: { title: "Haneul Theme", artist: "Captain Haneul" },
  },
  {
    id: "sunwoo",
    src: "/media/music/sunwoo.mp3",
    ko: { title: "선우 테마", artist: "차선우 기장" },
    en: { title: "Sunwoo Theme", artist: "Captain Sunwoo" },
  },
  {
    id: "sangwoo",
    src: "/media/music/sangwoo.mp3",
    ko: { title: "상우 테마", artist: "천상우 기장" },
    en: { title: "Sangwoo Theme", artist: "Captain Sangwoo" },
  },
  {
    id: "yongwoo",
    src: "/media/music/yongwoo.mp3",
    ko: { title: "용우 테마", artist: "권용우 기장" },
    en: { title: "Yongwoo Theme", artist: "Captain Yongwoo" },
  },
];

// ── SVG 음악 컨트롤 아이콘 ──────────────────────────────────
function IconPrev() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
    </svg>
  );
}

function IconNext() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "2px" }} aria-hidden="true">
      <path d="M8 5v14l11-7z"/>
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
  );
}

function MusicPlayer() {
  const { language } = useLanguage();
  const isKo = language === "ko";
  const tracks = RAW_TRACKS.map((t) => ({
    id: t.id,
    src: t.src,
    ...(isKo ? t.ko : t.en),
  }));

  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = tracks[trackIndex];

  // 오디오 요소 초기화
  useEffect(() => {
    const audio = new Audio();
    audio.loop = false;
    audio.preload = "metadata";
    audioRef.current = audio;

    const handleEnded = () => {
      setTrackIndex((prev) => (prev + 1) % tracks.length);
    };
    const handleTimeUpdate = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.pause();
    };
  }, [tracks.length]);

  // 트랙 변경 시 소스 교체
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = currentTrack.src;
    audio.load();
    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
    }
    setProgress(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIndex]);

  // 재생/일시정지
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      if (!audio.src) audio.src = currentTrack.src;
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const prev = () => setTrackIndex((i) => (i - 1 + tracks.length) % tracks.length);
  const next = () => setTrackIndex((i) => (i + 1) % tracks.length);

  const togglePlay = () => setIsPlaying((p) => !p);

  return (
    <div
      className={`${styles.musicPlayer} ${isExpanded ? styles.musicPlayerExpanded : ""} ${isPlaying ? styles.musicPlayerPlaying : ""}`}
      role="region"
      aria-label="음악 플레이어"
    >
      {/* 축소 상태 — 재생 아이콘 + 제목 */}
      <button
        className={styles.musicCollapsed}
        onClick={() => setIsExpanded((e) => !e)}
        aria-label={isExpanded ? "플레이어 접기" : "플레이어 펼치기"}
        id="music-player-toggle"
      >
        <span className={`${styles.musicNote} ${isPlaying ? styles.musicNoteSpinning : ""}`} aria-hidden="true">
          🎵
        </span>
        <span className={styles.musicMiniTitle}>{currentTrack.title}</span>
        <span className={styles.musicChevron} aria-hidden="true">{isExpanded ? "▾" : "▸"}</span>
      </button>

      {/* 확장 상태 — 풀 컨트롤 */}
      {isExpanded && (
        <div className={styles.musicControls}>
          <div className={styles.musicInfo}>
            <p className={styles.musicTitle}>{currentTrack.title}</p>
            <p className={styles.musicArtist}>{currentTrack.artist}</p>
          </div>

          {/* 프로그레스 바 */}
          <div className={styles.musicProgress} aria-hidden="true">
            <div className={styles.musicProgressFill} style={{ width: `${progress * 100}%` }} />
          </div>

          {/* 버튼 */}
          <div className={styles.musicButtons}>
            <button
              onClick={prev}
              className={styles.musicBtn}
              aria-label="이전 곡"
              id="music-prev"
            >
              <IconPrev />
            </button>
            <button
              onClick={togglePlay}
              className={`${styles.musicBtn} ${styles.musicBtnPlay}`}
              aria-label={isPlaying ? "일시정지" : "재생"}
              id="music-play-pause"
            >
              {isPlaying ? <IconPause /> : <IconPlay />}
            </button>
            <button
              onClick={next}
              className={styles.musicBtn}
              aria-label="다음 곡"
              id="music-next"
            >
              <IconNext />
            </button>
          </div>

          {/* 트랙 목록 */}
          <ul className={styles.musicTrackList}>
            {tracks.map((track, i) => (
              <li key={track.id}>
                <button
                  className={`${styles.musicTrackItem} ${i === trackIndex ? styles.musicTrackItemActive : ""}`}
                  onClick={() => { setTrackIndex(i); setIsPlaying(true); }}
                  id={`music-track-${track.id}`}
                >
                  <span className={styles.musicTrackNum}>{i === trackIndex && isPlaying ? "♪" : `${i + 1}`}</span>
                  <span className={styles.musicTrackName}>{track.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

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

          <MusicPlayer />
        </main>
      </div>
      <BottomNav />
    </>
  );
}
