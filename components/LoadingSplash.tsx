"use client";

import styles from "./LoadingSplash.module.css";

interface LoadingSplashProps {
  message?: string;
  messageEn?: string;
}

export default function LoadingSplash({ message, messageEn }: LoadingSplashProps) {
  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.bgPattern} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.logoWrap}>
          <span className={styles.logoIcon}>✈️</span>
          <h1 className={styles.logoText}>K-MATE</h1>
        </div>

        <div className={styles.runway} aria-hidden="true">
          <span className={styles.plane}>✈️</span>
          <div className={styles.runwayLine} />
        </div>

        <div className={styles.dots} aria-hidden="true">
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>

        {message && <p className={styles.message}>{message}</p>}
        {messageEn && <p className={styles.messageEn}>{messageEn}</p>}
      </div>
    </div>
  );
}
