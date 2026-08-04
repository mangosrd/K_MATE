"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "./LanguageContext";
import { MOCK_CHARACTERS, canAccessCharacter } from "@/lib/db/mock";
import styles from "./MateSelectModal.module.css";

interface MateSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMateId: string;
  membership: string;
  freeSlots: string[];
  onSelect: (characterId: string) => void;
}

export default function MateSelectModal({
  isOpen,
  onClose,
  currentMateId,
  membership,
  freeSlots,
  onSelect,
}: MateSelectModalProps) {
  const { t } = useLanguage();
  const router = useRouter();

  if (!isOpen) return null;

  const handlePick = (characterId: string, locked: boolean) => {
    if (locked) {
      onClose();
      router.push("/premium");
      return;
    }
    onSelect(characterId);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>✈️ {t("selectMateTitle")}</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <p className={styles.modalSub}>{t("selectMateSub")}</p>

        <div className={styles.mateList}>
          {MOCK_CHARACTERS.map((char) => {
            const locked = !canAccessCharacter(char.id, membership, freeSlots);
            const selected = char.id === currentMateId;
            return (
              <button
                key={char.id}
                type="button"
                className={`${styles.mateItem} ${selected ? styles.selected : ""} ${locked ? styles.locked : ""}`}
                onClick={() => handlePick(char.id, locked)}
              >
                <span className={styles.mateAvatar}>
                  <Image src={char.avatar_url} alt={char.name} width={44} height={44} className={styles.mateAvatarImg} />
                </span>
                <div className={styles.mateTextWrap}>
                  <span className={styles.mateName}>{char.name}</span>
                  <span className={styles.mateTags}>
                    {locked ? `🔒 ${t("premiumOnly")}` : t(`mateTagline_${char.id}`)}
                  </span>
                </div>
                {selected && !locked && <span className={styles.checkIcon}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
