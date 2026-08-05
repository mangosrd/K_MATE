import Image from "next/image";
import styles from "../me.module.css";
import type { Character, Progress } from "@/types/database";

interface CaptainCardProps {
  mate: Character;
  progress: Progress;
  titleText: string;
  taglineText: string;
  changeLabel: string;
  onChangeClick: () => void;
}

export default function CaptainCard({
  mate,
  progress,
  titleText,
  taglineText,
  changeLabel,
  onChangeClick,
}: CaptainCardProps) {
  const affinityStars = Math.round(progress.affinity / 20);

  return (
    <div className={styles.mateCard}>
      <div className={styles.mateAvatar}>
        <Image src={mate.avatar_url} alt={mate.name} width={50} height={50} className={styles.mateAvatarImg} />
      </div>
      <div className={styles.mateInfo}>
        <div className={styles.mateHeaderRow}>
          <div>
            <p className={styles.mateName}>{titleText}</p>
            <p className={styles.mateNameEn}>{taglineText}</p>
          </div>
          <button type="button" onClick={onChangeClick} id="btn-change-mate" className={styles.changeMateBtn}>
            {changeLabel}
          </button>
        </div>
        <div className={styles.affinityRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ fontSize: 16 }}>{i < affinityStars ? "❤️" : "🤍"}</span>
          ))}
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}>
            {progress.affinity} / 100
          </span>
        </div>
        <div className={styles.streakRow}>
          <span>💗</span>
          <span className={styles.streakNum}>D+{progress.streak_days}</span>
        </div>
      </div>
    </div>
  );
}
