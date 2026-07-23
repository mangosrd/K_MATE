"use client";

import React from "react";
import { useLanguage, Language } from "./LanguageContext";
import styles from "./LanguageModal.module.css";

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LanguageModal({ isOpen, onClose }: LanguageModalProps) {
  const { language, setLanguage, t } = useLanguage();

  if (!isOpen) return null;

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>🌐 {t("selectLang")}</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <p className={styles.modalSub}>
          사용하실 모국어를 선택해 주세요 (Select native language / Выберите родной язык)
        </p>

        <div className={styles.langList}>
          <button
            type="button"
            className={`${styles.langItem} ${language === "ko" ? styles.selected : ""}`}
            onClick={() => handleSelect("ko")}
          >
            <span className={styles.flag}>🇰🇷</span>
            <div className={styles.langTextWrap}>
              <span className={styles.langName}>한국어</span>
              <span className={styles.langNative}>Korean (기본 모드)</span>
            </div>
            {language === "ko" && <span className={styles.checkIcon}>✓</span>}
          </button>

          <button
            type="button"
            className={`${styles.langItem} ${language === "en" ? styles.selected : ""}`}
            onClick={() => handleSelect("en")}
          >
            <span className={styles.flag}>🇺🇸</span>
            <div className={styles.langTextWrap}>
              <span className={styles.langName}>English</span>
              <span className={styles.langNative}>영어 (All UI in English)</span>
            </div>
            {language === "en" && <span className={styles.checkIcon}>✓</span>}
          </button>

          <button
            type="button"
            className={`${styles.langItem} ${language === "ru" ? styles.selected : ""}`}
            onClick={() => handleSelect("ru")}
          >
            <span className={styles.flag}>🇷🇺</span>
            <div className={styles.langTextWrap}>
              <span className={styles.langName}>Русский</span>
              <span className={styles.langNative}>러시아어 (Весь интерфейс на русском)</span>
            </div>
            {language === "ru" && <span className={styles.checkIcon}>✓</span>}
          </button>

          <button
            type="button"
            className={`${styles.langItem} ${language === "zh" ? styles.selected : ""}`}
            onClick={() => handleSelect("zh")}
          >
            <span className={styles.flag}>🇨🇳</span>
            <div className={styles.langTextWrap}>
              <span className={styles.langName}>中文</span>
              <span className={styles.langNative}>중국어 (所有界面转换为中文)</span>
            </div>
            {language === "zh" && <span className={styles.checkIcon}>✓</span>}
          </button>

          <button
            type="button"
            className={`${styles.langItem} ${language === "ja" ? styles.selected : ""}`}
            onClick={() => handleSelect("ja")}
          >
            <span className={styles.flag}>🇯🇵</span>
            <div className={styles.langTextWrap}>
              <span className={styles.langName}>日本語</span>
              <span className={styles.langNative}>일본어 (全画面日本語表示)</span>
            </div>
            {language === "ja" && <span className={styles.checkIcon}>✓</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
