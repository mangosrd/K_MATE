import Link from "next/link";
import styles from "../legal.module.css";

export const metadata = {
  title: "이용약관 | K-MATE",
};

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <Link href="/me" className={styles.backLink}>← 마이페이지로 돌아가기</Link>

        <h1 className={styles.title}>이용약관</h1>
        <p className={styles.updated}>최종 개정일: 2026년 7월 29일</p>

        <section className={styles.section}>
          <h2 className={styles.heading}>제1조 (목적)</h2>
          <p>
            본 약관은 K-MATE(이하 &ldquo;서비스&rdquo;)가 제공하는 한국어 학습 및 여행 콘텐츠
            서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을
            목적으로 합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>제2조 (서비스의 내용)</h2>
          <p>서비스는 다음과 같은 기능을 제공합니다.</p>
          <ul className={styles.list}>
            <li>AI 캐릭터(&ldquo;메이트&rdquo;)와의 대화를 통한 한국어 학습</li>
            <li>지역별 문화 콘텐츠 및 스토리 기반 학습 챕터</li>
            <li>단어장, 학습 진도, 대화 기억, 여행 일기 등 개인화 기능</li>
            <li>무료 이용 범위 및 프리미엄 구독을 통한 확장 이용</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>제3조 (AI 생성 콘텐츠에 대한 안내)</h2>
          <p>
            메이트와의 대화 및 일기는 인공지능(AI) 언어 모델을 통해 실시간으로 생성됩니다.
            생성된 응답은 학습 보조 및 오락 목적의 콘텐츠이며, 사실 관계나 전문적 조언(의료,
            법률, 재정 등)으로서의 정확성을 보장하지 않습니다. 캐릭터의 설정, 성격, 서사는
            모두 가상의 창작물입니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>제4조 (회원의 의무)</h2>
          <ul className={styles.list}>
            <li>타인의 계정을 도용하거나 서비스를 부정하게 이용하지 않습니다.</li>
            <li>서비스 내에서 불법적이거나 타인에게 불쾌감을 주는 내용을 게시하지 않습니다.</li>
            <li>서비스의 안정적 운영을 방해하는 행위(자동화된 비정상 접근 등)를 하지 않습니다.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>제5조 (유료 서비스 및 결제)</h2>
          <p>
            프리미엄 구독은 월 단위로 제공되며, 구독 시 모든 메이트 및 챕터에 대한 접근
            권한이 부여됩니다. 현재 서비스는 개발/데모 단계로, 실제 카드 결제망과
            연동되어 있지 않습니다. 등록된 결제 수단 정보는 실제 청구에 사용되지 않으며,
            카드 전체 번호는 저장하지 않습니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>제6조 (회원 탈퇴)</h2>
          <p>
            회원은 언제든지 마이페이지에서 회원 탈퇴를 신청할 수 있습니다. 탈퇴 시 개인
            데이터 처리 방침은 <Link href="/legal" className={styles.backLink} style={{ marginBottom: 0, display: "inline" }}>회원탈퇴 및 개인정보 보관 안내</Link>를 따릅니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>제7조 (약관의 개정)</h2>
          <p>
            본 약관은 서비스 개선에 따라 개정될 수 있으며, 개정 시 앱 내 공지를 통해
            안내합니다.
          </p>
        </section>
      </div>
    </main>
  );
}
