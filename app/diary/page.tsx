"use client";

import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { MOCK_CHARACTERS, MOCK_USER, MOCK_DIARY, canAccessCharacter } from "@/lib/db/mock";
import { getCurrentUser } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import styles from "./diary.module.css";

export default function DiarySelectPage() {
  const { t } = useLanguage();

  const diaryCountByChar = (charId: string) =>
    MOCK_DIARY.filter((d) => d.character_id === charId).length;
  const unlockedCount = (charId: string) =>
    MOCK_DIARY.filter((d) => d.character_id === charId && d.unlocked).length;

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
              const canAccess = canAccessCharacter(char.id, getCurrentUser()?.membership ?? MOCK_USER.membership, MOCK_USER.free_character_slots);
              const total = diaryCountByChar(char.id);
              const unlocked = unlockedCount(char.id);

              return (
                <div key={char.id} className={`${styles.charCard} ${!canAccess ? styles.charLocked : ""}`}>
                  <div className={styles.charAvatar}>{char.emoji}</div>

                  <div className={styles.charInfo}>
                    <div className={styles.charNameRow}>
                      <p className={styles.charName}>{char.name}</p>
                      {char.requires_premium && !canAccess
                        ? <span className="badge badge-gold">⭐ {t("premiumOnly")}</span>
                        : <span className="badge badge-mint">✓ OPEN</span>}
                    </div>
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
