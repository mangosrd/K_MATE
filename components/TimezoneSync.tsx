"use client";

import { useEffect } from "react";
import { getAuthHeaders, getCurrentUser, getEffectiveUserId } from "@/lib/auth/store";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function TimezoneSync() {
  useEffect(() => {
    if (!getCurrentUser()) return;
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detected) return;

    fetch(`${BACKEND_URL}/user/${getEffectiveUserId()}/preferences`, { headers: getAuthHeaders() })
      .then((response) => response.ok ? response.json() : null)
      .then((preferences) => {
        if (!preferences || preferences.timezone_mode !== "auto" || preferences.timezone_name === detected) return;
        return fetch(`${BACKEND_URL}/user/${getEffectiveUserId()}/preferences`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            user_id: getEffectiveUserId(),
            timezone_name: detected,
            timezone_mode: "auto",
          }),
        });
      })
      .catch(() => {});
  }, []);

  return null;
}
