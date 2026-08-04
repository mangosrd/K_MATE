import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageContext";
import { ThemeProvider } from "@/components/ThemeContext";
import PushNotificationSetup from "@/components/PushNotificationSetup";

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
    <html lang="ko">
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <div className="app-shell">{children}</div>
            <PushNotificationSetup />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
