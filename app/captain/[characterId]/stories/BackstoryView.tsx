"use client";
import { type CSSProperties, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAuthHeaders, getEffectiveUserId } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import { getCaptainDisplayProfile } from "@/lib/captainProfiles";
import styles from "./backstories.module.css";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
type Story = { id:string; episode_number:number; title:string; summary:string; body:string|null; unlock_cost:number; unlocked:boolean };

const STORY_THEME: Record<string, { route: string; code: string; icon: string; from: string; to: string }> = {
  kyuhyun: { route: "서울·경기", code: "SEL", icon: "🏯", from: "#b72038", to: "#082b60" },
  haneul: { route: "전주·전라", code: "JWJ", icon: "🏮", from: "#9f2f3f", to: "#49356d" },
  sunwoo: { route: "부산·경남", code: "PUS", icon: "⚓", from: "#086b8b", to: "#082b60" },
  sangwoo: { route: "충청·공주", code: "CJJ", icon: "🏛️", from: "#8a5b22", to: "#293e67" },
  yongwoo: { route: "제주", code: "CJU", icon: "🌋", from: "#bd3c32", to: "#173c73" },
};

export default function BackstoryView({ characterId }: { characterId: string }) {
  const { language } = useLanguage();
  const profile = getCaptainDisplayProfile(language, characterId);
  const theme = STORY_THEME[characterId] ?? STORY_THEME.kyuhyun;
  const [stories, setStories] = useState<Story[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(() => Promise.resolve()
    .then(() => fetch(`${API}/backstories/${characterId}?user_id=${getEffectiveUserId()}`, { headers: getAuthHeaders() }))
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(setStories)
    .catch(() => setError("스토리를 불러오지 못했어요.")), [characterId]);
  useEffect(() => { void load(); }, [load]);
  const unlock = async (story: Story) => {
    setBusy(story.id); setError("");
    const response = await fetch(`${API}/backstories/${story.id}/unlock`, { method:"POST", headers:{"Content-Type":"application/json", ...getAuthHeaders()}, body:JSON.stringify({user_id:getEffectiveUserId()}) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.detail || "해금하지 못했어요."); else await load();
    setBusy("");
  };
  const themeStyle = { "--story-from": theme.from, "--story-to": theme.to } as CSSProperties;
  return <main className={styles.page} style={themeStyle}>
    <header className={styles.topbar}>
      <Link href={`/captain/${characterId}`} className={styles.back} aria-label="기장 페이지로 돌아가기">‹</Link>
      <span>PREMIUM NOVEL</span><span className={styles.routeCode}>{theme.code}</span>
    </header>
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <div className={styles.routePill}>{theme.icon} {theme.route} 노선</div>
        <h1>{profile.name}의<br />백스토리</h1>
        <p>기장이 지금까지 말하지 못했던 세 편의 이야기를 만나보세요.</p>
      </div>
      <div className={styles.portraitWrap}><Image src={`/characters/${characterId}.png`} alt={profile.name} width={120} height={120} className={styles.portrait} priority /></div>
    </section>
    {error && <p className={styles.error}>{error}</p>}
    <section className={styles.list} aria-label={`${profile.name} 백스토리 목록`}>
      {stories.length === 0 && !error ? Array.from({ length: 3 }, (_, index) => <div key={index} className={styles.skeleton} />) : stories.map(story => <article key={story.id} className={`${styles.card} ${story.unlocked ? styles.cardUnlocked : ""}`}>
        <div className={styles.cardTop}><div><div className={styles.episode}>EPISODE {String(story.episode_number).padStart(2, "0")}</div><h2>{story.title}</h2></div><span className={styles.episodeNumber}>{String(story.episode_number).padStart(2, "0")}</span></div>
        <p className={styles.summary}>{story.summary}</p>
        {story.unlocked && story.body ? <div className={styles.body}><span className={styles.openLabel}>OPEN STORY</span>{story.body}</div> : <button className={styles.unlockButton} onClick={() => unlock(story)} disabled={busy===story.id}><span aria-hidden="true">🔒</span>{busy===story.id ? "해금 중…" : `${story.unlock_cost} 코인으로 읽기`}</button>}
      </article>)}
    </section>
  </main>;
}
