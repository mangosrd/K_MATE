"use client";

import Link from "next/link";
import Image from "next/image";
import BottomNav from "@/components/ui/BottomNav";
import { MOCK_CHARACTERS, MOCK_USER, MOCK_ALL_PROGRESS, canAccessCharacter } from "@/lib/db/mock";
import styles from "./chat-select.module.css";


const REGION_NAMES: Record<string, string> = {
  seoul:        "서울·경기",
  jeonju:       "전주·전라",
  busan:        "부산·경남",
  chungcheong:  "충청·공주",
  jeju:         "제주",
};

export default function ChatSelectPage() {
  const isPremium = MOCK_USER.membership === "premium";

  return (
    <>
      <div className="page-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">대화하기</h1>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
              Chat with your captain
            </p>
          </div>
        </header>

        <div className={styles.inner}>
          {/* 안내 배너 */}
          <div className={styles.banner}>
            <span className={styles.bannerIcon}>✈️</span>
            <div>
              <p className={styles.bannerTitle}>기장님을 선택하세요</p>
              <p className={styles.bannerSub}>Choose your captain · 각 노선 기장과 대화해보세요</p>
            </div>
          </div>

          {/* 캐릭터 그리드 */}
          <div className={styles.charGrid}>
            {MOCK_CHARACTERS.map((char) => {
              const canAccess = canAccessCharacter(
                char.id, MOCK_USER.membership, MOCK_USER.free_character_slots
              );
              const progress = MOCK_ALL_PROGRESS[char.id];
              const affinity = progress?.affinity ?? 0;
              const affinityStars = Math.round(affinity / 20);

              return (
                <div
                  key={char.id}
                  className={`${styles.charCard} ${!canAccess ? styles.charLocked : ""}`}
                  id={`char-card-${char.id}`}
                >
                  {/* 기장 배지 */}
                  <div className={styles.captainBadge}>
                    {canAccess
                      ? <span className="badge badge-blue">✈️ 기장</span>
                      : <span className="badge badge-gold">⭐ 프리미엄</span>}
                  </div>

                  {/* 기장 일러스트 */}
                  <div className={styles.charIconWrap}>
                    <div className={`${styles.charIcon} ${!canAccess ? styles.charIconLocked : ""}`}>
                      <Image
                        src={`/characters/${char.id}.png`}
                        alt={`${char.name} 기장`}
                        width={80}
                        height={80}
                        className={styles.charImg}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <span className={styles.charEmojiBack}>{char.emoji}</span>
                      {!canAccess && <div className={styles.lockOverlay}>🔒</div>}
                    </div>
                  </div>

                  {/* 이름 & 노선 */}
                  <div className={styles.charMeta}>
                    <p className={styles.charName}>{char.name} 기장</p>
                    <p className={styles.charRoute}>
                      🛫 {REGION_NAMES[char.region_id] ?? char.region_id} 노선
                    </p>
                  </div>

                  {/* 호감도 */}
                  {canAccess && (
                    <div className={styles.affinityRow}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} style={{ fontSize: 12 }}>
                          {i < affinityStars ? "❤️" : "🤍"}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 버튼 */}
                  {canAccess ? (
                    <Link
                      href={`/chat/${char.id}`}
                      className={`btn btn-primary btn-sm ${styles.chatBtn}`}
                      id={`btn-chat-${char.id}`}
                    >
                      💬 대화 시작
                    </Link>
                  ) : (
                    <button
                      disabled
                      className={`btn btn-secondary btn-sm ${styles.chatBtn}`}
                      id={`btn-unlock-${char.id}`}
                      style={{ opacity: 0.6, cursor: "not-allowed" }}
                    >
                      🔒 잠금 (프리미엄)
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* 무료 안내 */}
          {!isPremium && (
            <div className={styles.freeNotice}>
              <p className={styles.freeNoticeText}>
                🆓 무료: <strong>규현·하늘</strong> 기장과 대화 가능
              </p>
              <Link href="/premium" className="btn btn-gold btn-sm">
                ⭐ 프리미엄으로 전체 이용
              </Link>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
