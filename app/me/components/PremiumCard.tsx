import Link from "next/link";
import styles from "../me.module.css";

interface PremiumCardProps {
  isPremium: boolean;
  titleText: string;
  subText: string;
  ctaText: string;
}

export default function PremiumCard({ isPremium, titleText, subText, ctaText }: PremiumCardProps) {
  return (
    <Link href="/premium" className={`${styles.premiumCard} ${isPremium ? styles.premiumCardActive : ""}`}>
      <span className={styles.premiumIcon}>⭐</span>
      <div className={styles.premiumInfo}>
        <p className={styles.premiumTitle}>{titleText}</p>
        <p className={styles.premiumSub}>{subText}</p>
      </div>
      <span className={styles.premiumArrow}>{ctaText}</span>
    </Link>
  );
}
