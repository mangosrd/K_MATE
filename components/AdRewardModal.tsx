"use client";

/**
 * AdRewardModal — 광고 시청 보상 모달
 *
 * 실제 앱 배포 시 교체 지점:
 *  - Android: Google AdMob Rewarded Ad SDK (com.google.android.gms:play-services-ads)
 *  - iOS: AdMob / SKAdNetwork
 *  - 웹: 카카오 광고 / Google AdSense Rewarded
 *
 * 현재는 프로토타입으로, 15초 카운트다운 후 보상을 지급하는 방식으로 시뮬레이션합니다.
 */

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageContext";

interface Props {
  isOpen: boolean;
  remainingCount: number;
  onClose: () => void;
  onRewardEarned: (coins: number) => void;
}

const AD_DURATION = 15; // 초

export default function AdRewardModal({ isOpen, remainingCount, onClose, onRewardEarned }: Props) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<"watching" | "done">("watching");
  const [countdown, setCountdown] = useState(AD_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPhase("watching");
      setCountdown(AD_DURATION);
      return;
    }

    setPhase("watching");
    setCountdown(AD_DURATION);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase("done");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  const handleCollect = () => {
    onRewardEarned(5);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={phase === "done" ? onClose : undefined}
      style={{ zIndex: 9999 }}
    >
      <div
        className="modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 360, textAlign: "center" }}
      >
        <div className="modal-handle" />

        {phase === "watching" ? (
          <>
            {/* 광고 영역 (실제 앱에서는 AdMob 뷰가 들어감) */}
            <div style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
              borderRadius: "var(--radius-lg)",
              padding: "32px 20px",
              marginBottom: 20,
              position: "relative",
              overflow: "hidden",
            }}>
              {/* 가짜 광고 콘텐츠 */}
              <div style={{ fontSize: 48, marginBottom: 12 }}>✈️</div>
              <p style={{ color: "#fff", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
                K-MATE Premium
              </p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                한국의 모든 도시를 탐험하세요
              </p>
              <div style={{
                marginTop: 16,
                padding: "8px 20px",
                background: "rgba(255,255,255,0.15)",
                borderRadius: "var(--radius-full)",
                display: "inline-block",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
              }}>
                광고 · AD
              </div>

              {/* 카운트다운 배지 */}
              <div style={{
                position: "absolute",
                top: 10, right: 10,
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                borderRadius: "var(--radius-full)",
                padding: "4px 10px",
                fontSize: 13,
                fontWeight: 700,
              }}>
                {countdown}초
              </div>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              광고를 끝까지 시청하면 <strong style={{ color: "var(--gold)" }}>🪙 5코인</strong>을 드려요
            </p>

            {/* 진행 바 */}
            <div style={{
              height: 4,
              background: "var(--bg-elevated)",
              borderRadius: 2,
              overflow: "hidden",
              marginBottom: 16,
            }}>
              <div style={{
                height: "100%",
                width: `${((AD_DURATION - countdown) / AD_DURATION) * 100}%`,
                background: "var(--gradient-korea)",
                borderRadius: 2,
                transition: "width 1s linear",
              }} />
            </div>

            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
              오늘 남은 횟수: {remainingCount}회 / {Math.round(remainingCount * 5)}코인 획득 가능
            </p>
          </>
        ) : (
          <>
            {/* 보상 획득 완료 */}
            <div style={{ padding: "16px 0 8px" }}>
              <div style={{
                fontSize: 56,
                marginBottom: 12,
                animation: "bounce 0.5s ease",
              }}>🎉</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
                보상 획득!
              </h2>
              <p style={{ fontSize: 15, color: "var(--gold)", fontWeight: 700, marginBottom: 4 }}>
                🪙 +5 코인
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 24 }}>
                오늘 남은 횟수: {remainingCount - 1 >= 0 ? remainingCount - 1 : 0}회
              </p>
              <button
                className="btn btn-gold btn-lg"
                style={{ width: "100%" }}
                onClick={handleCollect}
              >
                코인 받기 🪙
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
