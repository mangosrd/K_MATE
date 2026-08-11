"use client";

import { useState } from "react";
import Link from "next/link";
import { getAuthHeaders, getEffectiveUserId } from "@/lib/auth/store";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { useLanguage } from "@/components/LanguageContext";
import formStyles from "../me/settings-form.module.css";
import styles from "./support.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type Category = "account" | "billing" | "bug" | "content" | "other";

export default function SupportPage() {
  const { t } = useLanguage();
  const { authUser, authLoaded } = useAuthUser();

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <Link href="/me" className={styles.backLink}>{t("backToMyPage")}</Link>
        <div className={styles.card}>
          <h1 className={styles.title}>{t("customerSupport")}</h1>
          {!authLoaded ? (
            <div className={styles.confirmBox} aria-hidden="true">⏳</div>
          ) : (
            <SupportForm
              key={authUser?.id ?? "guest"}
              initialName={authUser?.name ?? ""}
              initialEmail={authUser?.email ?? ""}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function SupportForm({ initialName, initialEmail }: { initialName: string; initialEmail: string }) {
  const { t } = useLanguage();

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [category, setCategory] = useState<Category>("other");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/support/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          user_id: getEffectiveUserId(),
          name,
          email,
          category,
          message,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.detail ?? "Error");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return submitted ? (
            <div className={styles.confirmBox}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>✅</p>
              <p className={formStyles.successMsg}>{t("ticketSubmittedMsg")}</p>
              <Link href="/me" className="btn btn-secondary btn-lg" style={{ marginTop: 20, textAlign: "center" }}>
                {t("backToMyPage")}
              </Link>
            </div>
          ) : (
            <>
              <p className={styles.sub}>{t("supportSub")}</p>
              <form onSubmit={handleSubmit} className={formStyles.form} style={{ padding: 0 }}>
                <div className={formStyles.field}>
                  <label className={formStyles.label} htmlFor="support-name">{t("nameLabel")}</label>
                  <input
                    id="support-name"
                    className={formStyles.input}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className={formStyles.field}>
                  <label className={formStyles.label} htmlFor="support-email">{t("emailLabel")}</label>
                  <input
                    id="support-email"
                    type="email"
                    className={formStyles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className={formStyles.field}>
                  <label className={formStyles.label} htmlFor="support-category">{t("categoryLabel")}</label>
                  <select
                    id="support-category"
                    className={formStyles.select}
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                  >
                    <option value="account">{t("categoryAccount")}</option>
                    <option value="billing">{t("categoryBilling")}</option>
                    <option value="bug">{t("categoryBug")}</option>
                    <option value="content">{t("categoryContent")}</option>
                    <option value="other">{t("settingsOther")}</option>
                  </select>
                </div>
                <div className={formStyles.field}>
                  <label className={formStyles.label} htmlFor="support-message">{t("messageLabel")}</label>
                  <textarea
                    id="support-message"
                    className={formStyles.textarea}
                    placeholder={t("messagePlaceholder")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    minLength={5}
                  />
                </div>

                {error && <p className={formStyles.errorMsg}>{error}</p>}

                <button type="submit" className="btn btn-primary btn-lg" id="btn-submit-ticket" disabled={loading}>
                  {loading ? t("savingBtn") : t("submitTicketBtn")}
                </button>
              </form>
            </>
  );
}
