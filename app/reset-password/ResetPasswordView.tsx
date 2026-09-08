"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { logout } from "@/lib/auth/store";
import styles from "./reset-password.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function ResetPasswordView({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) window.history.replaceState({}, "", "/reset-password");
  }, [token]);

  const submit = async () => {
    setError("");
    if (!token) return setError("재설정 링크가 올바르지 않습니다.");
    if (password.length < 8) return setError("비밀번호는 8자 이상이어야 합니다.");
    if (password !== confirmPassword) return setError("비밀번호가 일치하지 않습니다.");
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || "재설정 링크가 만료되었거나 이미 사용되었습니다.");
      logout();
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "비밀번호를 변경하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.icon} aria-hidden="true">🔐</div>
        <h1>새 비밀번호 설정</h1>
        <p>새 비밀번호를 입력하면 기존 기기의 로그인은 모두 해제됩니다.</p>
        {!success ? (
          <>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="새 비밀번호 (8자 이상)" autoComplete="new-password" />
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submit()} placeholder="새 비밀번호 확인" autoComplete="new-password" />
            {error && <div className={styles.error} role="alert">{error}</div>}
            <button type="button" onClick={submit} disabled={loading}>{loading ? "변경 중…" : "비밀번호 변경"}</button>
          </>
        ) : (
          <>
            <div className={styles.success} role="status">비밀번호가 변경됐어요. 새 비밀번호로 다시 로그인해 주세요.</div>
            <Link href="/login" className={styles.loginLink}>로그인으로 이동</Link>
          </>
        )}
      </section>
    </main>
  );
}
