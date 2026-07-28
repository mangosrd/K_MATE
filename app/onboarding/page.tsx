"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage, Language } from "@/components/LanguageContext";
import styles from "./onboarding.module.css";

const LANGUAGES: { code: Language; flag: string; name: string }[] = [
  { code: "ko", flag: "🇰🇷", name: "한국어" },
  { code: "en", flag: "🇺🇸", name: "English" },
  { code: "ja", flag: "🇯🇵", name: "日本語" },
  { code: "zh", flag: "🇨🇳", name: "中文（简体）" },
  { code: "zh-TW", flag: "🇹🇼", name: "繁體中文" },
  { code: "th", flag: "🇹🇭", name: "ภาษาไทย" },
  { code: "ru", flag: "🇷🇺", name: "Русский" },
];

const CHARACTERS = [
  {
    id: "kyuhyun",
    name: "규현",
    emoji: "✈️",
    location: "서울·경기",
    role: "항공 기장",
    personality: "친절한",
    description: "서울·경기 노선 담당 기장. 경복궁과 한강이 발 아래 펼쳐집니다.",
    requires_premium: false,
  },
  {
    id: "haneul",
    name: "하늘",
    emoji: "🛫",
    location: "전주·전라",
    role: "항공 기장",
    personality: "따뜻한",
    description: "전주·전라 노선 담당 기장. 한옥마을 기와지붕이 하늘에서 내려다보입니다.",
    requires_premium: false,
  },
  {
    id: "sunwoo",
    name: "선우",
    emoji: "⚓",
    location: "부산·경남",
    role: "항공 기장",
    personality: "유쾌한",
    description: "부산·경남 노선 담당 기장. 해운대 해변과 광안대교가 눈앞에 펼쳐집니다.",
    requires_premium: true,
  },
  {
    id: "sangwoo",
    name: "상우",
    emoji: "🏛️",
    location: "충청·공주",
    role: "항공 기장",
    personality: "침착한",
    description: "충청·공주 노선 담당 기장. 백제의 역사가 흐르는 금강이 아래로 흐릅니다.",
    requires_premium: true,
  },
  {
    id: "yongwoo",
    name: "용우",
    emoji: "🌋",
    location: "제주",
    role: "항공 기장",
    personality: "낭만적",
    description: "제주 노선 담당 기장. 한라산 백록담이 구름 위로 솟아오릅니다.",
    requires_premium: true,
  },
];

const TUTORIAL_STEPS = [
  { icon: "🗺️", title: "Explore Regions", desc: "Pick a region on the map and discover iconic Korean places." },
  { icon: "💬", title: "Chat with Your Mate", desc: "Have natural Korean conversations and pick up the language as you go." },
  { icon: "📖", title: "Build Your Vocab", desc: "Tap any word to save it. Review later to master it." },
  { icon: "📔", title: "Unlock Diaries", desc: "Your mate writes 100-character Korean diary entries. Earn coins to unlock them." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const [step, setStep] = useState(0); // 0: 언어, 1: 메이트, 2: 튜토리얼
  const [selectedChar, setSelectedChar] = useState("kyuhyun");

  const handleFinish = () => {
    // 선택한 메이트를 저장해두고, 메인 여행(지도) 화면으로 이동
    if (typeof window !== "undefined") {
      localStorage.setItem("kmate_preferred_captain", selectedChar);
    }
    router.push("/map");
  };

  return (
    <main className={styles.page}>
      {/* 진행 표시 */}
      <div className={styles.progressDots} role="progressbar" aria-valuenow={step + 1} aria-valuemax={3}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${styles.dot} ${i <= step ? styles.dotActive : ""}`} />
        ))}
      </div>

      {/* 단계 1: 언어 선택 */}
      {step === 0 && (
        <section className={styles.section}>
          <div className={styles.stepHeader}>
            <p className={styles.stepNum}>Step 1 / 3</p>
            <h1 className={styles.stepTitle}>What&apos;s your native language?</h1>
            <p className={styles.stepSub}>The app UI and your mate&apos;s replies will follow this language.</p>
          </div>
          <div className={styles.langGrid}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                id={`lang-${lang.code}`}
                className={`${styles.langItem} ${language === lang.code ? styles.langSelected : ""}`}
                onClick={() => setLanguage(lang.code)}
                aria-pressed={language === lang.code}
              >
                <span className={styles.langFlag}>{lang.flag}</span>
                <span className={styles.langName}>{lang.name}</span>
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => setStep(1)} id="btn-lang-next">
            Next — Choose Your Mate →
          </button>
        </section>
      )}

      {/* 단계 2: 메이트 선택 */}
      {step === 1 && (
        <section className={styles.section}>
          <div className={styles.stepHeader}>
            <p className={styles.stepNum}>Step 2 / 3</p>
            <h1 className={styles.stepTitle}>Choose your K-MATE</h1>
          </div>

          {/* 선택된 캐릭터 미리보기 */}
          {(() => {
            const char = CHARACTERS.find((c) => c.id === selectedChar)!;
            return (
              <div className={styles.charPreview}>
                <div className={styles.charAvatarLg}>{char.emoji}</div>
                <div>
                  <p className={styles.charPreviewName}>{char.name}</p>
                  <p className={styles.charPreviewDesc}>{char.description}</p>
                  <div className={styles.charTags}>
                    <span className="badge badge-primary">{char.location}</span>
                    <span className="badge badge-muted">{char.role}</span>
                    <span className="badge badge-muted">{char.personality}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 캐릭터 리스트 */}
          <div className={styles.charGrid}>
            {CHARACTERS.map((char) => {
              // 개발자 테스트 모드 — 프리미엄 잠금 무시 (.env.local의 NEXT_PUBLIC_DEV_MODE)
              const isLocked = char.requires_premium && process.env.NEXT_PUBLIC_DEV_MODE !== "true";
              return (
                <button
                  key={char.id}
                  id={`char-${char.id}`}
                  className={`${styles.charCard} ${selectedChar === char.id ? styles.charSelected : ""} ${isLocked ? styles.charLocked : ""}`}
                  onClick={() => !isLocked && setSelectedChar(char.id)}
                  disabled={isLocked}
                  aria-disabled={isLocked}
                >
                  <span className={styles.charEmoji}>{char.emoji}</span>
                  <span className={styles.charName}>{char.name}</span>
                  <span className={styles.charLoc}>{isLocked ? "🔒 프리미엄" : char.location}</span>
                  {selectedChar === char.id && <span className={styles.charCheck}>✓</span>}
                </button>
              );
            })}
          </div>

          <div className={styles.navRow}>
            <button className="btn btn-secondary" onClick={() => setStep(0)}>← Back</button>
            <button className="btn btn-secondary" onClick={() => setStep(2)} id="btn-char-next">
              Next →
            </button>
          </div>
        </section>
      )}

      {/* 단계 3: 튜토리얼 */}
      {step === 2 && (
        <section className={styles.section}>
          <div className={styles.stepHeader}>
            <p className={styles.stepNum}>Step 3 / 3</p>
            <h1 className={styles.stepTitle}>Almost there! 🎉</h1>
            <p className={styles.stepSub}>Here&apos;s how K-MATE works:</p>
          </div>
          <div className={styles.tutorialList}>
            {TUTORIAL_STEPS.map((t, i) => (
              <div key={i} className={styles.tutorialItem}>
                <div className={styles.tutorialIcon}>{t.icon}</div>
                <div>
                  <p className={styles.tutorialTitle}>{t.title}</p>
                  <p className={styles.tutorialDesc}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.navRow}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" onClick={handleFinish} id="btn-start">
              🗺️ Start Exploring
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
