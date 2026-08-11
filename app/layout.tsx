import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageContext";
import { ThemeProvider } from "@/components/ThemeContext";
import PushNotificationSetup from "@/components/PushNotificationSetup";
import TimezoneSync from "@/components/TimezoneSync";

const dunggeunmiso = localFont({
  src: [
    {
      path: "./fonts/Dunggeunmiso-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Dunggeunmiso-Bold.otf",
      weight: "700 900",
      style: "normal",
    },
  ],
  variable: "--font-dunggeunmiso",
  display: "swap",
  fallback: ["Noto Sans KR", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "K-MATE — Learn Korean with Your AI Travel Companion",
  description:
    "Travel virtual Korea with your AI mate, learn Korean naturally through conversation, and collect memories together.",
  keywords: ["Korean learning", "K-culture", "AI companion", "language app", "travel Korea"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={dunggeunmiso.variable}>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <div className="app-shell">{children}</div>
            <PushNotificationSetup />
            <TimezoneSync />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
