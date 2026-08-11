"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import BottomNav from "@/components/ui/BottomNav";
import {
  getCharactersForRegion, MOCK_ALL_PROGRESS,
  canAccessCharacter,
} from "@/lib/db/mock";
import { getAuthHeaders, getEffectiveUserId } from "@/lib/auth/store";
import { useMembership, useFreeCharSlots } from "@/lib/auth/useAuthUser";
import { useLanguage, type Language } from "@/components/LanguageContext";
import type { Region, Progress } from "@/types/database";
import styles from "./region.module.css";
import { getCaptainDisplayProfile } from "@/lib/captainProfiles";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface RegionHighlight {
  id: string;
  name: string;
  enKey: string;
  emoji: string;
}

const REGION_HIGHLIGHTS: Record<string, RegionHighlight[]> = {
  seoul: [
    { id: "p1", name: "경복궁", enKey: "placeGyeongbokgung", emoji: "🏯" },
    { id: "p2", name: "홍대", enKey: "placeHongdae", emoji: "🌆" },
    { id: "p3", name: "남산타워", enKey: "placeNamsanTower", emoji: "🗼" },
  ],
  jeonju: [
    { id: "p1", name: "한옥마을", enKey: "placeHanokVillage", emoji: "🏘️" },
    { id: "p2", name: "비빔밥 거리", enKey: "placeBibimbapStreet", emoji: "🍚" },
    { id: "p3", name: "경기전", enKey: "placeGyeonggijeon", emoji: "🏯" },
  ],
  busan: [
    { id: "p1", name: "해운대", enKey: "placeHaeundae", emoji: "🌊" },
    { id: "p2", name: "자갈치시장", enKey: "placeJagalchiMarket", emoji: "🐟" },
    { id: "p3", name: "광안대교", enKey: "placeGwanganBridge", emoji: "🌉" },
  ],
  chungcheong: [
    { id: "p1", name: "무령왕릉", enKey: "placeMuryeongTomb", emoji: "👑" },
    { id: "p2", name: "공산성", enKey: "placeGongsanseong", emoji: "🏯" },
    { id: "p3", name: "금강", enKey: "placeGeumgangRiver", emoji: "🌊" },
  ],
  jeju: [
    { id: "p1", name: "성산일출봉", enKey: "placeSeongsanIlchulbong", emoji: "🌅" },
    { id: "p2", name: "한라산", enKey: "placeHallasan", emoji: "🌋" },
    { id: "p3", name: "우도", enKey: "placeUdoIsland", emoji: "🏝️" },
  ],
};

const REGION_EMOJI: Record<string, string> = {
  seoul: "🏯", jeonju: "🏮", busan: "⚓", chungcheong: "🏛️", jeju: "🌋",
};

