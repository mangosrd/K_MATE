import Link from "next/link";
import styles from "./legal.module.css";

export const metadata = {
  title: "회원탈퇴 및 개인정보 보관 안내 | K-MATE",
};

export default function LegalPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <Link href="/me" className={styles.backLink}>← 마이페이지로 돌아가기</Link>

        <h1 className={styles.title}>회원탈퇴 및 개인정보 보관 안내</h1>
        <p className={styles.updated}>최종 개정일: 2026년 7월 28일</p>

        <section className={styles.section}>
          <h2 className={styles.heading}>제1조 (목적)</h2>
          <p>
            본 안내는 K-MATE(이하 &ldquo;서비스&rdquo;)를 이용하는 회원이 회원탈퇴를 신청할 경우,
            서비스가 처리하는 개인정보의 파기 및 보관 절차를 규정함을 목적으로 합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>제2조 (회원탈퇴 및 개인정보의 즉시 파기)</h2>
          <p>
            회원이 탈퇴를 신청하면 서비스는 지체 없이 아래 개인 데이터를 데이터베이스에서
            완전히 삭제합니다. 삭제된 데이터는 복구할 수 없습니다.
          </p>
          <ul className={styles.list}>
            <li>학습 진도 및 호감도 기록 (진도, 스탬프, 방문 장소, 연속 학습일)</li>
            <li>캐릭터와의 대화 기억(메모리) 기록</li>
            <li>작성된 여행 일기</li>
            <li>저장된 단어장(어휘 학습) 데이터</li>
            <li>보유 코인 등 재화 데이터</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>제3조 (관계 법령에 따른 정보 보관)</h2>
          <p>
            「전자상거래 등에서의 소비자보호에 관한 법률」 및 같은 법 시행령 제6조는
            결제·거래 기록이 있는 서비스에 대해 다음과 같이 일정 기간 정보를 보관하도록
            정하고 있습니다.
          </p>
          <ul className={styles.list}>
            <li>계약 또는 청약철회 등에 관한 기록 — <strong>5년</strong></li>
            <li>대금결제 및 재화 등의 공급에 관한 기록 — <strong>5년</strong></li>
            <li>소비자의 불만 또는 분쟁처리에 관한 기록 — <strong>3년</strong></li>
            <li>표시·광고에 관한 기록 — <strong>6개월</strong></li>
          </ul>
          <p>
            이에 따라 회원탈퇴 시에도 계정을 식별할 수 있는 최소한의 정보
            (아이디, 이메일, 멤버십/결제 이력, 탈퇴 처리 일시)는 위 보관기간(최대 5년) 동안
            별도로 안전하게 보관되며, 그 외의 학습·대화·일기·단어장 등 서비스 이용 과정에서
            생성된 개인 콘텐츠는 보관 대상에서 제외되어 즉시 삭제됩니다. 보관기간이 경과한
            정보는 지체 없이 파기합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>제4조 (탈퇴 후 재가입 및 로그인 제한)</h2>
          <p>
            탈퇴가 완료된 계정은 비밀번호가 즉시 무효화되어 재로그인이 불가능합니다.
            동일한 이메일로의 재가입 가능 여부는 위 보관기간 및 서비스 운영 정책에 따릅니다.
          </p>
        </section>
      </div>
    </main>
  );
}
