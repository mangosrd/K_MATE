"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";
import { getPreferredCaptainId } from "@/lib/auth/store";

// ── K-MATE 커스텀 SVG 아이콘 ───────────────────────────────────────────────
// 브랜드 컬러 (--red: #CD2E3A, --blue: #003478)에 맞춰
// 비활성: #94a3b8 (slate-400), 활성: currentColor (CSS .active로 제어)

function IconMap({ active }: { active: boolean }) {
  const c = active ? "#CD2E3A" : "#94a3b8";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 비행기 루트 지도 */}
      <path d="M3 18L9 6l4 4 5-5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="6" r="1.5" fill={c}/>
      <circle cx="18" cy="5" r="1.5" fill={c}/>
      <path d="M5 20h14" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M14.5 12l2.5-1.5 1 2.5-3.5 2v-3z" fill={c} opacity="0.85"/>
    </svg>
  );
}

function IconLearn({ active }: { active: boolean }) {
  const c = active ? "#CD2E3A" : "#94a3b8";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 펼쳐진 책 + 한글 가 */}
      <path d="M4 19V7a1 1 0 011-1h5.5a2 2 0 012 2v11" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M20 19V7a1 1 0 00-1-1h-5.5a2 2 0 00-2 2v11" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M4 19h16" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      {/* 가운데 페이지 선 */}
      <path d="M12.5 9.5L11.5 9.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M7 11h3M7 13.5h3" stroke={c} strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
      <path d="M14 11h3M14 13.5h3" stroke={c} strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
}

function IconChat({ active }: { active: boolean }) {
  const c = active ? "#CD2E3A" : "#94a3b8";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 말풍선 두 개 (대화 느낌) */}
      <path d="M20 8.5C20 5.46 17.54 3 14.5 3h-5C6.46 3 4 5.46 4 8.5c0 2.7 1.88 4.96 4.42 5.4L7 17l4.5-2.6c.17.01.33.1.5.1 3.04 0 5.5-2.46 5.5-5.5L20 8.5z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M17 13.5c1.5.4 2.7 1.6 2.7 3.1C19.7 18.4 18.4 20 16.8 20L15 21.5 14 19.5c-1.9-.4-3.5-1.8-3.5-3.5" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
      <circle cx="8.5" cy="8.5" r="1" fill={c}/>
      <circle cx="12" cy="8.5" r="1" fill={c}/>
      <circle cx="15.5" cy="8.5" r="1" fill={c}/>
    </svg>
  );
}

function IconVocab({ active }: { active: boolean }) {
  const c = active ? "#CD2E3A" : "#94a3b8";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 단어카드 + 한글 자모 */}
      <rect x="3" y="5" width="13" height="16" rx="2" stroke={c} strokeWidth="1.8"/>
      <rect x="7" y="3" width="13" height="16" rx="2" stroke={c} strokeWidth="1.8" fill="white"/>
      {/* 가 자모 느낌의 선 */}
      <path d="M11 8h4" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M13 8v4" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M10 12h6" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M10 15h6" stroke={c} strokeWidth="1.3" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

function IconMe({ active }: { active: boolean }) {
  const c = active ? "#CD2E3A" : "#94a3b8";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 사람 실루엣 */}
      <circle cx="12" cy="7.5" r="3.5" stroke={c} strokeWidth="1.8"/>
      <path d="M4.5 20.5c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

const NAV_ICONS: Record<string, (props: { active: boolean }) => React.ReactElement> = {
  map:   IconMap,
  learn: IconLearn,
  chat:  IconChat,
  vocab: IconVocab,
  me:    IconMe,
};

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  // 선호 기장 ID를 localStorage에서 읽어 학습 탭 목적지로 사용 (SSR safe)
  const [learnHref, setLearnHref] = useState("/learn/kyuhyun");
  useEffect(() => {
    setLearnHref(`/learn/${getPreferredCaptainId()}`);
  }, []);

  const navItems = [
    { href: "/map",      key: "map" },
    { href: learnHref,  key: "learn" },
    { href: "/chat",    key: "chat" },
    { href: "/vocab",   key: "vocab" },
    { href: "/me",      key: "me" },
  ];

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {navItems.map((item) => {
        const baseHref = item.href === "/learn/kyuhyun" ? "/learn" : item.href;
        const isActive = pathname.startsWith(baseHref);
        const Icon = NAV_ICONS[item.key];

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${isActive ? " active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="nav-icon" role="img" aria-hidden="true">
              <Icon active={isActive} />
            </span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>
              {t(item.key)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