type LocalRegionCopy = { country: string; name: string; subtitle: string; description: string };
const REGION_COPY: Record<Language, Record<string, LocalRegionCopy>> = {
  ko: {
    seoul: { country: "대한민국", name: "서울·경기", subtitle: "서울과 경기도", description: "조선의 수도, 현대 한국의 심장" },
    jeonju: { country: "대한민국", name: "전주·전라", subtitle: "전주와 전라도", description: "한옥마을과 비빔밥의 고향" },
    busan: { country: "대한민국", name: "부산·경남", subtitle: "부산과 경상남도", description: "바다와 사람의 도시, 대한민국 제2의 도시" },
    chungcheong: { country: "대한민국", name: "충청·공주", subtitle: "충청과 공주", description: "백제의 숨결이 살아있는 역사의 땅" },
    jeju: { country: "대한민국", name: "제주", subtitle: "제주특별자치도", description: "화산섬의 신비로운 자연과 해녀 문화" },
  },
  en: {
    seoul: { country: "REPUBLIC OF KOREA", name: "Seoul & Gyeonggi", subtitle: "Seoul & Gyeonggi Route", description: "Capital of Korea, hub of modernity and tradition" },
    jeonju: { country: "REPUBLIC OF KOREA", name: "Jeonju & Jeolla", subtitle: "Jeonju & Jeolla Route", description: "Home of hanok villages and bibimbap" },
    busan: { country: "REPUBLIC OF KOREA", name: "Busan & Gyeongnam", subtitle: "Busan & Gyeongnam Route", description: "A vibrant port where sea and city meet" },
    chungcheong: { country: "REPUBLIC OF KOREA", name: "Chungcheong & Gongju", subtitle: "Chungcheong & Gongju Route", description: "A calm land where the spirit of Baekje remains" },
    jeju: { country: "REPUBLIC OF KOREA", name: "Jeju Island", subtitle: "Jeju Island Route", description: "An island shaped by volcanoes, wind, and the sea" },
  },
  ru: {
    seoul: { country: "РЕСПУБЛИКА КОРЕЯ", name: "Сеул и Кёнгидо", subtitle: "Маршрут Сеул и Кёнгидо", description: "Столица Чосона, сердце современной Кореи" },
    jeonju: { country: "РЕСПУБЛИКА КОРЕЯ", name: "Чонджу и Чолла", subtitle: "Маршрут Чонджу и Чолла", description: "Родина ханоков и пибимпаба" },
    busan: { country: "РЕСПУБЛИКА КОРЕЯ", name: "Пусан и Кёнсан-Намдо", subtitle: "Маршрут Пусан и Кёнсан-Намдо", description: "Живой портовый город, где встречаются море и город" },
    chungcheong: { country: "РЕСПУБЛИКА КОРЕЯ", name: "Чхунчхон и Кончжу", subtitle: "Маршрут Чхунчхон и Кончжу", description: "Тихая земля с дыханием древнего Пэкче" },
    jeju: { country: "РЕСПУБЛИКА КОРЕЯ", name: "Остров Чеджу", subtitle: "Маршрут острова Чеджу", description: "Остров вулканов, ветра и моря" },
  },
  zh: {
    seoul: { country: "大韩民国", name: "首尔·京畿", subtitle: "首尔·京畿路线", description: "朝鲜王朝的首都，现代韩国的心脏" },
    jeonju: { country: "大韩民国", name: "全州·全罗", subtitle: "全州·全罗路线", description: "韩屋村与拌饭的故乡" },
    busan: { country: "大韩民国", name: "釜山·庆南", subtitle: "釜山·庆南路线", description: "大海与城市相遇的活力港口" },
    chungcheong: { country: "大韩民国", name: "忠清·公州", subtitle: "忠清·公州路线", description: "留存百济气息的宁静历史之地" },
    jeju: { country: "大韩民国", name: "济州", subtitle: "济州岛路线", description: "由火山、海风与大海塑造的岛屿" },
  },
  ja: {
    seoul: { country: "大韓民国", name: "ソウル・京畿", subtitle: "ソウル・京畿路線", description: "朝鮮王朝の都、現代韓国の心臓" },
    jeonju: { country: "大韓民国", name: "全州・全羅", subtitle: "全州・全羅路線", description: "韓屋村とビビンバのふるさと" },
    busan: { country: "大韓民国", name: "釜山・慶南", subtitle: "釜山・慶南路線", description: "海と街が出会う活気ある港町" },
    chungcheong: { country: "大韓民国", name: "忠清・公州", subtitle: "忠清・公州路線", description: "百済の息吹が残る静かな歴史の地" },
    jeju: { country: "大韓民国", name: "済州", subtitle: "済州島路線", description: "火山と風、海が育んだ島" },
  },
  "zh-TW": {
    seoul: { country: "大韓民國", name: "首爾·京畿", subtitle: "首爾·京畿路線", description: "朝鮮王朝的首都，現代韓國的心臟" },
    jeonju: { country: "大韓民國", name: "全州·全羅", subtitle: "全州·全羅路線", description: "韓屋村與拌飯的故鄉" },
    busan: { country: "大韓民國", name: "釜山·慶南", subtitle: "釜山·慶南路線", description: "大海與城市相遇的活力港口" },
    chungcheong: { country: "大韓民國", name: "忠清·公州", subtitle: "忠清·公州路線", description: "留存百濟氣息的寧靜歷史之地" },
    jeju: { country: "大韓民國", name: "濟州", subtitle: "濟州島路線", description: "由火山、海風與大海塑造的島嶼" },
  },
  th: {
    seoul: { country: "สาธารณรัฐเกาหลี", name: "โซล·คย็องกี", subtitle: "เส้นทางโซล·คย็องกี", description: "เมืองหลวงของราชวงศ์โชซอน หัวใจของเกาหลีสมัยใหม่" },
    jeonju: { country: "สาธารณรัฐเกาหลี", name: "ช็อนจู·ช็อลลา", subtitle: "เส้นทางช็อนจู·ช็อลลา", description: "บ้านเกิดของหมู่บ้านฮันอกและบิบิมบับ" },
    busan: { country: "สาธารณรัฐเกาหลี", name: "ปูซาน·คย็องนัม", subtitle: "เส้นทางปูซาน·คย็องนัม", description: "เมืองท่าที่มีชีวิตชีวาซึ่งทะเลและเมืองมาบรรจบกัน" },
    chungcheong: { country: "สาธารณรัฐเกาหลี", name: "ชุงช็อง·คงจู", subtitle: "เส้นทางชุงช็อง·คงจู", description: "ดินแดนประวัติศาสตร์อันสงบที่ยังคงลมหายใจของแพ็กเจ" },
    jeju: { country: "สาธารณรัฐเกาหลี", name: "เกาะเชจู", subtitle: "เส้นทางเกาะเชจู", description: "เกาะที่หล่อหลอมด้วยภูเขาไฟ ลม และทะเล" },
  },
};

