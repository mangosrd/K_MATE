"use client";

import { useState } from "react";
import Link from "next/link";
import { getAuthHeaders, setCurrentUser, type AuthUser } from "@/lib/auth/store";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { useLanguage } from "@/components/LanguageContext";
import formStyles from "../settings-form.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function EditProfilePage() {
  const { t } = useLanguage();
  const { authUser, authLoaded } = useAuthUser();

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <Link href="/me" className={formStyles.backLink}>{t("backToMyPage")}</Link>
          <h1 className="page-title">{t("editProfile")}</h1>
        </div>
      </header>

      {!authLoaded ? (
        <div className={formStyles.form} aria-hidden="true">⏳</div>
      ) : !authUser ? (
        <div className={formStyles.form}>
          <p className={formStyles.guestNotice}>{t("guestProfileNotice")}</p>
        </div>
      ) : (
        <EditProfileForm key={authUser.id} authUser={authUser} />
      )}
    </div>
  );
}

function EditProfileForm({ authUser }: { authUser: AuthUser }) {
  const { t } = useLanguage();
  const [name, setName] = useState(authUser.name);
  const [email, setEmail] = useState(authUser.email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`${BACKEND_URL}/user/${authUser.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ user_id: authUser.id, name, email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.detail === "이미 사용 중인 이메일입니다" ? t("emailInUseError") : data?.detail ?? "Error");
        return;
      }
      const data = await res.json();
      setCurrentUser({ ...authUser, name: data.name, email: data.email });
      setSuccess(true);
    } catch {
      setError(t("emailInUseError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={formStyles.form} onSubmit={handleSubmit}>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="profile-name">{t("nameLabel")}</label>
            <input
              id="profile-name"
              className={formStyles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="profile-email">{t("emailLabel")}</label>
            <input
              id="profile-email"
              type="email"
              className={formStyles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && <p className={formStyles.errorMsg}>{error}</p>}
          {success && <p className={formStyles.successMsg}>{t("profileUpdated")}</p>}

          <button type="submit" className="btn btn-primary btn-lg" id="btn-save-profile" disabled={loading}>
            {loading ? t("savingBtn") : t("saveChangesBtn")}
          </button>
    </form>
  );
}
