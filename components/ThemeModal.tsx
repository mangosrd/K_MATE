"use client";

import React from "react";
import { useTheme, Theme } from "./ThemeContext";
import { useLanguage } from "./LanguageContext";
import styles from "./LanguageModal.module.css";

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ThemeModal({ isOpen, onClose }: ThemeModalProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleSelect = (next: Theme) => {
    setTheme(next);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>🎨 {t("themeSettings")}</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <p className={styles.modalSub}>{t("themeSettingsSub")}</p>

        <div className={styles.langList}>
          <button
            type="button"
            className={`${styles.langItem} ${theme === "light" ? styles.selected : ""}`}
            onClick={() => handleSelect("light")}
          >
            <span className={styles.flag}>☀️</span>
            <div className={styles.langTextWrap}>
              <span className={styles.langName}>{t("themeLight")}</span>
              <span className={styles.langNative}>{t("themeLightSub")}</span>
            </div>
            {theme === "light" && <span className={styles.checkIcon}>✓</span>}
          </button>

          <button
            type="button"
            className={`${styles.langItem} ${theme === "dark" ? styles.selected : ""}`}
            onClick={() => handleSelect("dark")}
          >
            <span className={styles.flag}>🌙</span>
            <div className={styles.langTextWrap}>
              <span className={styles.langName}>{t("themeDark")}</span>
              <span className={styles.langNative}>{t("themeDarkSub")}</span>
            </div>
            {theme === "dark" && <span className={styles.checkIcon}>✓</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
