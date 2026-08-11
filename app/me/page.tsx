"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { MOCK_CHARACTERS, getChaptersForCharacter, getRegionById } from "@/lib/db/mock";
import { getLocalVocab } from "@/lib/vocab/store";
import { getAllLocalDiaries } from "@/lib/diary/store";
import {
  getEffectiveUserId,
  getAuthHeaders,
  logoutFromServer,
  getPreferredCaptainId,
  setPreferredCaptainId,
} from "@/lib/auth/store";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { useLanguage } from "@/components/LanguageContext";
import LanguageModal from "@/components/LanguageModal";
import ThemeModal from "@/components/ThemeModal";
import WithdrawModal from "@/components/WithdrawModal";
import MateSelectModal from "@/components/MateSelectModal";
import type { Progress } from "@/types/database";
import ProfileCard from "./components/ProfileCard";
import PremiumCard from "./components/PremiumCard";
import CaptainCard from "./components/CaptainCard";
import StatisticsGrid from "./components/StatisticsGrid";
import SettingsSection from "./components/SettingsSection";
import SettingItem from "./components/SettingItem";
import styles from "./me.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const APP_VERSION = "1.0.0";
const subscribeToHydration = () => () => {};

export default function MePage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [showLangModal, setShowLangModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showMateModal, setShowMateModal] = useState(false);

  const { authUser } = useAuthUser();
  const [serverDisplayName, setServerDisplayName] = useState("");
  const displayName = authUser?.name || serverDisplayName || "Traveler";
  // 예전엔 레벨 시스템이 백엔드에 없어서 목업(MOCK_USER.level, 항상 1)을 그대로
  // 보여줬는데, 이제 실제로 챕터 진도에 비례해서 오르는 백엔드 값을 쓴다.
  const [displayLevel, setDisplayLevel] = useState(1);

  const [coins, setCoins] = useState(0);
  const [progress, setProgress] = useState<Progress>({
    id: "",
    user_id: "",
    character_id: "kyuhyun",
    affinity: 0,
    stamps: [],
    current_step: 0,
    visited_places: [],
    streak_days: 0,
    last_active_at: "",
  });
  const [membership, setMembership] = useState("free");
  const [freeSlots, setFreeSlots] = useState<string[]>([]);

  // getLocalVocab/getAllLocalDiaries는 localStorage를 직접 읽는데, 서버는 항상 빈
  // 배열을 볼 수밖에 없어 렌더 본문에서 바로 부르면 하이드레이션 결과가 서버(0)와
  // 클라이언트(실제 값)에서 서로 달라 에러가 난다. 마운트 후에만(클라이언트에서만) 채운다.
  const clientReady = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const vocab = clientReady ? getLocalVocab() : [];
  const diaries = clientReady ? getAllLocalDiaries() : [];
  const vocabCount = vocab.length;
  const masteredCount = vocab.filter((item) => item.mastery === "mastered").length;
  const unlockedDiaries = diaries.filter((diary) => diary.unlocked).length;

  // 메이트 카드에 표시할 기장 — 사용자가 마이페이지에서 바꾼 선호값(localStorage)을 따른다.
  // 서버에서 내려주는 값이 없으니 마운트 이후에만 실제 값으로 갱신해 하이드레이션 불일치를 피한다.
  const mateId = clientReady ? getPreferredCaptainId() : "kyuhyun";
  const mate = MOCK_CHARACTERS.find((c) => c.id === mateId) ?? MOCK_CHARACTERS[0];

  useEffect(() => {
    const userId = getEffectiveUserId();

    fetch(`${BACKEND_URL}/user/${userId}`, { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (typeof data.name === "string") setServerDisplayName(data.name);
        setCoins(data.coins);
        if (data.membership) setMembership(data.membership);
        if (Array.isArray(data.free_char_slots)) setFreeSlots(data.free_char_slots);
        if (typeof data.level === "number") setDisplayLevel(data.level);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const userId = getEffectiveUserId();
    fetch(`${BACKEND_URL}/progress/${userId}/${mateId}`, { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setProgress(data); })
      .catch(() => {});
  }, [mateId]);

  // "방문 장소" — 예전엔 지역 페이지에 들어가기만 하면 명소 전체가 즉시 방문한 걸로
  // 기록돼서 의미 없는 숫자였다(app/region/[regionId]/RegionView.tsx에서 제거함).
  // 대신 이 메이트의 실제 지역 챕터(ch-*) 완료 비율에 비례해서 계산한다.
  const mateRegion = getRegionById(mate.region_id);
  const mateRegionChapters = getChaptersForCharacter(mate.id).filter((ch) => ch.id.startsWith("ch-"));
  const mateCompletedCount = (progress.stamps ?? [])
    .filter((id) => mateRegionChapters.some((ch) => ch.id === id)).length;
  const visitedPlacesCount = mateRegion && mateRegionChapters.length > 0
    ? Math.round((mateCompletedCount / mateRegionChapters.length) * mateRegion.place_count)
    : 0;

  const handleSelectMate = (characterId: string) => {
    setPreferredCaptainId(characterId);
  };

  const handleLogout = async () => {
    await logoutFromServer();
    router.replace("/login");
  };

  const getLangName = (lang: string) => {
    switch (lang) {
      case "en": return "English";
      case "ru": return "Русский";
      case "zh": return "中文";
      case "ja": return "日本語";
      case "zh-TW": return "繁體中文";
      case "th": return "ภาษาไทย";
      default:   return "한국어";
    }
  };

  return (
    <>
      <div className="page-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">{t("myPage")}</h1>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
              {language === "ko" ? "My Page" : t("myPage")}
            </p>
          </div>
        </header>

        <div className={styles.inner}>
          <ProfileCard
            displayName={displayName}
            levelLabel={`${t("beginnerLearner")} · Lv.${displayLevel}`}
            coins={coins}
            coinLabel={t("coins")}
          />

          <PremiumCard
            isPremium={membership === "premium"}
            titleText={membership === "premium" ? t("premiumActiveTitle") : t("premiumUpgradeTitle")}
            subText={
              membership === "premium"
                ? t("premiumActiveSub")
                : t("premiumUpgradeSub")
            }
            ctaText={membership === "premium" ? t("manageArrow") : t("viewArrow")}
          />

          <CaptainCard
            mate={mate}
            progress={progress}
            titleText={t("mateRouteTitle", { name: mate.name })}
            taglineText={t(`mateTagline_${mate.id}`)}
            changeLabel={t("changeMate")}
            onChangeClick={() => setShowMateModal(true)}
          />

          <Link href="/notes" className={styles.noteFeatureCard} id="btn-captain-notes">
            <span className={styles.noteFeatureIcon}>📝</span>
            <span className={styles.noteFeatureCopy}>
              <strong>{language === "ko" ? "기장 메모장" : language === "ja" ? "機長メモ" : language === "zh" ? "机长留言簿" : language === "zh-TW" ? "機長留言簿" : language === "ru" ? "Записки капитану" : language === "th" ? "สมุดโน้ตกัปตัน" : "Captain Notes"}</strong>
              <small>{language === "ko" ? "마음을 남기면 다섯 기장 중 누군가 답해요" : language === "ja" ? "想いを残すと、5人の機長の誰かが返信します" : language === "zh" ? "留下心情，五位机长中的一位会回复" : language === "zh-TW" ? "留下心情，五位機長中的一位會回覆" : language === "ru" ? "Оставьте заметку — один из пяти капитанов ответит" : language === "th" ? "ฝากข้อความไว้ แล้วหนึ่งในห้ากัปตันจะมาตอบ" : "Leave a note and one of five captains will reply"}</small>
            </span>
            <span className={styles.noteFeatureArrow}>›</span>
          </Link>

          <StatisticsGrid
            title={t("learningStats")}
            stats={[
              { icon: "📖", num: vocabCount, label: t("learnedWords") },
              { icon: "✅", num: masteredCount, label: t("mastered") },
              { icon: "🗺️", num: visitedPlacesCount, label: t("visitedPlaces") },
              { icon: "📔", num: unlockedDiaries, label: t("diaries") },
            ]}
          />

          <SettingsSection title={t("settingsAccount")}>
            <SettingItem icon="👤" label={t("editProfile")} href="/me/edit-profile" id="btn-edit-profile" />
            <SettingItem icon="🔒" label={t("securitySettings")} href="/me/security" id="btn-security" />
          </SettingsSection>

          <SettingsSection title={t("settingsGeneral")}>
            <SettingItem
              icon="🔤"
              label={t("langSettings")}
              value={getLangName(language)}
              onClick={() => setShowLangModal(true)}
              id="btn-language-setting"
            />
            <SettingItem icon="🔔" label={t("notificationSettings")} href="/me/notifications" id="btn-notifications" />
            <SettingItem icon="🎨" label={t("themeSettings")} onClick={() => setShowThemeModal(true)} id="btn-theme-setting" />
            <SettingItem icon="🌐" label={language === "ko" ? "시간대 설정" : language === "ja" ? "タイムゾーン" : language === "zh" ? "时区设置" : language === "zh-TW" ? "時區設定" : language === "ru" ? "Часовой пояс" : language === "th" ? "เขตเวลา" : "Time zone"} href="/me/timezone" id="btn-timezone-setting" />
          </SettingsSection>

          <SettingsSection title={t("settingsLegal")}>
            <SettingItem icon="📄" label={t("termsOfService")} href="/legal/terms" isExternal id="btn-terms" />
            <SettingItem icon="🛡️" label={t("privacyPolicy")} href="/legal/privacy" isExternal id="btn-privacy" />
            <SettingItem icon="🎧" label={t("customerSupport")} href="/support" isExternal id="btn-support" />
            <SettingItem icon="ℹ️" label={t("appVersion")} value={`v${APP_VERSION}`} />
          </SettingsSection>

          <SettingsSection title={t("settingsOther")}>
            <SettingItem icon="🚪" label={t("logout")} onClick={handleLogout} id="btn-logout" />
            {authUser && (
              <SettingItem
                icon="🗑️"
                label={t("withdrawAccount")}
                isDanger
                onClick={() => setShowWithdrawModal(true)}
                id="btn-withdraw-account"
              />
            )}
          </SettingsSection>
        </div>
      </div>

      <BottomNav />

      {/* 🌐 언어 선택 모달 */}
      <LanguageModal isOpen={showLangModal} onClose={() => setShowLangModal(false)} />

      {/* 🎨 테마 선택 모달 */}
      <ThemeModal isOpen={showThemeModal} onClose={() => setShowThemeModal(false)} />

      {/* ⚠️ 회원 탈퇴 모달 */}
      <WithdrawModal isOpen={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} />

      {/* ✈️ 메이트(기장) 선택 모달 — 유료 기장(용우/선우/상우)은 프리미엄 결제 전엔 선택 불가 */}
      <MateSelectModal
        isOpen={showMateModal}
        onClose={() => setShowMateModal(false)}
        currentMateId={mateId}
        membership={membership}
        freeSlots={freeSlots}
        onSelect={handleSelectMate}
      />

      {/* 📺 광고 보상 모달 */}
    </>
  );
}
