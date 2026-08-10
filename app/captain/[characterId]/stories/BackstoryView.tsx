"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getEffectiveUserId } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import { getCaptainDisplayProfile } from "@/lib/captainProfiles";
import styles from "./backstories.module.css";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
type Story = { id:string; episode_number:number; title:string; summary:string; body:string|null; unlock_cost:number; unlocked:boolean };

export default function BackstoryView({ characterId }: { characterId: string }) {
  const { language } = useLanguage();
  const profile = getCaptainDisplayProfile(language, characterId);
  const [stories, setStories] = useState<Story[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const load = () => fetch(`${API}/backstories/${characterId}?user_id=${getEffectiveUserId()}`).then(r => r.ok ? r.json() : Promise.reject()).then(setStories).catch(() => setError("스토리를 불러오지 못했어요."));
  useEffect(() => { void load(); }, [characterId]);
  const unlock = async (story: Story) => {
    setBusy(story.id); setError("");
    const response = await fetch(`${API}/backstories/${story.id}/unlock`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({user_id:getEffectiveUserId()}) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.detail || "해금하지 못했어요."); else await load();
    setBusy("");
  };
  return <main className={styles.page}>
    <header className={styles.header}><Link href={`/captain/${characterId}`}>‹</Link><div><p>PREMIUM NOVEL</p><h1>{profile.name}의 백스토리</h1></div></header>
    <p className={styles.intro}>기장이 지금까지 말하지 못했던 세 편의 이야기를 만나보세요.</p>
    {error && <p className={styles.error}>{error}</p>}
    <section className={styles.list}>{stories.map(story => <article key={story.id} className={styles.card}>
      <div className={styles.episode}>EPISODE {story.episode_number}</div><h2>{story.title}</h2><p>{story.summary}</p>
      {story.unlocked && story.body ? <div className={styles.body}>{story.body}</div> : <button onClick={() => unlock(story)} disabled={busy===story.id}>🔒 {busy===story.id ? "해금 중…" : `${story.unlock_cost} 코인으로 읽기`}</button>}
    </article>)}</section>
  </main>;
}