const CAPTAIN_PROFILE: Record<Language, Record<string, { age: string; personality: string }>> = {
  ko: { kyuhyun: { age: "34세", personality: "능글맞고 다정한 베테랑" }, haneul: { age: "연하", personality: "다정한 원칙주의자" }, sunwoo: { age: "동갑", personality: "장난기 많은 소꿉친구" }, sangwoo: { age: "성인", personality: "FM 관제 기장" }, yongwoo: { age: "성인", personality: "츤데레 보호자" } },
  en: { kyuhyun: { age: "34", personality: "Mature, playful veteran" }, haneul: { age: "Younger", personality: "Warm rule-keeper" }, sunwoo: { age: "Same age", personality: "Playful childhood friend" }, sangwoo: { age: "Adult", personality: "Precise air-traffic captain" }, yongwoo: { age: "Adult", personality: "Caring tsundere" } },
  ru: { kyuhyun: { age: "34", personality: "Зрелый и игривый ветеран" }, haneul: { age: "Младше", personality: "Тёплый приверженец правил" }, sunwoo: { age: "Ровесник", personality: "Игривый друг детства" }, sangwoo: { age: "Взрослый", personality: "Точный капитан-диспетчер" }, yongwoo: { age: "Взрослый", personality: "Заботливый цундере" } },
  zh: { kyuhyun: { age: "34岁", personality: "成熟又风趣的资深机长" }, haneul: { age: "年下", personality: "温柔的原则主义者" }, sunwoo: { age: "同龄", personality: "爱开玩笑的青梅竹马" }, sangwoo: { age: "成年", personality: "严谨的管制机长" }, yongwoo: { age: "成年", personality: "嘴硬心软的守护者" } },
  ja: { kyuhyun: { age: "34歳", personality: "大人の余裕があるベテラン" }, haneul: { age: "年下", personality: "優しいルール重視派" }, sunwoo: { age: "同い年", personality: "いたずら好きな幼なじみ" }, sangwoo: { age: "成人", personality: "きっちりした管制キャプテン" }, yongwoo: { age: "成人", personality: "世話焼きなツンデレ" } },
  "zh-TW": { kyuhyun: { age: "34歲", personality: "成熟又風趣的資深機長" }, haneul: { age: "年下", personality: "溫柔的原則主義者" }, sunwoo: { age: "同齡", personality: "愛開玩笑的青梅竹馬" }, sangwoo: { age: "成年", personality: "嚴謹的管制機長" }, yongwoo: { age: "成年", personality: "嘴硬心軟的守護者" } },
  th: { kyuhyun: { age: "34 ปี", personality: "กัปตันมากประสบการณ์ อารมณ์ดี" }, haneul: { age: "อายุน้อยกว่า", personality: "อบอุ่นและยึดหลักการ" }, sunwoo: { age: "วัยเดียวกัน", personality: "เพื่อนวัยเด็กขี้เล่น" }, sangwoo: { age: "ผู้ใหญ่", personality: "กัปตันควบคุมการบินที่เคร่งครัด" }, yongwoo: { age: "ผู้ใหญ่", personality: "ซึนเดเระผู้คอยดูแล" } },
};

export default function RegionView({ region }: { region: Region }) {
  const { t, language } = useLanguage();
  const { membership } = useMembership();
  const { freeSlots } = useFreeCharSlots();
  const characters = getCharactersForRegion(region.id);
  const regionCopy = REGION_COPY[language][region.id] ?? REGION_COPY.en[region.id];
  const highlights = REGION_HIGHLIGHTS[region.id] ?? [];
  const [allProgress, setAllProgress] = useState<Record<string, Progress>>(MOCK_ALL_PROGRESS);

  useEffect(() => {
    const userId = getEffectiveUserId();
    Promise.all(
      characters.map((c) =>
        fetch(`${BACKEND_URL}/progress/${userId}/${c.id}`, { headers: getAuthHeaders() })
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
      <div className="page-content" data-language={language}>
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
              <p className={styles.passportCountry}>{regionCopy.country}</p>
              <h1 className={styles.passportRegion}>{regionCopy.name}</h1>
              <p className={styles.passportRegionEn}>{regionCopy.subtitle}</p>
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
            <p className={styles.descKo}>{regionCopy.description}</p>
          </div>

          {/* 메이트 선택 */}
          <section>
            <p className={styles.sectionTitle}>
              {t("chooseMate")}
            </p>

            <div className={styles.characterList}>
              {characters.map((char) => {
                const displayProfile = getCaptainDisplayProfile(language, char.id);
                const profile = { age: "", personality: displayProfile.description };
                const canAccess = canAccessCharacter(char.id, membership, freeSlots);
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
                      <p className={styles.charDescription}>{profile.personality}</p>
                      <span className={styles.charRegion}>{regionCopy.name}</span>

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
                        <Link href="/premium" className="btn btn-secondary btn-sm" id={`btn-unlock-${char.id}`}>
                          {t("premiumLockedBtn")}
                        </Link>
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
                  <span className={styles.placeName}>{language === "ko" ? place.name : t(place.enKey)}</span>
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
