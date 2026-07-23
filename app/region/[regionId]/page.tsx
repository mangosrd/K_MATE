import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";
import {
  getRegionById, getCharactersForRegion, MOCK_USER, MOCK_ALL_PROGRESS,
  canAccessCharacter,
} from "@/lib/db/mock";
import styles from "./region.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ regionId: string }>;
}): Promise<Metadata> {
  const { regionId } = await params;
  const region = getRegionById(regionId);
  return {
    title: `${region?.name ?? regionId} — K-MATE`,
    description: region?.description_en,
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ regionId: string }>;
}) {
  const { regionId } = await params;
  const region = getRegionById(regionId);
  if (!region || region.is_locked) notFound();

  const characters = getCharactersForRegion(regionId);
  const isPremium = MOCK_USER.membership === "premium";

  const regionEmoji: Record<string, string> = {
    seoul: "🏯", jeonju: "🏮", busan: "⚓", chungcheong: "🏛️", jeju: "🌋",
  };

  return (
    <>
      <div className="page-content">
        {/* 헤더 (여권 표지 스타일) */}
        <div className={styles.passportCover}>
          <Link href="/map" className={styles.backBtn} aria-label="지도로 돌아가기">‹</Link>

          {/* 여권 스탬프 무늬 */}
          <div className={styles.passportBg} aria-hidden="true" />

          <div className={styles.passportHeader}>
            <div className={styles.passportEmblem}>
              <span className={styles.passportEmoji}>{regionEmoji[region.id]}</span>
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
              메이트 선택 <span className={styles.sectionSub}>· Choose your mate</span>
            </p>

            <div className={styles.characterList}>
              {characters.map((char) => {
                const canAccess = canAccessCharacter(char.id, MOCK_USER.membership, MOCK_USER.free_character_slots);
                const progress = MOCK_ALL_PROGRESS[char.id];
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
                          ? <span className="badge badge-gold">⭐ 프리미엄</span>
                          : <span className="badge badge-mint">✓ 무료</span>}
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
                            💬 대화하기
                          </Link>
                          <Link
                            href={`/learn/${char.id}`}
                            className="btn btn-blue btn-sm"
                            id={`btn-learn-${char.id}`}
                          >
                            📖 공부하기
                          </Link>
                          <Link
                            href={`/diary/${char.id}`}
                            className="btn btn-secondary btn-sm"
                            id={`btn-diary-${char.id}`}
                          >
                            📔 일기
                          </Link>
                        </div>
                      ) : (
                        <button disabled className="btn btn-secondary btn-sm" id={`btn-unlock-${char.id}`} style={{ opacity: 0.6, cursor: "not-allowed" }}>
                          🔒 프리미엄 전용 (잠금)
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
              이 지역 명소 <span className={styles.sectionSub}>· Highlights</span>
            </p>
            <div className={styles.placeGrid}>
              {[
                { id: "p1", name: region.id === "seoul" ? "경복궁" : region.id === "jeonju" ? "한옥마을" : "명소 1", en: region.id === "seoul" ? "Gyeongbokgung" : "Hanok Village", emoji: region.id === "seoul" ? "🏯" : "🏘️" },
                { id: "p2", name: region.id === "seoul" ? "홍대" : region.id === "jeonju" ? "비빔밥 거리" : "명소 2", en: region.id === "seoul" ? "Hongdae" : "Bibimbap Street", emoji: "🌆" },
                { id: "p3", name: region.id === "seoul" ? "남산타워" : region.id === "jeonju" ? "경기전" : "명소 3", en: region.id === "seoul" ? "Namsan Tower" : "Gyeonggijeon", emoji: "🗼" },
              ].map((place) => (
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
