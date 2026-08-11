"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAuthHeaders } from "@/lib/auth/store";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { useLanguage } from "@/components/LanguageContext";
import formStyles from "../settings-form.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface Prefs {
  notify_chat: boolean;
  notify_diary: boolean;
  notify_marketing: boolean;
}

export default function NotificationsPage() {
  const { t } = useLanguage();
  const { authUser, authLoaded } = useAuthUser();

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <Link href="/me" className={formStyles.backLink}>{t("backToMyPage")}</Link>
          <h1 className="page-title">{t("notificationSettings")}</h1>
        </div>
      </header>

      {!authLoaded ? (
        <div className={formStyles.form} aria-hidden="true">⏳</div>
      ) : !authUser ? (
        <div className={formStyles.form}>
          <p className={formStyles.guestNotice}>{t("guestNotifyNotice")}</p>
        </div>
      ) : (
        <NotificationPreferences key={authUser.id} userId={authUser.id} />
      )}
    </div>
  );
}

function NotificationPreferences({ userId }: { userId: string }) {
  const { t } = useLanguage();
  const [prefs, setPrefs] = useState<Prefs>({ notify_chat: true, notify_diary: true, notify_marketing: false });
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${BACKEND_URL}/user/${userId}/preferences`, {
      headers: getAuthHeaders(),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setPrefs({
            notify_chat: data.notify_chat,
            notify_diary: data.notify_diary,
            notify_marketing: data.notify_marketing,
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoaded(true);
      });
    return () => controller.abort();
  }, [userId]);

  const handleToggle = (key: keyof Prefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaved(false);

    fetch(`${BACKEND_URL}/user/${userId}/preferences`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ user_id: userId, [key]: next[key] }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setSaved(true); })
      .catch(() => {});
  };

  if (!loaded) {
    return <div className={formStyles.form} aria-hidden="true">⏳</div>;
  }

  return (
    <div className={formStyles.form}>
          <div className={formStyles.toggleRow}>
            <div className={formStyles.toggleText}>
              <span className={formStyles.toggleLabel}>💬 {t("notifyChatLabel")}</span>
              <span className={formStyles.toggleSub}>{t("notifyChatSub")}</span>
            </div>
            <label className={formStyles.switch}>
              <input type="checkbox" checked={prefs.notify_chat} onChange={() => handleToggle("notify_chat")} />
              <span className={formStyles.slider} />
            </label>
          </div>

          <div className={formStyles.toggleRow}>
            <div className={formStyles.toggleText}>
              <span className={formStyles.toggleLabel}>📔 {t("notifyDiaryLabel")}</span>
              <span className={formStyles.toggleSub}>{t("notifyDiarySub")}</span>
            </div>
            <label className={formStyles.switch}>
              <input type="checkbox" checked={prefs.notify_diary} onChange={() => handleToggle("notify_diary")} />
              <span className={formStyles.slider} />
            </label>
          </div>

          <div className={formStyles.toggleRow}>
            <div className={formStyles.toggleText}>
              <span className={formStyles.toggleLabel}>📣 {t("notifyMarketingLabel")}</span>
              <span className={formStyles.toggleSub}>{t("notifyMarketingSub")}</span>
            </div>
            <label className={formStyles.switch}>
              <input type="checkbox" checked={prefs.notify_marketing} onChange={() => handleToggle("notify_marketing")} />
              <span className={formStyles.slider} />
            </label>
          </div>

          {saved && <p className={formStyles.successMsg}>{t("notificationsSaved")}</p>}
    </div>
  );
}
