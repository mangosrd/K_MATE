"use client";

import { useState, use } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { getCharacterById, getDiaryForCharacter, MOCK_ECONOMY } from "@/lib/db/mock";
import { useLanguage } from "@/components/LanguageContext";
import type { DiaryEntry } from "@/types/database";
import styles from "./char-diary.module.css";

type Tab = "all" | "unlocked" | "locked";

export default function CharDiaryPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = use(params);
  const { t } = useLanguage();
  const char = getCharacterById(characterId);
  const initialDiaries = getDiaryForCharacter(characterId);

  const [tab, setTab] = useState<Tab>("all");
  const [diaries, setDiaries] = useState(initialDiaries);
  const [coins, setCoins] = useState(MOCK_ECONOMY.coins);
  const [unlockModal, setUnlockModal] = useState<DiaryEntry | null>(null);
  const [selected, setSelected] = useState<DiaryEntry | null>(null);
  const [unlockAnim, setUnlockAnim] = useState<string | null>(null);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-001", diaryId: unlockModal.id, method: "coin" }),
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

  return (
    <>
      <div className="page-content">
        {/* 헤더 */}
        <header className={styles.header}>
          <Link href="/diary" className={styles.backBtn}>‹</Link>
          <div className={styles.headerCenter}>
            <div className={styles.headerAvatar}>{char.emoji}</div>
            <div>
              <p className={styles.headerName}>{char.name} {t("diaryTitle")}</p>
              <p className={styles.headerSub}>{char.name}&apos;s Diary</p>
            </div>
          </div>
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
              <p>📔</p>
              <p>{t("diaryTitle")}</p>
              <Link href={`/chat/${char.id}`} className="btn btn-primary btn-sm">
                💬 {char.name}
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
              <button className="btn btn-secondary" onClick={() => setUnlockModal(null)}>✕</button>
              {coins >= unlockModal.unlock_cost
                ? <button className="btn btn-gold" onClick={handleUnlock}>🪙 {unlockModal.unlock_cost} {t("unlockBtn")}</button>
                : <Link href="/premium" className="btn btn-primary">SHOP</Link>}
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </>
  );
}
