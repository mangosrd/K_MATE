"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import BottomNav from "@/components/ui/BottomNav";
import {
  getCharactersForRegion, MOCK_USER, MOCK_ALL_PROGRESS,
  canAccessCharacter,
} from "@/lib/db/mock";
import { getEffectiveUserId } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import type { Region, Progress } from "@/types/database";
import styles from "./region.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface RegionHighlight {
  id: string;
  name: string;
  en: string;
  emoji: string;
}

const REGION_HIGHLIGHTS: Record<string, RegionHighlight[]> = {
  seoul: [
    { id: "p1", name: "경복궁", en: "Gyeongbokgung", emoji: "🏯" },
    { id: "p2", name: "홍대", en: "Hongdae", emoji: "🌆" },
    { id: "p3", name: "남산타워", en: "Namsan Tower", emoji: "🗼" },
  ],
  jeonju: [
    { id: "p1", name: "한옥마을", en: "Hanok Village", emoji: "🏘️" },
    { id: "p2", name: "비빔밥 거리", en: "Bibimbap Street", emoji: "🍚" },
    { id: "p3", name: "경기전", en: "Gyeonggijeon", emoji: "🏯" },
  ],
  busan: [
    { id: "p1", name: "해운대", en: "Haeundae Beach", emoji: "🌊" },
    { id: "p2", name: "자갈치시장", en: "Jagalchi Market", emoji: "🐟" },
    { id: "p3", name: "광안대교", en: "Gwangan Bridge", emoji: "🌉" },
  ],
  chungcheong: [
    { id: "p1", name: "무령왕릉", en: "King Muryeong's Tomb", emoji: "👑" },
    { id: "p2", name: "공산성", en: "Gongsanseong Fortress", emoji: "🏯" },
    { id: "p3", name: "금강", en: "Geumgang River", emoji: "🌊" },
  ],
  jeju: [
    { id: "p1", name: "성산일출봉", en: "Seongsan Ilchulbong", emoji: "🌅" },
    { id: "p2", name: "한라산", en: "Hallasan", emoji: "🌋" },
    { id: "p3", name: "우도", en: "Udo Island", emoji: "🏝️" },
  ],
};

const REGION_EMOJI: Record<string, string> = {
  seoul: "🏯", jeonju: "🏮", busan: "⚓", chungcheong: "🏛️", jeju: "🌋",
};

