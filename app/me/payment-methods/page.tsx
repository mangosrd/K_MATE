"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUser, getEffectiveUserId } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import formStyles from "../settings-form.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const BRAND_ICON: Record<string, string> = {
  "Visa": "💳",
  "Mastercard": "💳",
  "American Express": "💳",
  "JCB / UnionPay": "💳",
  "Card": "💳",
};

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  created_at: string;
}

export default function PaymentMethodsPage() {
  const { t } = useLanguage();
  const authUser = getCurrentUser();

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const loadMethods = () => {
    if (!authUser) {
      setLoaded(true);
      return;
    }
    fetch(`${BACKEND_URL}/user/${getEffectiveUserId()}/payment-methods`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMethods(data ?? []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  };

  useEffect(loadMethods, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    setError(null);
    setAdding(true);
    try {
      const res = await fetch(`${BACKEND_URL}/user/${getEffectiveUserId()}/payment-methods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: getEffectiveUserId(), card_number: cardNumber }),
      });
      if (!res.ok) {
        setError(t("invalidCardMsg"));
        return;
      }
      setCardNumber("");
      loadMethods();
    } catch {
      setError(t("invalidCardMsg"));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    await fetch(`${BACKEND_URL}/payment-methods/${id}`, { method: "DELETE" }).catch(() => {});
    setMethods((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <Link href="/me" className={formStyles.backLink}>{t("backToMyPage")}</Link>
          <h1 className="page-title">{t("paymentMethods")}</h1>
        </div>
      </header>

      {!loaded ? (
        <div className={formStyles.form} aria-hidden="true">⏳</div>
      ) : !authUser ? (
        <div className={formStyles.form}>
          <p className={formStyles.guestNotice}>{t("guestProfileNotice")}</p>
        </div>
      ) : (
        <div className={formStyles.form}>
          {methods.length === 0 ? (
            <p className={formStyles.emptyState}>{t("noPaymentMethods")}</p>
          ) : (
            <div className={formStyles.cardList}>
              {methods.map((m) => (
                <div key={m.id} className={formStyles.cardItem}>
                  <span className={formStyles.cardInfo}>
                    {BRAND_ICON[m.brand] ?? "💳"} {m.brand} •••• {m.last4}
                  </span>
                  <button
                    type="button"
                    className={formStyles.removeBtn}
                    onClick={() => handleRemove(m.id)}
                  >
                    {t("removeCardBtn")}
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAdd} className={formStyles.field} style={{ marginTop: 8 }}>
            <label className={formStyles.label} htmlFor="card-number">{t("cardNumberLabel")}</label>
            <input
              id="card-number"
              inputMode="numeric"
              className={formStyles.input}
              placeholder={t("cardNumberPlaceholder")}
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              required
              minLength={12}
              maxLength={19}
            />
            {error && <p className={formStyles.errorMsg}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-lg" id="btn-add-card" disabled={adding} style={{ marginTop: 8 }}>
              {adding ? t("savingBtn") : t("addCardBtn")}
            </button>
          </form>

          <p className={formStyles.notice}>{t("paymentSimNotice")}</p>
        </div>
      )}
    </div>
  );
}
