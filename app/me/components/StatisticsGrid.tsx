import styles from "../me.module.css";

interface StatEntry {
  icon: string;
  num: number;
  label: string;
}

interface StatisticsGridProps {
  title: string;
  stats: StatEntry[];
}

export default function StatisticsGrid({ title, stats }: StatisticsGridProps) {
  return (
    <div>
      <p className="section-title">{title}</p>
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.statItem}>
            <span className={styles.statIcon}>{stat.icon}</span>
            <span className={styles.statNum}>{stat.num}</span>
            <span className={styles.statKo}>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
