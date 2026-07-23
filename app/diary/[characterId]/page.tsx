"use client";

import { useState, use } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { getCharacterById, getDiaryForCharacter, MOCK_ECONOMY } from "@/lib/db/mock";
import type { DiaryEntry } from "@/types/database";
import styles from "./char-diary.module.css";

type Tab = "all" | "unlocked" | "locked";
const TAB_LABELS: Record<Tab, { ko: string; en: string }> = {
  all:      { ko: "전체", en: "All" },
  unlocked: { ko: "해금", en: "Unlocked" },
  locked:   { ko: "잠김", en: "Locked" },
};

export default function CharDiaryPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = use(params);
  const char = getCharacterById(characterId);
  const initialDiaries = getDiaryForCharacter(characterId);

  const [tab, setTab] = useState<Tab>("all");
  const [diaries, setDiaries] = useState(initialDiaries);
  const [coins, setCoins] = useState(MOCK_ECONOMY.coins);
  const [unlockModal, setUnlockModal] = useState<DiaryEntry | null>(null);
  const [selected, setSelected] = useState<DiaryEntry | null>(null);
  const [unlockAnim, setUnlockAnim] = useState<string | null>(null);

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
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
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
              <p className={styles.headerName}>{char.name}의 일기</p>
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
            {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
              <button
                key={t} role="tab" aria-selected={tab === t}
                className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
                onClick={() => setTab(t)} id={`tab-${t}`}
              >
                <span className={styles.tabKo}>{TAB_LABELS[t].ko}</span>
                <span className={styles.tabEn}>{TAB_LABELS[t].en}</span>
              </button>
            ))}
          </div>

          {/* 일기 없음 */}
          {filtered.length === 0 && (
            <div className={styles.empty}>
              <p>📔</p>
              <p>아직 일기가 없어요</p>
              <p className={styles.emptyEn}>No diary entries yet. Start chatting!</p>
              <Link href={`/chat/${char.id}`} className="btn btn-primary btn-sm">
                💬 {char.name}과 대화하기
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
                  ? <span className="badge badge-mint">✓ 해금</span>
                  : <span className="badge badge-muted">🔒 잠김</span>}
              </div>

              {diary.unlocked ? (
                <button className={styles.diaryBodyBtn} onClick={() => setSelected(diary)}>
                  <p className="diary-body">{diary.body_ko.substring(0, 50)}…</p>
                  <span className={styles.readMore}>📖 읽기 · Read →</span>
                </button>
              ) : (
                <div className={styles.lockedBody}>
                  <p className={`diary-body diary-locked`}>{diary.body_ko}</p>
                  <div className={styles.unlockPrompt}>
                    <div>
                      <p className={styles.unlockCoin}>🪙 {diary.unlock_cost} 코인으로 해금</p>
                      <p className={styles.unlockEn}>Unlock with {diary.unlock_cost} coins</p>
                    </div>
                    <button className="btn btn-gold btn-sm" onClick={() => setUnlockModal(diary)}>
                      해금하기
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
              닫기 · Close
            </button>
          </div>
        </div>
      )}

      {/* 해금 확인 모달 */}
      {unlockModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setUnlockModal(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className={styles.modalTitle}>🔓 일기 해금</h2>
            <p className={styles.modalSub}>코인 {unlockModal.unlock_cost}개가 차감됩니다.</p>
            <div className={styles.modalCoins}>
              <span>현재 보유</span>
              <span style={{ color: "var(--gold)", fontWeight: 700 }}>🪙 {coins}</span>
            </div>
            <div className={styles.modalActions}>
              <button className="btn btn-secondary" onClick={() => setUnlockModal(null)}>취소</button>
              {coins >= unlockModal.unlock_cost
                ? <button className="btn btn-gold" onClick={handleUnlock}>🪙 {unlockModal.unlock_cost} 코인 해금</button>
                : <Link href="/premium" className="btn btn-primary">코인 충전</Link>}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