export default function RegionView({ region }: { region: Region }) {
  const { t } = useLanguage();
  const characters = getCharactersForRegion(region.id);
  const highlights = REGION_HIGHLIGHTS[region.id] ?? [];
  const [allProgress, setAllProgress] = useState<Record<string, Progress>>(MOCK_ALL_PROGRESS);

  useEffect(() => {
    const userId = getEffectiveUserId();
    Promise.all(
      characters.map((c) =>
        fetch(`${BACKEND_URL}/progress/${userId}/${c.id}`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      const merged: Record<string, Progress> = {};
      results.forEach((p) => { if (p) merged[p.character_id] = p; });
      if (Object.keys(merged).length > 0) setAllProgress(merged);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region.id]);

  return (
    <>
      <div className="page-content">
        {/* 헤더 (여권 표지 스타일) */}
        <div className={styles.passportCover}>
          <Link href="/map" className={styles.backBtn} aria-label={t("backToMap")}>‹</Link>

          {/* 여권 스탬프 무늬 */}
          <div className={styles.passportBg} aria-hidden="true" />

          <div className={styles.passportHeader}>
            <div className={styles.passportEmblem}>
              <span className={styles.passportEmoji}>{REGION_EMOJI[region.id]}</span>
            </div>
            <div className={styles.passportInfo}>
              <p className={styles.passportCountry}>REPUBLIC OF KOREA</p>
              <h1 className={styles.passportRegion}>{region.name}</h1>
              <p className={styles.passportRegionEn}>{region.name_en}</p>
            </div>
          </div>

          {/* 여권 하단 바코드 라인 */}
          <div className={styles.passportFooter}>
            <p className={styles.passportCode}>KRM&lt;&lt;{region.airport_code}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
          </div>
        </div>

        <div className={styles.inner}>
          {/* 지역 설명 */}
          <div className={styles.regionDesc}>
            <p className={styles.descKo}>{region.description}</p>
            <p className={styles.descEn}>{region.description_en}</p>
          </div>

          {/* 메이트 선택 */}
          <section>
            <p className={styles.sectionTitle}>
              {t("chooseMate")}
            </p>

            <div className={styles.characterList}>
              {characters.map((char) => {
                const canAccess = canAccessCharacter(char.id, MOCK_USER.membership, MOCK_USER.free_character_slots);
                const progress = allProgress[char.id];
                const affinity = progress?.affinity ?? 0;
                const affinityStars = Math.round(affinity / 20);

                return (
                  <div key={char.id} className={`${styles.charCard} ${!canAccess ? styles.charLocked : ""}`}>
                    {/* 왼쪽 — 아바타 */}
                    <div className={styles.charLeft}>
                      <div className={styles.charAvatar}>
                        <Image
                          src={`/characters/${char.id}.png`}
                          alt={`${char.name} 기장`}
                          width={72}
                          height={72}
                          className={styles.charImg}
                        />
                        <span className={styles.charEmojiBack}>{char.emoji}</span>
                        {char.requires_premium && !canAccess && (
                          <div className={styles.lockOverlay}>🔒</div>
                        )}
                      </div>
                    </div>

                    {/* 오른쪽 — 정보 */}
                    <div className={styles.charInfo}>
                      <div className={styles.charNameRow}>
                        <h2 className={styles.charName}>{char.name}</h2>
                        {char.requires_premium
                          ? <span className="badge badge-gold">{t("premiumBadge")}</span>
                          : <span className="badge badge-mint">{t("freeBadge")}</span>}
                      </div>
                      <p className={styles.charDesc}>{char.description}</p>
                      <p className={styles.charDescEn}>{char.description_en}</p>

                      {/* 태그 */}
                      <div className={styles.charTags}>
                        {char.tags.map((tag) => (
                          <span key={tag} className="badge badge-muted">{tag}</span>
                        ))}
                      </div>

                      {/* 호감도 */}
                      {canAccess && (
                        <div className={styles.affinityRow}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} style={{ fontSize: 13 }}>
                              {i < affinityStars ? "❤️" : "🤍"}
                            </span>
                          ))}
                          <span className={styles.affinityNum}>{affinity}/100</span>
                        </div>
                      )}

                      {/* 액션 버튼 */}
                      {canAccess ? (
                        <div className={styles.charActions}>
                          <Link
                            href={`/chat/${char.id}`}
                            className="btn btn-primary btn-sm"
                            id={`btn-chat-${char.id}`}
                          >
                            {t("chatBtn")}
                          </Link>
                          <Link
                            href={`/learn/${char.id}`}
                            className="btn btn-blue btn-sm"
                            id={`btn-learn-${char.id}`}
                          >
                            {t("studyBtn")}
                          </Link>
                          <Link
                            href={`/diary/${char.id}`}
                            className="btn btn-secondary btn-sm"
                            id={`btn-diary-${char.id}`}
                          >
                            {t("diaryBtn")}
                          </Link>
                        </div>
                      ) : (
                        <button disabled className="btn btn-secondary btn-sm" id={`btn-unlock-${char.id}`} style={{ opacity: 0.6, cursor: "not-allowed" }}>
                          {t("premiumLockedBtn")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 장소 미리보기 */}
          <section>
            <p className={styles.sectionTitle}>
              {t("regionHighlights")}
            </p>
            <div className={styles.placeGrid}>
              {highlights.map((place) => (
                <div key={place.id} className={styles.placeChip}>
                  <span className={styles.placeEmoji}>{place.emoji}</span>
                  <span className={styles.placeName}>{place.name}</span>
                  <span className={styles.placeNameEn}>{place.en}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
