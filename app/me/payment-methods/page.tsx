"use client";

import Link from "next/link";
import { Language, useLanguage } from "@/components/LanguageContext";
import formStyles from "../settings-form.module.css";

const PLAY_SUBSCRIPTIONS_URL =
  "https://play.google.com/store/account/subscriptions?package=com.kmate.app";

const COPY: Record<
  Language,
  { title: string; description: string; privacy: string; manage: string }
> = {
  ko: {
    title: "결제 및 구독",
    description: "K-MATE의 결제와 구독은 Google Play에서 안전하게 처리됩니다.",
    privacy: "K-MATE는 카드번호를 직접 수집하거나 저장하지 않습니다.",
    manage: "Google Play에서 구독 관리",
  },
  en: {
    title: "Payments & subscriptions",
    description: "K-MATE payments and subscriptions are securely processed by Google Play.",
    privacy: "K-MATE does not collect or store your card number.",
    manage: "Manage on Google Play",
  },
  ru: {
    title: "Платежи и подписки",
    description: "Платежи и подписки K-MATE безопасно обрабатываются через Google Play.",
    privacy: "K-MATE не собирает и не хранит номера банковских карт.",
    manage: "Управлять в Google Play",
  },
  zh: {
    title: "付款与订阅",
    description: "K-MATE 的付款和订阅均由 Google Play 安全处理。",
    privacy: "K-MATE 不会直接收集或保存您的银行卡号。",
    manage: "在 Google Play 中管理订阅",
  },
  ja: {
    title: "お支払いと定期購入",
    description: "K-MATEのお支払いと定期購入はGoogle Playで安全に処理されます。",
    privacy: "K-MATEがカード番号を直接収集・保存することはありません。",
    manage: "Google Playで定期購入を管理",
  },
  "zh-TW": {
    title: "付款與訂閱",
    description: "K-MATE 的付款與訂閱均由 Google Play 安全處理。",
    privacy: "K-MATE 不會直接收集或儲存您的信用卡號。",
    manage: "在 Google Play 中管理訂閱",
  },
  th: {
    title: "การชำระเงินและการสมัครสมาชิก",
    description: "การชำระเงินและการสมัครสมาชิกของ K-MATE ดำเนินการอย่างปลอดภัยผ่าน Google Play",
    privacy: "K-MATE จะไม่รวบรวมหรือจัดเก็บหมายเลขบัตรของคุณโดยตรง",
    manage: "จัดการการสมัครสมาชิกใน Google Play",
  },
};

export default function PaymentMethodsPage() {
  const { language, t } = useLanguage();
  const copy = COPY[language];

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <Link href="/me" className={formStyles.backLink}>
            {t("backToMyPage")}
          </Link>
          <h1 className="page-title">{copy.title}</h1>
        </div>
      </header>

      <section className={formStyles.form}>
        <div className={formStyles.playBillingCard}>
          <div className={formStyles.playBillingIcon} aria-hidden="true">
            ▶
          </div>
          <div className={formStyles.playBillingText}>
            <strong>Google Play</strong>
            <p>{copy.description}</p>
          </div>
        </div>

        <p className={formStyles.playBillingPrivacy}>{copy.privacy}</p>

        <a
          className="btn btn-primary btn-lg"
          href={PLAY_SUBSCRIPTIONS_URL}
          target="_blank"
          rel="noreferrer"
        >
          {copy.manage}
        </a>
      </section>
    </div>
  );
}
