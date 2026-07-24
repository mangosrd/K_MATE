"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";

export default function LockedNotice({ charName }: { charName: string }) {
  const { t } = useLanguage();
  return (
    <div className="page-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "20px", textAlign: "center" }}>
      <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔒</div>
      <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px" }}>{t("lockedTitle", { name: charName })}</h2>
      <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px", maxWidth: "300px" }}>
        {t("lockedDesc")}
      </p>
      <div style={{ display: "flex", gap: "12px" }}>
        <Link href="/map" className="btn btn-secondary">{t("backToMapWithArrow")}</Link>
        <Link href="/premium" className="btn btn-gold">{t("viewPremiumBtn")}</Link>
      </div>
    </div>
  );
}
