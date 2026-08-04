import Link from "next/link";
import styles from "../me.module.css";

interface ProfileCardProps {
  displayName: string;
  levelLabel: string;
  coins: number;
  coinLabel: string;
}

export default function ProfileCard({ displayName, levelLabel, coins, coinLabel }: ProfileCardProps) {
  return (
    <div className={styles.profileCard}>
      <div className={styles.profileBg} aria-hidden="true" />
      <div className={styles.profileContent}>
        <div className={styles.profileAvatar}>{displayName.charAt(0).toUpperCase()}</div>
        <div className={styles.profileInfo}>
          <p className={styles.profileName}>{displayName}</p>
          <p className={styles.profileLevel}>{levelLabel}</p>
        </div>
        <Link href="/coins" className={styles.profileCoin}>
          <p className={styles.coinNum}>🪙 {coins} +</p>
          <p className={styles.coinLabel}>{coinLabel}</p>
        </Link>
      </div>
    </div>
  );
}
