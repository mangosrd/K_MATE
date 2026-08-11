"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage, type Language } from "@/components/LanguageContext";
import { getAuthHeaders, getCurrentUser, getEffectiveUserId } from "@/lib/auth/store";
import formStyles from "../settings-form.module.css";
import styles from "./timezone.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const ZONES = [
  "Asia/Seoul", "Asia/Tokyo", "Asia/Shanghai", "Asia/Taipei", "Asia/Bangkok",
  "Europe/Moscow", "Europe/London", "Europe/Paris",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Toronto", "America/Vancouver", "Australia/Sydney", "Pacific/Auckland", "UTC",
];

const COPY: Record<Language, { title: string; auto: string; manual: string; detected: string; select: string; save: string; saved: string; wait: string; back: string }> = {
  ko: { title: "시간대 설정", auto: "휴대폰 시간 자동", manual: "직접 선택", detected: "현재 적용 시간대", select: "시간대를 선택하세요", save: "저장하기", saved: "시간대가 저장됐어요.", wait: "시간대는 24시간에 한 번만 변경할 수 있어요.", back: "마이페이지로" },
  en: { title: "Time zone", auto: "Use device time", manual: "Choose manually", detected: "Current time zone", select: "Select a time zone", save: "Save", saved: "Time zone saved.", wait: "You can change your time zone once every 24 hours.", back: "Back to My Page" },
  ja: { title: "タイムゾーン", auto: "端末の時間を使用", manual: "手動で選択", detected: "現在のタイムゾーン", select: "タイムゾーンを選択", save: "保存", saved: "保存しました。", wait: "変更は24時間に1回までです。", back: "マイページへ" },
  zh: { title: "时区设置", auto: "使用设备时间", manual: "手动选择", detected: "当前时区", select: "选择时区", save: "保存", saved: "时区已保存。", wait: "时区每24小时只能更改一次。", back: "返回个人中心" },
  "zh-TW": { title: "時區設定", auto: "使用裝置時間", manual: "手動選擇", detected: "目前時區", select: "選擇時區", save: "儲存", saved: "時區已儲存。", wait: "時區每24小時只能變更一次。", back: "返回個人中心" },
  ru: { title: "Часовой пояс", auto: "Время устройства", manual: "Выбрать вручную", detected: "Текущий часовой пояс", select: "Выберите часовой пояс", save: "Сохранить", saved: "Часовой пояс сохранён.", wait: "Часовой пояс можно менять раз в 24 часа.", back: "Назад в профиль" },
  th: { title: "เขตเวลา", auto: "ใช้เวลาจากอุปกรณ์", manual: "เลือกด้วยตนเอง", detected: "เขตเวลาปัจจุบัน", select: "เลือกเขตเวลา", save: "บันทึก", saved: "บันทึกเขตเวลาแล้ว", wait: "เปลี่ยนเขตเวลาได้หนึ่งครั้งต่อ 24 ชั่วโมง", back: "กลับไปหน้าโปรไฟล์" },
};

export default function TimezonePage() {
  const { language } = useLanguage();
  const copy = COPY[language];
  const deviceZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [zone, setZone] = useState(deviceZone);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const zones = useMemo(() => Array.from(new Set([deviceZone, zone, ...ZONES])), [deviceZone, zone]);

  useEffect(() => {
    if (!getCurrentUser()) return;
    fetch(`${BACKEND_URL}/user/${getEffectiveUserId()}/preferences`, { headers: getAuthHeaders() })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data) { setMode(data.timezone_mode || "auto"); setZone(data.timezone_name || deviceZone); } })
      .catch(() => {});
  }, [deviceZone]);

  async function save() {
    setSaving(true);
    setMessage("");
    const nextZone = mode === "auto" ? deviceZone : zone;
    try {
      const response = await fetch(`${BACKEND_URL}/user/${getEffectiveUserId()}/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ user_id: getEffectiveUserId(), timezone_name: nextZone, timezone_mode: mode }),
      });
      setMessage(response.ok ? copy.saved : response.status === 429 ? copy.wait : "Error");
      if (response.ok) setZone(nextZone);
    } finally {
      setSaving(false);
    }
  }

  return <div className="page-content">
    <header className="page-header"><div><Link href="/me" className={formStyles.backLink}>{copy.back}</Link><h1 className="page-title">{copy.title}</h1></div></header>
    <div className={formStyles.form}>
      <div className={styles.currentCard}><strong>{zone}</strong><span>{copy.detected} · {new Intl.DateTimeFormat(language, { dateStyle: "full", timeStyle: "short", timeZone: zone }).format(new Date())}</span></div>
      <div className={styles.actions}>
        <button type="button" className={`${styles.modeButton} ${mode === "auto" ? styles.modeButtonActive : ""}`} onClick={() => setMode("auto")}>{copy.auto}</button>
        <button type="button" className={`${styles.modeButton} ${mode === "manual" ? styles.modeButtonActive : ""}`} onClick={() => setMode("manual")}>{copy.manual}</button>
      </div>
      {mode === "manual" && <label className={formStyles.field}><span className={formStyles.label}>{copy.select}</span><select className={formStyles.select} value={zone} onChange={(event) => setZone(event.target.value)}>{zones.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>}
      <p className={formStyles.notice}>{copy.wait}</p>
      <button type="button" className={styles.saveButton} onClick={() => void save()} disabled={saving}>{copy.save}</button>
      {message && <p className={message === copy.saved ? formStyles.successMsg : formStyles.errorMsg}>{message}</p>}
    </div>
  </div>;
}
