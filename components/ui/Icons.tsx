/**
 * K-MATE 공용 SVG 아이콘 라이브러리
 * - strokeWidth: 1.9~2 (모바일에서 선명하게)
 * - size prop으로 크기 조절 (기본 24)
 * - color prop으로 색상 조절 (기본 currentColor)
 */

import React from "react";

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

const d = (color?: string) => color ?? "currentColor";

/* ── 네비게이션 ──────────────────────────────────────────── */

/** 여행 / 지도 — 비행 루트 + 비행기 */
export function IconMap({ size = 24, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 17L9 7l3.5 3.5L18 5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="7" r="1.6" fill={c}/>
      <circle cx="18" cy="5" r="1.6" fill={c}/>
      <path d="M4 20h16" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.35"/>
      {/* 비행기 */}
      <path d="M15 11.5l2.8-1.6 1.2 3-4 2.1v-3.5z" fill={c} opacity="0.9"/>
    </svg>
  );
}

/** 학습 — 펼쳐진 책 */
export function IconLearn({ size = 24, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 19V8a1 1 0 011-1h5a2 2 0 012 2v10" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 19V8a1 1 0 00-1-1h-5a2 2 0 00-2 2v10" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <path d="M4 19h16" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <path d="M7 11.5h3M7 14h3" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M14 11.5h3M14 14h3" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

/** 대화 — 말풍선 */
export function IconChat({ size = 24, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 8c0-2.76-2.24-5-5-5H8C5.24 3 3 5.24 3 8c0 2.43 1.73 4.47 4.05 4.9L6 16l4-2.3c.33.06.66.1 1 .1 2.76 0 5-2.24 5-5z" stroke={c} strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="8.5" cy="8" r="1.1" fill={c}/>
      <circle cx="12" cy="8" r="1.1" fill={c}/>
      <circle cx="15.5" cy="8" r="1.1" fill={c}/>
      <path d="M16 12.5c1.8.5 3 2 3 3.7 0 1.6-1.1 3-2.7 3L14.5 20l-.9-1.7c-1.6-.5-2.8-2-2.8-3.6" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
    </svg>
  );
}

/** 단어장 — 카드 */
export function IconVocab({ size = 24, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="6" width="13" height="15" rx="2" stroke={c} strokeWidth="2"/>
      <rect x="7" y="3" width="13" height="15" rx="2" stroke={c} strokeWidth="2" fill="white"/>
      <path d="M12 7.5h4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M14 7.5v3.5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M11 11h6" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M11 13.5h6" stroke={c} strokeWidth="1.4" strokeLinecap="round" opacity="0.45"/>
    </svg>
  );
}

/** 나 / 프로필 — 사람 */
export function IconMe({ size = 24, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="7.5" r="3.8" stroke={c} strokeWidth="2"/>
      <path d="M4 21c0-4.42 3.58-8 8-8s8 3.58 8 8" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

/* ── 상태/액션 ──────────────────────────────────────────── */

/** 잠금 */
export function IconLock({ size = 16, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="3" y="7.5" width="10" height="7" rx="1.5" stroke={c} strokeWidth="1.5"/>
      <path d="M5.5 7.5V5a2.5 2.5 0 015 0v2.5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8" cy="11" r="1.2" fill={c}/>
    </svg>
  );
}

/** 잠금 해제 / 체크 */
export function IconUnlock({ size = 16, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3.5 8.5l3 3 6-6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/** 코인 */
export function IconCoin({ size = 16, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="6.5" stroke={c} strokeWidth="1.5"/>
      <circle cx="8" cy="8" r="4.5" stroke={c} strokeWidth="1" opacity="0.4"/>
      <path d="M8 4.5v1.5M8 10v1.5" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M6 6.5c0-.83.67-1.5 1.5-1.5h1c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5H8c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h1c.83 0 1.5-.67 1.5-1.5" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

/** 편지 */
export function IconLetter({ size = 16, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke={c} strokeWidth="1.5"/>
      <path d="M1.5 5l6.5 4.5L14.5 5" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

/** 앨범/사진 */
export function IconPhoto({ size = 16, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke={c} strokeWidth="1.5"/>
      <circle cx="5.5" cy="6" r="1.5" stroke={c} strokeWidth="1.3"/>
      <path d="M2 13l3.5-3.5 2.5 2.5 2-2 3 3" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/** 설정 — 슬라이더 */
export function IconSettings({ size = 18, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4 6h12M4 10h12M4 14h12" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <circle cx="7" cy="6" r="2" fill="white" stroke={c} strokeWidth="1.5"/>
      <circle cx="13" cy="10" r="2" fill="white" stroke={c} strokeWidth="1.5"/>
      <circle cx="7" cy="14" r="2" fill="white" stroke={c} strokeWidth="1.5"/>
    </svg>
  );
}

/** 사용자/프로필 편집 */
export function IconUser({ size = 18, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="6.5" r="3.2" stroke={c} strokeWidth="1.7"/>
      <path d="M3 18c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

/** 카드/결제 */
export function IconCard({ size = 18, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2" y="5" width="16" height="11" rx="2" stroke={c} strokeWidth="1.7"/>
      <path d="M2 8.5h16" stroke={c} strokeWidth="1.7"/>
      <path d="M5 12.5h4" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/** 보안/방패 */
export function IconShield({ size = 18, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 2L3.5 5v5.5C3.5 14.5 6.5 17.8 10 19c3.5-1.2 6.5-4.5 6.5-8.5V5L10 2z" stroke={c} strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M7 10l2 2 4-4" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/** 언어/지구 */
export function IconLanguage({ size = 18, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7.5" stroke={c} strokeWidth="1.7"/>
      <path d="M10 2.5c0 0-4 2.5-4 7.5s4 7.5 4 7.5s4-2.5 4-7.5S10 2.5 10 2.5z" stroke={c} strokeWidth="1.5"/>
      <path d="M2.5 10h15" stroke={c} strokeWidth="1.5"/>
    </svg>
  );
}

/** 알림/벨 */
export function IconBell({ size = 18, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 2a6 6 0 00-6 6c0 3-1.5 4.5-1.5 4.5h15S16 11 16 8a6 6 0 00-6-6z" stroke={c} strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M8.5 16.5a1.5 1.5 0 003 0" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

/** 테마/팔레트 */
export function IconTheme({ size = 18, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7.5" stroke={c} strokeWidth="1.7"/>
      <circle cx="7" cy="8.5" r="1.3" fill={c}/>
      <circle cx="10" cy="6.5" r="1.3" fill={c}/>
      <circle cx="13" cy="8.5" r="1.3" fill={c}/>
      <path d="M6 12.5c0 0 1 2 4 2s4-2 4-2" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/** 문서/약관 */
export function IconDocument({ size = 18, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M5 2h7l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" stroke={c} strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M12 2v4h4" stroke={c} strokeWidth="1.5"/>
      <path d="M7 9h6M7 12h6M7 15h4" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

/** 고객지원/헤드폰 */
export function IconSupport({ size = 18, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4 11V9a6 6 0 1112 0v2" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <rect x="2.5" y="11" width="3" height="5" rx="1.5" stroke={c} strokeWidth="1.5"/>
      <rect x="14.5" y="11" width="3" height="5" rx="1.5" stroke={c} strokeWidth="1.5"/>
      <path d="M17.5 15v1a2 2 0 01-2 2h-2" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/** 정보 */
export function IconInfo({ size = 18, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7.5" stroke={c} strokeWidth="1.7"/>
      <path d="M10 9v6" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="10" cy="6.5" r="1.1" fill={c}/>
    </svg>
  );
}

/** 로그아웃/나가기 */
export function IconLogout({ size = 18, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M8 3H5a1 1 0 00-1 1v12a1 1 0 001 1h3" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M13 7l4 3-4 3" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 10H9" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

/** 탈퇴/삭제 */
export function IconDelete({ size = 18, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4 7h12M8 7V5h4v2M15 7l-1 10H6L5 7" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 10v4M11 10v4" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/** TV/광고 */
export function IconAd({ size = 20, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2" y="3" width="16" height="11" rx="2" stroke={c} strokeWidth="1.7"/>
      <path d="M7 17.5h6M10 14v3.5" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M8 7.5l4 2-4 2v-4z" fill={c}/>
    </svg>
  );
}

/** 통계/단어 배운 수 */
export function IconBook({ size = 20, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4 16V5a1 1 0 011-1h4.5a2 2 0 012 2v9" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M16 16V5a1 1 0 00-1-1h-4.5a2 2 0 00-2 2v9" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M4 16h12" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

/** 지도 핀 */
export function IconPin({ size = 20, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 2a5.5 5.5 0 00-5.5 5.5C4.5 11.5 10 18 10 18s5.5-6.5 5.5-10.5A5.5 5.5 0 0010 2z" stroke={c} strokeWidth="1.7"/>
      <circle cx="10" cy="7.5" r="2" stroke={c} strokeWidth="1.5"/>
    </svg>
  );
}

/** 일기장 */
export function IconDiary({ size = 20, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="4" y="2" width="12" height="16" rx="1.5" stroke={c} strokeWidth="1.7"/>
      <path d="M7 2v16" stroke={c} strokeWidth="1.5"/>
      <path d="M10 6.5h4M10 9.5h4M10 12.5h2" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="7" cy="2" r="1.5" fill={c}/>
      <circle cx="7" cy="18" r="1.5" fill={c}/>
    </svg>
  );
}

/** 체크/완료 */
export function IconCheck({ size = 16, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3 8.5l3.5 3.5 6.5-7" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/** 별/프리미엄 */
export function IconStar({ size = 18, color, className }: IconProps) {
  const c = d(color);
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 2l2.4 4.8 5.3.8-3.85 3.75.9 5.3L10 14.1l-4.75 2.55.9-5.3L2.3 7.6l5.3-.8L10 2z" stroke={c} strokeWidth="1.5" strokeLinejoin="round" fill={c} fillOpacity="0.15"/>
    </svg>
  );
}
