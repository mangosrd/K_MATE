import styles from "../me.module.css";

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div>
      <p className="section-title">{title}</p>
      <div className={styles.settingList}>{children}</div>
    </div>
  );
}
