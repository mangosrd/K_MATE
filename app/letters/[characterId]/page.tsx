"use client";

import { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BottomNav from "@/components/ui/BottomNav";
import LoadingSplash from "@/components/LoadingSplash";
import { getCharacterById, MOCK_ECONOMY, canAccessCharacter } from "@/lib/db/mock";
import { getAuthHeaders, getEffectiveUserId } from "@/lib/auth/store";
import { useMembership, useFreeCharSlots } from "@/lib/auth/useAuthUser";
import { useLanguage } from "@/components/LanguageContext";
import { substituteTranslations, useTranslationMap, type TranslatableItem } from "@/lib/translate/store";
import styles from "./letters.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const LETTER_COST = 10;

interface Letter {
  id: string;
  character_id: string;
  content: string;
  reply_content: string | null;
  sent_at: string;
  reply_ready_at: string;
  is_read: boolean;
  is_reply_ready: boolean;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function LettersPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = use(params);
  const { language, t } = useLanguage();
  const char = getCharacterById(characterId);
  const { membership, membershipLoaded } = useMembership();
  const { freeSlots, freeSlotsLoaded } = useFreeCharSlots();
  const router = useRouter();
  const canAccess = char ? canAccessCharacter(characterId, membership, freeSlots) : false;

  useEffect(() => {
    if (char?.requires_premium && membershipLoaded && freeSlotsLoaded && !canAccess) {
      router.replace("/premium");
    }
  }, [canAccess, char?.requires_premium, freeSlotsLoaded, membershipLoaded, router]);

  const [letters, setLetters] = useState<Letter[]>([]);
  const [coins, setCoins] = useState(MOCK_ECONOMY.coins);
  const [showCompose, setShowCompose] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const replyTranslationItems = useMemo<TranslatableItem[]>(
    () => letters.flatMap((letter) => letter.reply_content
      ? [{
          text: letter.reply_content,
          contextKo: `${char?.name ?? characterId} 기장이 사용자에게 보낸 편지 답장`,
          force: true,
        }]
      : []),
    [characterId, char?.name, letters]
  );
  const replyTranslationMap = useTranslationMap(replyTranslationItems, language);
  const translateReply = (text: string) => substituteTranslations(text, replyTranslationMap);

  const load = () => {
    const userId = getEffectiveUserId();
    fetch(`${BACKEND_URL}/letters/${userId}/${characterId}`, { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Letter[]) => {
        setLetters(data);
        // 답장이 방금 생성됐을 수도 있으니, 화면에 보여준 김에 읽음 처리한다.
        data.forEach((l) => {
          if (l.is_reply_ready && l.reply_content && !l.is_read) {
            fetch(`${BACKEND_URL}/letters/${l.id}/read`, { method: "POST", headers: getAuthHeaders() }).catch(() => {});
          }
        });
      })
      .catch(() => {});

    fetch(`${BACKEND_URL}/user/${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setCoins(data.coins); })
      .catch(() => {});
  };

  useEffect(load, [characterId]);

  const handleSend = async () => {
    if (!draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/letters/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          user_id: getEffectiveUserId(),
          character_id: characterId,
          content: draft.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? t("letterSendFailedMsg"));
        return;
      }
      setCoins(data.remaining_coins);
      setLetters((prev) => [data.letter, ...prev]);
      setDraft("");
      setShowCompose(false);
    } catch {
      setError(t("serverConnectFailedMsg"));
    } finally {
      setSending(false);
    }
  };

  if (!char) return null;

  // 접근 제어는 반드시 모든 훅 선언 이후, 컴포넌트 로직 마지막에서 체크한다 — 위로
  // 올리면 canAccess가 리렌더링 중 바뀔 때(다른 화면에서 프리미엄/캐릭터 구매 후 돌아왔을
  // 때) 훅 호출 순서가 달라져 "Rendered fewer hooks than expected" 에러가 난다.
  // 목록 페이지(/diary)는 잠긴 캐릭터로 가는 링크를 안 보여주지만, 그건 UI상의 안내일
  // 뿐이고 URL을 직접 치고 들어오면 그대로 뚫려있었다 — 여기서 실제로 막아야 한다.
  // membership/freeSlots는 마운트 직후엔 항상 기본값(무료회원)으로 시작해서 실제 백엔드
  // 조회가 끝나기 전까진, 진짜 프리미엄 회원도 잠깐 🔒 잠금 화면을 봤다가 콘텐츠로 바뀌는
  // 깜빡임이 있었다. 다만 이 대기가 필요한 건 프리미엄 전용 캐릭터일 때뿐이다 — 무료
  // 캐릭터는 membership을 보기도 전에 이미 접근이 허용되므로, 매번(뒤로가기로 재진입할
  // 때마다도) 로딩 화면을 띄우면 불필요한 깜빡임만 새로 생긴다.
  if (char.requires_premium && (!membershipLoaded || !freeSlotsLoaded)) {
    return <LoadingSplash />;
  }

  if (!canAccess) {
    return <LoadingSplash />;
  }

  return (
    <>
      <div className="page-content">
        <header className={styles.header}>
          <Link href={`/diary/${char.id}`} className={styles.backBtn}>‹</Link>
          <div className={styles.headerCenter}>
            <div className={styles.headerAvatar}>
              <Image src={char.avatar_url} alt={char.name} width={36} height={36} className={styles.headerAvatarImg} />
            </div>
            <div>
              <p className={styles.headerName}>{t("mailboxTitle", { name: char.name })}</p>
              <p className={styles.headerSub}>{char.name}&apos;s Mailbox</p>
            </div>
          </div>
          <div className="coin-badge">
            <span className="coin-icon">🪙</span>
            <span>{coins}</span>
          </div>
        </header>

        <div className={styles.inner}>
          <button className={styles.writeBtn} onClick={() => setShowCompose(true)}>
            {t("writeLetterBtn")} ({LETTER_COST}🪙)
          </button>

          {letters.length === 0 ? (
            <div className={styles.empty}>
              <p>💌</p>
              <p>{t("noLettersYet")}</p>
            </div>
          ) : (
            <div className={styles.letterList}>
              {letters.map((letter) => (
                <div
                  key={letter.id}
                  className={`${styles.letterCard} ${letter.is_reply_ready && !letter.is_read ? styles.unread : ""}`}
                >
                  <div className={styles.letterMeta}>
                    <span className={styles.letterDate}>{formatDate(letter.sent_at)}</span>
                    {letter.is_reply_ready && !letter.is_read && <span className={styles.unreadDot} />}
                  </div>
                  <p className={styles.letterLabel}>{t("sentLetterLabel")}</p>
                  <p className={styles.letterContent}>{letter.content}</p>

                  {letter.is_reply_ready && letter.reply_content ? (
                    <div className={styles.replyBox}>
                      <p className={styles.replyLabel}>{t("replyFromLabel", { name: char.name })}</p>
                      <p className={styles.replyContent}>{translateReply(letter.reply_content)}</p>
                    </div>
                  ) : (
                    <div className={styles.waitingBox}>
                      🕊️ {t("waitingReplyMsg")} — {formatDate(letter.reply_ready_at)} {t("checkAfterMsg")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 편지 작성 모달 */}
      {showCompose && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowCompose(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className={styles.modalTitle}>✉️ {t("composeLetterTitle", { name: char.name })}</h2>
            <p className={styles.modalSub}>{t("composeLetterSub")}</p>

            <textarea
              className={styles.letterTextarea}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("composeLetterPlaceholder")}
              maxLength={1000}
            />

            {error && <p style={{ color: "var(--red)", fontSize: 12, marginBottom: 8 }}>{error}</p>}

            <div className={styles.modalCoins}>
              <span>{t("yourCoinsLabel")}</span>
              <span style={{ color: "var(--gold)", fontWeight: 700 }}>🪙 {coins}</span>
            </div>

            <div className={styles.modalActions}>
              <button className={`btn btn-secondary btn-lg ${styles.pillBtn}`} onClick={() => setShowCompose(false)}>
                {t("cancelBtn")}
              </button>
              {coins >= LETTER_COST ? (
                <button
                  className={`btn btn-gold btn-lg ${styles.pillBtn}`}
                  onClick={handleSend}
                  disabled={sending || !draft.trim()}
                >
                  {sending ? t("sendingBtn") : `🪙 ${LETTER_COST} ${t("sendLetterBtn")}`}
                </button>
              ) : (
                <Link href="/coins" className={`btn btn-primary btn-lg ${styles.pillBtn}`}>SHOP</Link>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
