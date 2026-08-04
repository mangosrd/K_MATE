"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { getAuthHeaders, getCurrentUser } from "@/lib/auth/store";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const TOKEN_KEY = "kmate_fcm_token";

/**
 * Native Android only. Browser push needs a separate service-worker flow, so
 * the Vercel web app deliberately does nothing here.
 */
export default function PushNotificationSetup() {
  const initialized = useRef(false);
  const activeUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;

    let disposed = false;

    const saveToken = async (token: string) => {
      const user = getCurrentUser();
      if (!user || disposed) return;

      localStorage.setItem(TOKEN_KEY, token);
      activeUserId.current = user.id;
      await fetch(`${BACKEND_URL}/notifications/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ token, platform: "android" }),
      }).catch(() => {
        // Keep the token locally and retry on the next app launch.
      });
    };

    const activateForSignedInUser = async () => {
      const user = getCurrentUser();
      if (!user || disposed) return;

      if (!initialized.current) {
        initialized.current = true;
        await PushNotifications.addListener("registration", ({ value }) => {
          void saveToken(value);
        });
        await PushNotifications.addListener("registrationError", (error) => {
          console.warn("K-MATE push registration failed", error.error);
        });
      }

      const permission = await PushNotifications.checkPermissions();
      const result = permission.receive === "prompt"
        ? await PushNotifications.requestPermissions()
        : permission;
      if (result.receive !== "granted") return;

      const cachedToken = localStorage.getItem(TOKEN_KEY);
      if (cachedToken && activeUserId.current === user.id) {
        await saveToken(cachedToken);
        return;
      }
      await PushNotifications.register();
    };

    const unregisterBeforeLogout = () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;
      void fetch(`${BACKEND_URL}/notifications/devices`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ token }),
      }).catch(() => {});
      activeUserId.current = null;
    };

    const retryActivation = () => void activateForSignedInUser();
    window.addEventListener("kmate-auth-changed", retryActivation);
    window.addEventListener("kmate-auth-logging-out", unregisterBeforeLogout);
    void activateForSignedInUser();

    return () => {
      disposed = true;
      window.removeEventListener("kmate-auth-changed", retryActivation);
      window.removeEventListener("kmate-auth-logging-out", unregisterBeforeLogout);
    };
  }, []);

  return null;
}
