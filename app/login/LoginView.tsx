"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageContext";
import { setCurrentUser } from "@/lib/auth/store";
import LoadingSplash from "@/components/LoadingSplash";
import styles from "./login.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type Mode = "start" | "login" | "signup";

const LOGIN_CAPTAINS = [
  { id: "kyuhyun", name: "규현" },
  { id: "haneul", name: "하늘" },
  { id: "sunwoo", name: "선우" },
  { id: "sangwoo", name: "상우" },
  { id: "yongwoo", name: "용우" },
];

export default function LoginView() {
  const { t } = useLanguage();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("start");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
  };

  const switchMode = (next: Mode) => {
    resetForm();
    setMode(next);
  };

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password.trim() || (mode === "signup" && !name.trim())) {
      setError("모든 항목을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === "signup" ? "/auth/register" : "/auth/login";
      const body =
        mode === "signup"
          ? { email: email.trim(), password, name: name.trim() }
          : { email: email.trim(), password };

      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "요청에 실패했습니다.");
        setLoading(false);
        return;
      }

      setCurrentUser(data);
      // 성공 시엔 로딩 상태를 그대로 유지한다 — router.push로 페이지가 전환될 때까지
      // 스플래시 화면이 계속 보이도록(false로 되돌리면 전환 직전 폼 화면이 다시 잠깐 보임)
      router.push(mode === "signup" ? "/onboarding" : "/map");
    } catch {
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSplash message={t("loadingTakeoff")} />;
  }

  return (
    <main className={`${styles.page} ${mode !== "start" ? styles.authPage : ""}`}>
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
      {mode === "start" && (
        <div className={styles.characterRow} aria-hidden="true">
          <div className={styles.characterTrack}>
            {[...LOGIN_CAPTAINS, ...LOGIN_CAPTAINS].map((c, index) => (
              <div key={`${c.id}-${index}`} className={styles.characterChip}>
                <span className={styles.characterEmoji}>
                  <Image src={`/characters/${c.id}.png`} alt="" width={48} height={48} className={styles.characterEmojiImg} />
                </span>
                <span className={styles.characterName}>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 하단 카드 */}
      <div className={styles.bottomCard}>
        {mode === "start" && (
          <>
            <p className={styles.cardTitle}>{t("startHere")}</p>
            <p className={styles.cardTitleKo}>{t("continueWithAccount")}</p>

            <button className="btn btn-primary btn-lg" id="btn-email-signup" onClick={() => switchMode("signup")}>
              {t("startWithEmail")}
            </button>

            <div className={styles.dividerOr}>{t("orDivider")}</div>

            <button className="btn btn-secondary btn-lg" id="btn-google-login">
              <GoogleIcon />
              {t("continueGoogle")}
            </button>

            <p className={styles.signupHint}>
              이미 계정이 있으신가요?{" "}
              <button type="button" className={styles.signupLink} onClick={() => switchMode("login")} id="btn-go-login">
                로그인
              </button>
            </p>
          </>
        )}

        {(mode === "login" || mode === "signup") && (
          <>
            <p className={styles.cardTitle}>{mode === "signup" ? "이메일로 회원가입" : "이메일로 로그인"}</p>

            <div className={styles.formFields}>
              {mode === "signup" && (
                <input
                  className={styles.formInput}
                  placeholder="이름"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  id="input-signup-name"
                  autoComplete="name"
                />
              )}
              <input
                className={styles.formInput}
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                id="input-auth-email"
                autoComplete="email"
              />
              <input
                className={styles.formInput}
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                id="input-auth-password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>

            {error && (
              <p className={styles.formError} role="alert" id="auth-error">
                {error}
              </p>
            )}

            <button
              className="btn btn-primary btn-lg"
              onClick={submit}
              id="btn-auth-submit"
            >
              {mode === "signup" ? "회원가입" : "로그인"}
            </button>

            <p className={styles.signupHint}>
              {mode === "signup" ? (
                <>
                  이미 계정이 있으신가요?{" "}
                  <button type="button" className={styles.signupLink} onClick={() => switchMode("login")} id="btn-switch-login">
                    로그인
                  </button>
                </>
              ) : (
                <>
                  {t("noAccountYet")}{" "}
                  <button type="button" className={styles.signupLink} onClick={() => switchMode("signup")} id="btn-switch-signup">
                    {t("signUp")}
                  </button>
                </>
              )}
            </p>
            <button type="button" className={styles.backLink} onClick={() => switchMode("start")} id="btn-auth-back">
              ← 뒤로
            </button>
          </>
        )}
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
