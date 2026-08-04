"use client";

import Link from "next/link";
import styles from "../me.module.css";

interface SettingItemProps {
  icon: string;
  label: string;
  value?: string | number;
  isExternal?: boolean;
  isDanger?: boolean;
  href?: string;
  onClick?: () => void;
  id?: string;
}

export default function SettingItem({ icon, label, value, isExternal, isDanger, href, onClick, id }: SettingItemProps) {
  const content = (
    <>
      <span className={styles.settingLeft}>
        <span className={styles.settingIcon}>{icon}</span>
        <span className={isDanger ? styles.settingLabelDanger : styles.settingLabel}>{label}</span>
      </span>
      <span className={styles.settingRight}>
        {value !== undefined && <span className={styles.settingValue}>{value}</span>}
        <span className={styles.settingChevron}>{isExternal ? "↗" : "›"}</span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={styles.settingItem} id={id}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={styles.settingItem} onClick={onClick} id={id}>
      {content}
    </button>
  );
}
