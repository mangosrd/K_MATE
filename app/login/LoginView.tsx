"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";
import styles from "./login.module.css";

export default function LoginView() {
  const { t } = useLanguage();
  return (
    <main className={styles.page}>
      {/* 상단 그라디언트 배경 */}
      <div className={styles.bgTop} aria-hidden="true" />
      <div className={styles.bgPattern} aria-hidden="true" />

      {/* 로고 & 슬로건 */}
      <section className={styles.hero}>
        <div className={styles.logoWrap}>
          <span className={styles.logoIcon}>✈️</span>
          <h1 className={styles.logoText}>K-MATE</h1>
        </div>
        <p className={styles.tagline}>Travel Korea with your AI mate</p>
        <p className={styles.taglineKo}>AI 메이트와 함께 한국을 여행하세요</p>
      </section>

      {/* 캐릭터 미리보기 */}
      <div className={styles.characterRow} aria-hidden="true">
        {[
          { emoji: "✈️", name: "규현" },
          { emoji: "🛫", name: "하늘" },
          { emoji: "⚓", name: "선우" },
          { emoji: "🏛️", name: "상우" },
          { emoji: "🌋", name: "용우" },
        ].map((c) => (
          <div key={c.name} className={styles.characterChip}>
            <span className={styles.characterEmoji}>{c.emoji}</span>
            <span className={styles.characterName}>{c.name}</span>
          </div>
        ))}
      </div>

      {/* 하단 로그인 카드 */}
      <div className={styles.bottomCard}>
        <p className={styles.cardTitle}>{t("startHere")}</p>
        <p className={styles.cardTitleKo}>{t("continueWithAccount")}</p>

        <Link href="/onboarding" className="btn btn-primary btn-lg" id="btn-email-login">
          {t("startWithEmail")}
        </Link>

        <div className={styles.dividerOr}>{t("orDivider")}</div>

        <button className="btn btn-secondary btn-lg" id="btn-google-login">
          <GoogleIcon />
          {t("continueGoogle")}
        </button>
        <button className="btn btn-secondary btn-lg" id="btn-apple-login">
          {t("continueApple")}
        </button>

        <p className={styles.signupHint}>
          {t("noAccountYet")}{" "}
          <Link href="/onboarding" className={styles.signupLink}>
            {t("signUp")}
          </Link>
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
