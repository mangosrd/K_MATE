"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BottomNav from "@/components/ui/BottomNav";
import LoadingSplash from "@/components/LoadingSplash";
import { getCharacterById, canAccessCharacter } from "@/lib/db/mock";
import { getLocalDiaries } from "@/lib/diary/store";
import { getAuthHeaders, getEffectiveUserId, setPreferredCaptainId } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import { useMembership, useFreeCharSlots } from "@/lib/auth/useAuthUser";
import type { DiaryEntry } from "@/types/database";
import styles from "./char-diary.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type Tab = "all" | "unlocked" | "locked";

export default function CharDiaryPage({ params }: { params: Promise<{ characterId: string }> }) {
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

  const [tab, setTab] = useState<Tab>("all");
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [coins, setCoins] = useState(0);
  const [unlockModal, setUnlockModal] = useState<DiaryEntry | null>(null);
  const [selected, setSelected] = useState<DiaryEntry | null>(null);
  const [unlockAnim, setUnlockAnim] = useState<string | null>(null);

  useEffect(() => {
    setPreferredCaptainId(characterId);
  }, [characterId]);

  useEffect(() => {
    const local = getLocalDiaries(characterId);

    fetch(`${BACKEND_URL}/diary/${getEffectiveUserId()}/${characterId}`, { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((remote: DiaryEntry[]) => {
        const remoteIds = new Set(remote.map((d) => d.id));
        const merged = [...remote, ...local.filter((d) => !remoteIds.has(d.id))];
        // 일기가 하나도 없는 캐릭터에게 예전엔 데모용 mock 일기를 그대로 보여주고 있었다 —
        // 실제 DB에 없는 id라 "해금" 시도하면 실패하는 가짜 데이터였다. 항상 실제 값(비어
        // 있으면 빈 배열)으로 덮어써서 정직한 빈 상태를 보여준다.
        setDiaries(merged);
      })
      .catch(() => {
        setDiaries(local);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

  const tabLabels: Record<Tab, string> = {
    all: t("tabAll"),
    unlocked: t("tabUnlocked"),
    locked: t("tabLocked"),
  };

  const filtered = diaries.filter((d) =>
    tab === "unlocked" ? d.unlocked : tab === "locked" ? !d.unlocked : true
  );

  const handleUnlock = async () => {
    if (!unlockModal) return;
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ userId: getEffectiveUserId(), diaryId: unlockModal.id, method: "coin" }),
      });
      const data = await res.json();
      if (data.success) {
        setDiaries((prev) => prev.map((d) => d.id === unlockModal.id ? { ...d, unlocked: true } : d));
        if (data.remainingCoins !== undefined) setCoins(data.remainingCoins);
        setUnlockAnim(unlockModal.id);
        setTimeout(() => setUnlockAnim(null), 800);
        setSelected({ ...unlockModal, unlocked: true });
      }
    } catch { /* no-op */ }
    finally { setUnlockModal(null); }
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
  };

  if (!char) return null;

  // 접근 제어는 반드시 모든 훅 선언 이후, 컴포넌트 로직 마지막에서 체크한다 — 위로
  // 올리면 canAccess가 리렌더링 중 바뀔 때 훅 호출 순서가 달라져 런타임 에러가 난다.
  // 목록 페이지(/diary)는 잠긴 캐릭터로 가는 링크를 안 보여주지만, URL을 직접 치고
  // 들어오면 그대로 뚫려있었다 — 여기서 실제로 막아야 한다.
  // membership/freeSlots는 마운트 직후엔 항상 기본값(무료회원)으로 시작해서 실제 백엔드
  // 조회가 끝나기 전까진, 진짜 프리미엄 회원도 잠깐 🔒 잠금 화면을 봤다가 콘텐츠로 바뀌는
  // 깜빡임이 있었다. 다만 이 대기가 필요한 건 프리미엄 전용 캐릭터일 때뿐이다 — 규현/하늘
  // 같은 무료 캐릭터는 canAccessCharacter가 membership 값을 보기도 전에 이미 true를
  // 반환하므로, 이 캐릭터들까지 매번 로딩 화면을 띄우면(뒤로가기로 재진입할 때마다 등)
  // 불필요한 깜빡임만 새로 생긴다.
  if (char.requires_premium && (!membershipLoaded || !freeSlotsLoaded)) {
    return <LoadingSplash />;
  }

  if (!canAccess) {
    return <LoadingSplash />;
  }

  return (
    <>
      <div className="page-content">
        {/* 헤더 */}
        <header className={styles.header}>
          <Link href="/diary" className={styles.backBtn}>‹</Link>
          <div className={styles.headerCenter}>
            <div className={styles.headerAvatar}>
              <Image src={`/characters/${char.id}.png`} alt={char.name} width={44} height={44} className={styles.headerAvatarImg} />
            </div>
            <div>
              <p className={styles.headerName}>{char.name} {t("diaryTitle")}</p>
              <p className={styles.headerSub}>{char.name}&apos;s Diary</p>
            </div>
          </div>
          {/* 편지함 pill 버튼 */}
          <Link
            href={`/letters/${char.id}`}
            id="btn-open-letters"
            className={styles.headerPill}
            title={t("letterMailboxLinkTitle")}
          >
            <span style={{ fontSize: 14 }}>💌</span>
            <span>편지함</span>
          </Link>

          {/* 포토앨범 pill 버튼 */}
          <Link
            href={`/gallery/${char.id}`}
            id="btn-open-gallery"
            className={styles.headerPill}
            title={t("galleryTitle")}
          >
            <span style={{ fontSize: 14 }}>🖼️</span>
            <span>앨범</span>
          </Link>

          <div className="coin-badge">
            <span className="coin-icon">🪙</span>
            <span>{coins}</span>
          </div>
        </header>

        <div className={styles.inner}>
          {/* 탭 */}
          <div className={styles.tabs} role="tablist">
            {(["all", "unlocked", "locked"] as Tab[]).map((tKey) => (
              <button
                key={tKey} role="tab" aria-selected={tab === tKey}
                className={`${styles.tab} ${tab === tKey ? styles.tabActive : ""}`}
                onClick={() => setTab(tKey)} id={`tab-${tKey}`}
              >
                <span className={styles.tabKo}>{tabLabels[tKey]}</span>
              </button>
            ))}
          </div>

          {/* 일기 없음 */}
          {filtered.length === 0 && (
            <div className={styles.empty}>
              <Image
                src="/diary-empty.png"
                alt="일기 없음"
                width={160}
                height={160}
                style={{ objectFit: "contain", opacity: 0.9 }}
              />
              <p className={styles.emptyMsg}>{t("diaryEmptyMsg", { name: char.name })}</p>
              <Link href={`/chat/${char.id}`} className="btn btn-primary btn-sm">
                {t("diaryEmptyBtn", { name: char.name })}
              </Link>
            </div>
          )}

          {/* 일기 목록 */}
          {filtered.map((diary) => (
            <div
              key={diary.id}
              className={`diary-card ${styles.diaryItem} ${unlockAnim === diary.id ? "unlock-animation" : ""}`}
            >
              <div className={styles.diaryMeta}>
                <div>
                  <p className={styles.diaryDate}>{fmt(diary.created_at)}</p>
                  <p className={styles.diaryPlace}>📍 {diary.place_name}</p>
                </div>
                {diary.unlocked
                  ? <span className="badge badge-mint">✓ {t("unlockedStatus")}</span>
                  : <span className="badge badge-muted">🔒 {t("lockedStatus")}</span>}
              </div>

              {diary.unlocked ? (
                <button className={styles.diaryBodyBtn} onClick={() => setSelected(diary)}>
                  <p className="diary-body">{diary.body_ko.substring(0, 50)}…</p>
                  <span className={styles.readMore}>📖 {t("diaryTitle")} →</span>
                </button>
              ) : (
                <div className={styles.lockedBody}>
                  <p className={`diary-body diary-locked`}>{diary.body_ko}</p>
                  <div className={styles.unlockPrompt}>
                    <div>
                      <p className={styles.unlockCoin}>🪙 {diary.unlock_cost} {t("coins")}</p>
                      <p className={styles.unlockEn}>{t("unlockWithCoins")}</p>
                    </div>
                    <button className="btn btn-gold btn-sm" onClick={() => setUnlockModal(diary)}>
                      {t("unlockBtn")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 열람 모달 */}
      {selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setSelected(null)}>
          <div className={styles.reader} onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <p className={styles.readerDate}>{fmt(selected.created_at)}</p>
            <p className={styles.readerPlace}>📍 {selected.place_name}</p>
            <div style={{ height: 1, background: "var(--border-subtle)", margin: "var(--space-md) 0" }} />
            <p className="diary-body">{selected.body_ko}</p>
            <button className="btn btn-ghost" style={{ marginTop: 24, alignSelf: "center" }} onClick={() => setSelected(null)}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 해금 확인 모달 */}
      {unlockModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setUnlockModal(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className={styles.modalTitle}>🔓 {t("unlockBtn")}</h2>
            <p className={styles.modalSub}>{unlockModal.unlock_cost} {t("coins")}</p>
            <div className={styles.modalCoins}>
              <span>{t("coins")}</span>
              <span style={{ color: "var(--gold)", fontWeight: 700 }}>🪙 {coins}</span>
            </div>
            <div className={styles.modalActions}>
              <button className={`btn btn-secondary btn-lg ${styles.pillBtn}`} onClick={() => setUnlockModal(null)}>✕</button>
              {coins >= unlockModal.unlock_cost
                ? <button className={`btn btn-gold btn-lg ${styles.pillBtn}`} onClick={handleUnlock}>🪙 {unlockModal.unlock_cost} {t("unlockBtn")}</button>
                : <Link href="/coins" className={`btn btn-primary btn-lg ${styles.pillBtn}`}>SHOP</Link>}
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </>
  );
}
