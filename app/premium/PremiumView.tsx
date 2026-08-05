"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MOCK_CHARACTERS } from "@/lib/db/mock";
import { getCurrentUser, setCurrentUser, getEffectiveUserId } from "@/lib/auth/store";
import { useFreeCharSlots, useMembership } from "@/lib/auth/useAuthUser";
import { useLanguage } from "@/components/LanguageContext";
import {
  isPlayBillingAvailable, initPlayBilling, purchasePremium, purchaseCharacterPack,
  type CharacterPackId,
} from "@/lib/billing/playBilling";
import { purchaseMembershipWeb, purchaseCharacterPackWeb } from "@/lib/billing/portone";
import styles from "./premium.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const PREMIUM_PRICE_KRW = 4900; // backend/routers/billing.py의 PREMIUM_PRICE_KRW와 반드시 일치

const PERKS = [
  { icon: "🧑‍🤝‍🧑", ko: "모든 메이트 이용", key: "perkAllMates" },
  { icon: "📔", ko: "모든 일기 해금 가능", key: "perkAllDiaries" },
  { icon: "📖", ko: "전체 챕터 학습", key: "perkAllChapters" },
  { icon: "🗺️", ko: "모든 지역 탐방", key: "perkAllRegions" },
  { icon: "🪙", ko: "500코인 즉시 지급", key: "perkCoinBonus" },
  { icon: "⭐", ko: "신규 콘텐츠 우선 접근", key: "perkEarlyAccess" },
];

interface CharacterPack {
  product_id: string;
  character_id: string;
  price_krw: number;
  label: string;
}

