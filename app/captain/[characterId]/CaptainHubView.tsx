"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Character } from "@/types/database";
import { setPreferredCaptainId } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import styles from "./captain-hub.module.css";
import { getCaptainDisplayProfile } from "@/lib/captainProfiles";

export default function CaptainHubView({ character }: { character: Character }) {
  const { t, language } = useLanguage();
  const profile = getCaptainDisplayProfile(language, character.id);

  useEffect(() => {
    setPreferredCaptainId(character.id);
  }, [character.id]);

  const destinations = [
    { href: `/learn/${character.id}`, icon: "📖", title: t("learnPageTitle"), detail: t("learnTitle"), tone: "blue" },
    { href: `/chat/${character.id}`, icon: "💬", title: t("chatTitle"), detail: t("chatSub"), tone: "red" },
    { href: `/diary/${character.id}`, icon: "📔", title: t("diaryTitle"), detail: t("diarySub"), tone: "gold" },
    { href: `/captain/${character.id}/stories`, icon: "📖", title: "Backstory", detail: "Premium stories · 3", tone: "gold" },
  ];

  return (
    <main className="page-content">
      <header className="page-header">
        <Link href="/map" className={styles.backButton} aria-label="Back to map">‹</Link>
        <div>
          <h1 className="page-title">{profile.name}</h1>
          <p className={styles.subtitle}>{profile.description}</p>
        </div>
      </header>

      <section className={styles.content}>
        <div className={styles.profileCard}>
          <Image
            src={`/characters/${character.id}.png`}
            alt={profile.name}
            width={96}
            height={96}
            className={styles.avatar}
          />
          <div>
            <p className={styles.eyebrow}>{character.emoji} K-MATE CAPTAIN</p>
            <h2>{profile.name}</h2>
            <p>{profile.description}</p>
          </div>
        </div>

        <div className={styles.menuGrid}>
          {destinations.map((item) => (
            <Link key={item.href} href={item.href} className={`${styles.menuCard} ${styles[item.tone]}`}>
              <span className={styles.menuIcon}>{item.icon}</span>
              <span className={styles.menuCopy}>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </span>
              <span className={styles.arrow} aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
