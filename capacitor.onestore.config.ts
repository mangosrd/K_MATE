import type { CapacitorConfig } from "@capacitor/cli";

/**
 * ONE store free beta configuration.
 *
 * Do not run Capacitor with this file manually. `npm run build:onestore`
 * activates it temporarily and restores the Google Play configuration.
 */
const config: CapacitorConfig = {
  appId: "com.kmate.app",
  appName: "K-MATE Beta",
  webDir: "public",
  server: {
    url: "https://k-mate-v1q6.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    appendUserAgent: " K-MATE-ONESTORE",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["alert", "sound"],
    },
  },
};

export default config;

