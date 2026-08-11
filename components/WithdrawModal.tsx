"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "./LanguageContext";
import { getAuthHeaders, getCurrentUser, clearWithdrawnUserLocalData } from "@/lib/auth/store";
import styles from "./WithdrawModal.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setPassword("");
    setError(null);
    onClose();
  };

  const submit = async () => {
    const user = getCurrentUser();
    if (!user) {
      setError(t("withdrawErrorWrongPassword"));
      return;
    }
    if (!password.trim()) {
      setError(t("withdrawPasswordLabel"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ user_id: user.id, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || t("withdrawErrorWrongPassword"));
        return;
      }

      clearWithdrawnUserLocalData(user.id);
      alert(t("withdrawSuccessMsg"));
      router.push("/login");
    } catch {
      setError(t("withdrawErrorWrongPassword"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>⚠️ {t("withdrawModalTitle")}</h3>
          <button className={styles.closeBtn} onClick={handleClose}>✕</button>
        </div>

        <p className={styles.warningText}>{t("withdrawModalWarning")}</p>
        <p className={styles.retentionText}>
          {t("withdrawModalRetentionNotice")}{" "}
          <Link href="/legal" target="_blank" className={styles.policyLink}>
            {t("withdrawViewFullPolicy")}
          </Link>
        </p>

        <label className={styles.fieldLabel} htmlFor="withdraw-password">
          {t("withdrawPasswordLabel")}
        </label>
        <input
          id="withdraw-password"
          type="password"
          className={styles.passwordInput}
          placeholder={t("withdrawPasswordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoComplete="current-password"
        />

        {error && (
          <p className={styles.errorText} role="alert">{error}</p>
        )}

        <div className={styles.actionRow}>
          <button className={styles.cancelBtn} onClick={handleClose} disabled={loading}>
            {t("withdrawCancelBtn")}
          </button>
          <button className={styles.confirmBtn} onClick={submit} disabled={loading}>
            {loading ? "..." : t("withdrawConfirmBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
