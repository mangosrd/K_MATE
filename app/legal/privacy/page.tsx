import Link from "next/link";
import styles from "../legal.module.css";

export const metadata = {
  title: "개인정보처리방침 | K-MATE",
};

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <Link href="/me" className={styles.backLink}>← 마이페이지로 돌아가기</Link>

        <h1 className={styles.title}>개인정보처리방침</h1>
        <p className={styles.updated}>최종 개정일: 2026년 7월 29일</p>

        <section className={styles.section}>
          <h2 className={styles.heading}>1. 수집하는 개인정보 항목</h2>
          <ul className={styles.list}>
            <li>계정 정보: 이름, 이메일, 비밀번호(암호화 저장), 선호 언어</li>
            <li>학습·이용 기록: 학습 진도, 호감도, 방문 장소, 연속 학습일, 단어장</li>
            <li>생성 콘텐츠: 메이트와의 대화 기억(메모리), 여행 일기</li>
            <li>재화 정보: 보유 코인, 멤버십(무료/프리미엄) 상태</li>
            <li>결제 수단(시뮬레이션): 카드 브랜드, 카드 번호 끝 4자리 — 카드 전체 번호는 저장하지 않습니다</li>
            <li>고객 지원: 문의 시 남기신 이름, 이메일, 문의 내용</li>
            <li>환경설정: 알림 수신 여부, 화면 테마(라이트/다크)</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>2. 개인정보의 이용 목적</h2>
          <ul className={styles.list}>
            <li>회원 식별 및 로그인, 서비스 부정이용 방지</li>
            <li>메이트와의 대화 생성 및 개인화된 학습 콘텐츠(일기, 단어 추천) 제공</li>
            <li>학습 진도·호감도 등 서비스 이용 기록의 저장 및 표시</li>
            <li>고객 문의 응대</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>3. AI(인공지능) 처리에 관한 안내</h2>
          <p>
            메이트와 나눈 대화 내용은 응답 생성을 위해 외부 AI 언어모델 제공업체(Google Gemini)의
            API로 전송되어 처리됩니다. 전송되는 내용은 대화 맥락(최근 메시지)과 캐릭터
            설정에 한정되며, 이 정보는 응답 생성 목적 외에 별도로 이용되지 않습니다. 일기
            생성 기능 또한 동일한 방식으로 대화 내용을 바탕으로 AI가 문장을 생성합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>4. 개인정보의 보유 및 이용 기간</h2>
          <p>
            회원 탈퇴 시 학습 진도, 대화 기억, 일기, 단어장, 코인 등 개인 콘텐츠는 즉시
            완전 삭제됩니다. 다만 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라
            결제·거래 관련 식별 정보(아이디, 이메일, 멤버십 이력)는 탈퇴 후 최대 5년간
            별도 보관 후 파기됩니다. 자세한 내용은{" "}
            <Link href="/legal" style={{ color: "inherit", textDecoration: "underline" }}>
              회원탈퇴 및 개인정보 보관 안내
            </Link>
            를 참고해 주세요.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>5. 개인정보의 제3자 제공</h2>
          <p>
            서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 대화
            응답 생성을 위해 제3조에 명시된 AI 언어모델 제공업체에 한해 대화 내용이
            전송됩니다. 결제 대행사, 광고 목적의 정보 판매는 이루어지지 않습니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>6. 이용자의 권리</h2>
          <p>
            이용자는 마이페이지의 &ldquo;개인정보 변경&rdquo;에서 이름·이메일을 직접
            수정할 수 있으며, &ldquo;회원 탈퇴&rdquo;를 통해 언제든지 동의를 철회하고
            개인정보 삭제를 요청할 수 있습니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>7. 문의</h2>
          <p>
            개인정보 처리와 관련한 문의는 마이페이지의{" "}
            <Link href="/support" style={{ color: "inherit", textDecoration: "underline" }}>
              고객 지원
            </Link>
            을 통해 남겨주세요.
          </p>
        </section>
      </div>
    </main>
  );
}
