"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { getAuthHeaders, setCurrentUser } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import formStyles from "../settings-form.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function SecurityPage() {
  const { t } = useLanguage();
  const { authUser, authLoaded } = useAuthUser();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;

    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          user_id: authUser.id,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail === "계정을 찾을 수 없습니다" ? t("noPasswordAccountNotice") : data.detail);
        return;
      }
      setCurrentUser(data);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError(t("passwordTooShort"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <Link href="/me" className={formStyles.backLink}>{t("backToMyPage")}</Link>
          <h1 className="page-title">{t("securitySettings")}</h1>
        </div>
      </header>

      {!authLoaded ? (
        <div className={formStyles.form} aria-hidden="true">⏳</div>
      ) : !authUser ? (
        <div className={formStyles.form}>
          <p className={formStyles.guestNotice}>{t("guestProfileNotice")}</p>
        </div>
      ) : (
        <form className={formStyles.form} onSubmit={handleSubmit}>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="pw-current">{t("currentPasswordLabel")}</label>
            <input
              id="pw-current"
              type="password"
              className={formStyles.input}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="pw-new">{t("newPasswordLabel")}</label>
            <input
              id="pw-new"
              type="password"
              className={formStyles.input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="pw-confirm">{t("confirmPasswordLabel")}</label>
            <input
              id="pw-confirm"
              type="password"
              className={formStyles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {error && <p className={formStyles.errorMsg}>{error}</p>}
          {success && <p className={formStyles.successMsg}>{t("passwordChanged")}</p>}

          <button type="submit" className="btn btn-primary btn-lg" id="btn-change-password" disabled={loading}>
            {loading ? t("savingBtn") : t("changePasswordBtn")}
          </button>
        </form>
      )}
    </div>
  );
}
