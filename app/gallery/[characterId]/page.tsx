"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BottomNav from "@/components/ui/BottomNav";
import LoadingSplash from "@/components/LoadingSplash";
import { getCharacterById, canAccessCharacter } from "@/lib/db/mock";
import { getAuthHeaders, getEffectiveUserId } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import { useMembership, useFreeCharSlots } from "@/lib/auth/useAuthUser";
import styles from "./gallery.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface GalleryImage {
  id: string;
  image_url: string;
  title: string | null;
  order: number;
  unlock_cost: number;
  unlocked: boolean;
}

export default function CharGalleryPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = use(params);
  const { t } = useLanguage();
  const char = getCharacterById(characterId);
  const { membership, membershipLoaded } = useMembership();
  const { freeSlots, freeSlotsLoaded } = useFreeCharSlots();
  const router = useRouter();
  const canAccess = char ? canAccessCharacter(characterId, membership, freeSlots) : false;

  useEffect(() => {
    if (char?.requires_premium && membershipLoaded && freeSlotsLoaded && !canAccess) {
      router.replace("/premium");
    }
  }, [canAccess, char?.requires_premium, freeSlotsLoaded, membershipLoaded, router]);

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [coins, setCoins] = useState(0);
  const [unlockTarget, setUnlockTarget] = useState<GalleryImage | null>(null);
  const [viewing, setViewing] = useState<GalleryImage | null>(null);
  const [loading, setLoading] = useState(false);

  const loadGallery = () => {
    const userId = getEffectiveUserId();
    fetch(`${BACKEND_URL}/gallery/${characterId}?user_id=${userId}`, { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: GalleryImage[]) => setImages(data))
      .catch(() => {});

    fetch(`${BACKEND_URL}/user/${userId}`, { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setCoins(data.coins); })
      .catch(() => {});
  };

  useEffect(loadGallery, [characterId]);

  const handleUnlock = async () => {
    if (!unlockTarget) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/gallery/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ user_id: getEffectiveUserId(), image_id: unlockTarget.id }),
      });
      const data = await res.json();
      if (data.success) {
        setCoins(data.remaining_coins);
        setImages((prev) => prev.map((img) => (img.id === unlockTarget.id ? { ...img, unlocked: true } : img)));
      }
    } catch {
      /* no-op */
    } finally {
      setLoading(false);
      setUnlockTarget(null);
    }
  };

  if (!char) return null;

  // 접근 제어는 반드시 모든 훅 선언 이후, 컴포넌트 로직 마지막에서 체크한다 — 위로
  // 올리면 canAccess가 리렌더링 중 바뀔 때 훅 호출 순서가 달라져 런타임 에러가 난다.
  // 목록 화면들이 잠긴 캐릭터로 가는 링크를 안 보여줘도, URL을 직접 치고 들어오면
  // 그대로 뚫려있었다 — 여기서 실제로 막아야 한다.
  // membership/freeSlots는 마운트 직후엔 항상 기본값(무료회원)으로 시작해서 실제 백엔드
  // 조회가 끝나기 전까진, 진짜 프리미엄 회원도 잠깐 🔒 잠금 화면을 봤다가 콘텐츠로 바뀌는
  // 깜빡임이 있었다. 다만 이 대기가 필요한 건 프리미엄 전용 캐릭터일 때뿐이다 — 무료
  // 캐릭터는 membership을 보기도 전에 이미 접근이 허용되므로, 매번(뒤로가기로 재진입할
  // 때마다도) 로딩 화면을 띄우면 불필요한 깜빡임만 새로 생긴다.
  if (char.requires_premium && (!membershipLoaded || !freeSlotsLoaded)) {
    return <LoadingSplash />;
  }

  if (!canAccess) {
    return <LoadingSplash />;
  }

  return (
    <>
      <div className="page-content">
        <header className={styles.header}>
          <Link href={`/diary/${char.id}`} className={styles.backBtn}>‹</Link>
          <div className={styles.headerCenter}>
            <div className={styles.headerAvatar}>
              <Image src={char.avatar_url} alt={char.name} width={36} height={36} className={styles.headerAvatarImg} />
            </div>
            <div>
              <p className={styles.headerName}>{char.name} {t("galleryTitle")}</p>
              <p className={styles.headerSub}>{char.name}&apos;s Gallery</p>
            </div>
          </div>
          <div className="coin-badge">
            <span className="coin-icon">🪙</span>
            <span>{coins}</span>
          </div>
        </header>

        <div className={styles.inner}>
          {images.length === 0 ? (
            <div className={styles.empty}>
              <p>📷</p>
              <p>{t("galleryEmptyMsg")}</p>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {images.map((img) => (
                  <div key={img.id} className={styles.card}>
                    {img.unlocked ? (
                      <button
                        type="button"
                        onClick={() => setViewing(img)}
                        style={{ all: "unset", display: "block", width: "100%", height: "100%", cursor: "pointer" }}
                      >
                        <Image src={img.image_url} alt={img.title ?? char.name} width={300} height={400} className={styles.cardImg} />
                        {img.title && <span className={styles.cardTitle}>{img.title}</span>}
                      </button>
                    ) : (
                      <>
                        <Image src={img.image_url} alt="" width={300} height={400} className={styles.cardImgLocked} aria-hidden="true" />
                        <div className={styles.lockOverlay}>
                          <span className={styles.lockIcon}>🔒</span>
                          <span className={styles.unlockCost}>🪙 {img.unlock_cost}</span>
                          <button type="button" className={styles.unlockBtn} onClick={() => setUnlockTarget(img)}>
                            {t("unlockBtn")}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <p className={styles.notice}>{t("gallerySoftLockNotice")}</p>
            </>
          )}
        </div>
      </div>

      {/* 확대 보기 */}
      {viewing && (
        <div className={styles.viewer} role="dialog" aria-modal="true" onClick={() => setViewing(null)}>
          <button className={styles.viewerClose} onClick={() => setViewing(null)} aria-label="close">✕</button>
          <Image
            src={viewing.image_url}
            alt={viewing.title ?? char.name}
            width={800}
            height={1067}
            className={styles.viewerImg}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* 해금 확인 모달 */}
      {unlockTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setUnlockTarget(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className={styles.modalTitle}>🔓 {t("unlockBtn")}</h2>
            <p className={styles.modalSub}>{unlockTarget.unlock_cost} {t("coins")}</p>
            <div className={styles.modalCoins}>
              <span>{t("coins")}</span>
              <span style={{ color: "var(--gold)", fontWeight: 700 }}>🪙 {coins}</span>
            </div>
            <div className={styles.modalActions}>
              <button className={`btn btn-secondary btn-lg ${styles.pillBtn}`} onClick={() => setUnlockTarget(null)}>✕</button>
              {coins >= unlockTarget.unlock_cost ? (
                <button className={`btn btn-gold btn-lg ${styles.pillBtn}`} onClick={handleUnlock} disabled={loading}>
                  🪙 {unlockTarget.unlock_cost} {t("unlockBtn")}
                </button>
              ) : (
                <Link href="/coins" className={`btn btn-primary btn-lg ${styles.pillBtn}`}>SHOP</Link>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