export default function PremiumView() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const premiumChars = MOCK_CHARACTERS.filter((c) => c.requires_premium);
  const { freeSlots } = useFreeCharSlots();
  const { membership } = useMembership();
  const isAlreadyPremium = membership === "premium";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNativeAndroid = isPlayBillingAvailable();

  // 캐릭터 개별 잠금해제 상품 — 백엔드가 꺼지면 fallback 하드코딩 값을 그대로 유지한다.
  // billing.py의 CHARACTER_PACKS와 반드시 일치해야 한다.
  const FALLBACK_CHAR_PACKS: CharacterPack[] = [
    { product_id: "kmate_character_sunwoo",  character_id: "sunwoo",  price_krw: 2900, label: "차선우 기장님 잠금해제" },
    { product_id: "kmate_character_sangwoo", character_id: "sangwoo", price_krw: 2900, label: "천상우 기장님 잠금해제" },
    { product_id: "kmate_character_yongwoo", character_id: "yongwoo", price_krw: 2900, label: "권용우 기장님 잠금해제" },
  ];

  const [charPacks, setCharPacks] = useState<CharacterPack[]>(FALLBACK_CHAR_PACKS);
  const [unlockedChars, setUnlockedChars] = useState<string[]>(freeSlots);
  const [buyingCharId, setBuyingCharId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/billing/character-packs`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data && data.length > 0) setCharPacks(data); })
      .catch(() => {}); // 실패해도 fallback이 그대로 유지 — 백엔드가 꺼져있어도 UI는 보여줌
  }, []);

  useEffect(() => setUnlockedChars(freeSlots), [freeSlots]);

  // 안드로이드 앱(Play 스토어)에서만 인앱결제 리스너를 연결한다 — 웹에서는 그냥 아무 일도 안 함
  useEffect(() => {
    if (!isNativeAndroid) return;
    initPlayBilling({
      onPremiumVerified: (membership) => {
        // 로그인 계정이면 캐시도 같이 갱신 — 게스트는 로그인 세션이 없으므로 건드리지
        // 않는다(useMembership이 다음 화면에서 백엔드 최신값을 다시 조회해 보여준다).
        const authUser = getCurrentUser();
        if (authUser) setCurrentUser({ ...authUser, membership });
        setLoading(false);
        router.push("/map");
      },
      onCoinsGranted: () => {}, // 이 화면에서는 코인 구매를 안 하므로 무시
      onCharacterUnlocked: (characterId, slots) => {
        setUnlockedChars(slots);
        setBuyingCharId(null);
      },
      onError: (message) => {
        setError(message);
        setLoading(false);
        setBuyingCharId(null);
      },
    });
  }, [isNativeAndroid, router]);

  const handleSubscribe = async () => {
    // 이미 프리미엄인 계정이 또 결제창을 여는 걸 막는다 — 예전엔 이 체크가 없어서
    // 이미 구독 중인 계정이 버튼을 눌러도 아무 반응이 없는 것처럼 보였다.
    if (isAlreadyPremium) return;

    // 로그인 계정이든 게스트든(ensureGuestAccount로 발급된 계정) getEffectiveUserId()가
    // 실제로 백엔드에 존재하는 계정을 가리키므로, 구독 자체는 로그인 여부와 무관하게
    // 진행할 수 있다. 예전엔 로그인 안 했으면 무조건 /login으로 튕겨보냈는데, 게스트
    // 계정 도입 이후로는 그럴 필요가 없어졌다(오히려 버튼이 반응 없는 것처럼 보였다).
    const authUser = getCurrentUser();

    setLoading(true);
    setError(null);

    // 안드로이드 앱: Google Play 결제창을 띄우고, 결제 승인 결과는 initPlayBilling의
    // onVerified/onError 콜백에서 비동기로 처리한다(여기서는 결제창만 연다).
    if (isNativeAndroid) {
      try {
        await purchasePremium();
      } catch {
        setError("결제창을 열 수 없습니다.");
        setLoading(false);
      }
      return;
    }

    // 웹: 포트원(KG이니시스) 결제창을 띄우고, 결제가 실제로 확인되면 백엔드가 승격한다.
    // purchaseMembershipWeb 자체는 예외를 던지지 않도록 만들어뒀지만(lib/billing/portone.ts),
    // 버튼이 "처리 중..."에서 영원히 안 풀리는 사고가 실제로 났던 지점이라 finally로
    // 한 번 더 방어한다.
    try {
      const result = await purchaseMembershipWeb(PREMIUM_PRICE_KRW);
      if (!result.success) {
        setError(result.message);
        return;
      }
      // 로그인 계정이면 캐시도 같이 갱신 — 게스트는 로그인 세션이 없으므로 건드리지
      // 않는다(useMembership이 다음 화면에서 백엔드 최신값을 다시 조회해 보여준다).
      // 예전엔 이 조건 없이 authUser를 그대로 펼쳐써서, 게스트가 구독해도 실제로는
      // 깨진(id/email 없는) 로그인 세션이 만들어져 다른 화면에서 오작동할 수 있었다.
      if (authUser) setCurrentUser({ ...authUser, membership: result.membership });
      router.push("/map");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockCharacter = async (pack: CharacterPack) => {
    if (unlockedChars.includes(pack.character_id)) return;

    setError(null);
    setBuyingCharId(pack.character_id);

    if (isNativeAndroid) {
      try {
        await purchaseCharacterPack(pack.product_id as CharacterPackId);
      } catch {
        setError("결제창을 열 수 없습니다.");
        setBuyingCharId(null);
      }
      return;
    }

    // 웹: 포트원(KG이니시스) 결제창을 띄우고, 결제가 실제로 확인되면 백엔드가 해금한다.
    try {
      const result = await purchaseCharacterPackWeb(pack.product_id, pack.price_krw, pack.label);
      if (result.success) {
        setUnlockedChars(result.freeCharSlots);
      } else {
        setError(result.message);
      }
    } finally {
      setBuyingCharId(null);
    }
  };

  return (
    <main className={styles.page}>
      {/* 상단 배경 */}
      <div className={styles.topBg} aria-hidden="true" />

      <div className={styles.inner}>
        {/* 배지 */}
        <div className={styles.badge}>
          <span>⭐</span>
          <span>K-MATE PREMIUM</span>
        </div>

        <h1 className={styles.title}>더 많은 메이트,<br />더 넓은 한국</h1>
        <p className={styles.subtitle}>Meet more mates, explore all of Korea</p>

        {/* 프리미엄 전용 캐릭터 */}
        <div className={styles.charRow}>
          {premiumChars.map((char) => (
            <div key={char.id} className={styles.charChip}>
              <span className={styles.charEmoji}>
                <Image src={`/characters/${char.id}.png`} alt={char.name} width={48} height={48} className={styles.charEmojiImg} />
              </span>
              <span className={styles.charName}>{char.name}</span>
              <span className={styles.charRegion}>
                {char.region_id === "busan" ? "부산" : char.region_id === "chungcheong" ? "충청" : "제주"}
              </span>
            </div>
          ))}
        </div>

        {/* 혜택 목록 */}
        <div className={styles.perks}>
          {PERKS.map((perk) => (
            <div key={perk.ko} className={styles.perkItem}>
              <span className={styles.perkIcon}>{perk.icon}</span>
              <div>
                <p className={styles.perkKo}>{perk.ko}</p>
                {/* ko UI에서는 아래 줄이 위 줄과 완전히 같은 문장이라 굳이 또 안 보여준다 —
                    다른 언어에서는 번역된 두 번째 줄로 실제 뜻을 전달한다. */}
                {language !== "ko" && <p className={styles.perkEn}>{t(perk.key)}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* 가격 카드 */}
        <div className={styles.priceCard}>
          <div className={styles.priceTop}>
            <div>
              <p className={styles.priceLabel}>{t("monthlySub")}</p>
              <p className={styles.priceAmount}>₩4,900<span className={styles.pricePer}>{t("perMonth")}</span></p>
            </div>
            <div className={styles.priceBadge}>BEST</div>
          </div>
          <p className={styles.priceSub}>{t("cancelAnytime")}</p>
        </div>

        {/* CTA */}
        {error && <p style={{ color: "var(--red)", fontSize: 13, textAlign: "center", fontWeight: 600 }}>{error}</p>}
        <button
          className={styles.ctaBtn}
          id="btn-subscribe"
          onClick={handleSubscribe}
          disabled={loading || isAlreadyPremium}
        >
          {isAlreadyPremium ? t("alreadyPremiumBtn") : loading ? t("processingBtn") : t("startPremiumBtn")}
        </button>
        {!isAlreadyPremium && <p className={styles.ctaSub}>{t("freeTrial")}</p>}

        {/* 구독 대신 캐릭터 하나만 골라서 잠금해제 — 이미 프리미엄이면 어차피 전원
            해금돼있으므로 이 섹션 자체가 의미가 없다(무료 캐릭터만 있던 free_char_slots에
            남아있는 값과 뒤섞여 "안 눌렀는데 해금됨"으로 오해를 살 뿐이라 아예 숨긴다). */}
        {!isAlreadyPremium && charPacks.length > 0 && (
          <section className={styles.characterPacks} aria-label="개별 기장 해금">
            <p className={styles.characterPacksIntro}>
              {t("unlockJustOneIntro")}
            </p>
            <div className={styles.characterPacksList}>
              {charPacks.map((pack) => {
                const char = MOCK_CHARACTERS.find((c) => c.id === pack.character_id);
                const isUnlocked = unlockedChars.includes(pack.character_id);
                return (
                  <div
                    key={pack.product_id}
                    className={styles.characterPack}
                  >
                    <div className={styles.characterPackInfo}>
                      {char && (
                        <Image src={`/characters/${char.id}.png`} alt={char.name} width={32} height={32} style={{ borderRadius: "50%" }} />
                      )}
                      <span className={styles.characterPackName}>{char ? char.name : pack.label}</span>
                    </div>
                    {isUnlocked ? (
                      <span className={styles.characterPackUnlocked}>{t("unlockedLabel")}</span>
                    ) : (
                      <button
                        className={`btn btn-secondary btn-sm ${styles.characterPackButton}`}
                        onClick={() => handleUnlockCharacter(pack)}
                        disabled={buyingCharId === pack.character_id}
                      >
                        {buyingCharId === pack.character_id ? t("processingBtn") : `₩${pack.price_krw.toLocaleString()}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <Link href="/map" className="btn btn-ghost" style={{ textAlign: "center", marginTop: 16 }}>
          {t("laterBtn")}
        </Link>
      </div>
    </main>
  );
}
