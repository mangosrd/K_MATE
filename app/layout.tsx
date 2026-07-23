import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageContext";

export const metadata: Metadata = {
  title: "K-MATE — Learn Korean with Your AI Travel Companion",
  description:
    "Travel virtual Korea with your AI mate, learn Korean naturally through conversation, and collect memories together.",
  keywords: ["Korean learning", "K-culture", "AI companion", "language app", "travel Korea"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <LanguageProvider>
          <div className="app-shell">{children}</div>
        </LanguageProvider>
      </body>
    </html>
  );
}
