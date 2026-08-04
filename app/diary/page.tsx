"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import BottomNav from "@/components/ui/BottomNav";
import { MOCK_CHARACTERS, canAccessCharacter } from "@/lib/db/mock";
import { getEffectiveUserId } from "@/lib/auth/store";
import { useMembership, useFreeCharSlots } from "@/lib/auth/useAuthUser";
import { getAllLocalDiaries } from "@/lib/diary/store";
import { useLanguage } from "@/components/LanguageContext";
import type { DiaryEntry } from "@/types/database";
import styles from "./diary.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function DiarySelectPage() {
  const { t } = useLanguage();
  const { membership } = useMembership();
  const { freeSlots } = useFreeCharSlots();
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    const local = getAllLocalDiaries();
    const userId = getEffectiveUserId();

    Promise.all(
      MOCK_CHARACTERS.map((c) =>
        fetch(`${BACKEND_URL}/diary/${userId}/${c.id}`)
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => [])
      )
    ).then((results: DiaryEntry[][]) => {
      const remote = results.flat();
      const remoteIds = new Set(remote.map((d) => d.id));
      const real = [...remote, ...local.filter((d) => !remoteIds.has(d.id))];
      // 일기가 하나도 없는 신규 유저에게 예전엔 데모용 mock 일기 3개를 그대로 보여주고
      // 있었다 — 실제 존재하지 않는 id라 "해금" 시도하면 실패하는 가짜 데이터였다.
      // 항상 실제 값(비어있으면 빈 배열)으로 덮어써서 정직한 빈 상태를 보여준다.
      setDiaries(real);
    });
  }, []);

  const diaryCountByChar = (charId: string) =>
    diaries.filter((d) => d.character_id === charId).length;
  const unlockedCount = (charId: string) =>
    diaries.filter((d) => d.character_id === charId && d.unlocked).length;

  return (
    <>
      <div className="page-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">{t("diaryTitle")}</h1>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{t("diarySub")}</p>
          </div>
        </header>

        <div className={styles.inner}>
          <p className={styles.hint}>{t("diarySub")}</p>

          <div className={styles.charList}>
            {MOCK_CHARACTERS.map((char) => {
              const canAccess = canAccessCharacter(char.id, membership, freeSlots);
              const total = diaryCountByChar(char.id);
              const unlocked = unlockedCount(char.id);

              return (
                <div key={char.id} className={`${styles.charCard} ${!canAccess ? styles.charLocked : ""}`}>
                  <div className={styles.charAvatar}>
                    <Image src={`/characters/${char.id}.png`} alt={char.name} width={56} height={56} className={styles.charAvatarImg} />
                  </div>

                  <div className={styles.charInfo}>
                    <p className={styles.charName}>{char.name}</p>
                    <p className={styles.charRegion}>📍 {
                      char.region_id === "seoul" ? "서울·경기" :
                      char.region_id === "jeonju" ? "전주·전라" :
                      char.region_id === "busan" ? "부산·경남" :
                      char.region_id === "chungcheong" ? "충청·공주" : "제주"
                    }</p>
                    {canAccess && (
                      <p className={styles.diaryCount}>
                        {t("diaryTitle")} {unlocked}/{total} {t("unlockedStatus")}
                      </p>
                    )}
                  </div>

                  {char.requires_premium && !canAccess
                    ? <span className={`badge badge-gold ${styles.accessBadge}`}>⭐ {t("premiumOnly")}</span>
                    : <span className={`badge badge-mint ${styles.accessBadge}`}>✓ OPEN</span>}

                  {canAccess ? (
                    <Link href={`/diary/${char.id}`} className="btn btn-primary btn-sm" id={`btn-diary-${char.id}`}>
                      {t("diaryTitle")} →
                    </Link>
                  ) : (
                    <button disabled className="btn btn-secondary btn-sm" id={`btn-premium-diary-${char.id}`} style={{ opacity: 0.6, cursor: "not-allowed" }}>
                      🔒 {t("lockedStatus")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
