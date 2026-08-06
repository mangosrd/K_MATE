"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../legal.module.css";

export default function DeleteAccountPage() {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          ‹ K-MATE 홈으로
        </Link>
        <h1 className={styles.title}>계정 및 데이터 삭제 요청</h1>
        <p className={styles.subtitle}>Account & Data Deletion Request</p>
      </header>

      <section className={styles.card}>
        <div className={styles.section}>
          <h2>📌 K-MATE 계정 삭제 정책</h2>
          <p>
            K-MATE(케이메이트)는 사용자의 개인정보 보호 및 데이터 소유권을 존중합니다.
            앱을 삭제하신 경우에도 본 웹페이지를 통해 계정 삭제 및 개인정보 파기를 요청하실 수 있습니다.
          </p>
        </div>

        <div className={styles.section}>
          <h2>🗑️ 삭제되는 데이터 범위</h2>
          <ul>
            <li><strong>계정 정보:</strong> 프로필 이름, 이메일 주소, 소셜 로그인 식별값</li>
            <li><strong>대화 및 학습 데이터:</strong> 5인 기장과의 대화 기록, 학습 진도, 스트릭, 단어장 저장 내역</li>
            <li><strong>활동 기록:</strong> 여행 일기, 갤러리 사진 해금 내역, 코인 및 가상 재화 정보</li>
          </ul>
          <p className={styles.notice}>
            ※ 계정 삭제 처리 시 모든 데이터는 즉시 또는 법령 보존 기간 후 완전히 파기되며 복구가 불가능합니다.
          </p>
        </div>

        <div className={styles.section}>
          <h2>📱 앱 내에서 직접 삭제하는 방법</h2>
          <ol>
            <li>K-MATE 앱 실행 후 <strong>마이페이지(Me)</strong> 이동</li>
            <li><strong>보안 설정(Security)</strong> 메뉴 선택</li>
            <li>하단의 <strong>[계정 삭제]</strong> 버튼 클릭 후 확인</li>
          </ol>
        </div>

        <hr className={styles.divider} />

        <div className={styles.section}>
          <h2>🌐 웹을 통한 계정 삭제 신청 양식</h2>
          <p>앱을 설치하지 않았거나 접속할 수 없는 경우 아래 양식을 제출해 주세요.</p>

          {submitted ? (
            <div className={styles.successBox}>
              <h3>✅ 계정 삭제 요청이 접수되었습니다.</h3>
              <p>
                입력하신 이메일(<strong>{email}</strong>)로 확인 및 삭제 절차가 진행되며, 영업일 기준 1~3일 이내에 계정이 영구 삭제 처리됩니다.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="delete-email">가입한 이메일 주소 (Email)</label>
                <input
                  id="delete-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="delete-reason">삭제 사유 (선택 사항)</label>
                <textarea
                  id="delete-reason"
                  rows={3}
                  placeholder="계정을 삭제하시는 사유를 남겨주시면 서비스 개선에 도움이 됩니다."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={styles.textarea}
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "12px" }}>
                {loading ? "처리 중..." : "계정 및 모든 데이터 삭제 요청 제출"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
