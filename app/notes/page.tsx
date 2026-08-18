"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage, type Language } from "@/components/LanguageContext";
import BottomNav from "@/components/ui/BottomNav";
import { getAuthHeaders, getEffectiveUserId, getPreferredCaptainId } from "@/lib/auth/store";
import { MOCK_CHARACTERS } from "@/lib/db/mock";
import { cancelCaptainNoteComment, scheduleCaptainNoteComment } from "@/lib/notifications/captainNotes";
import styles from "./notes.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type Note = {
  id: string;
  content: string;
  comment_character_id: string;
  comment_content: string | null;
  comment_ready_at: string;
  is_comment_ready: boolean;
  is_comment_read: boolean;
  created_at: string;
};

const COPY: Record<Language, {
  title: string; sub: string; placeholder: string; count: string; submit: string; saving: string;
  empty: string; pending: string; arrived: string; open: string; delete: string; limit: string; back: string;
}> = {
  ko: { title: "기장 메모장", sub: "하고 싶은 말이나 오늘의 마음을 남겨보세요", placeholder: "기장님에게 하고 싶은 말, 오늘 있었던 일, 좋아하는 마음을 자유롭게 적어보세요.", count: "하루 최대 5개 · 500자", submit: "메모 남기기", saving: "메모 접는 중…", empty: "아직 남긴 메모가 없어요.", pending: "기장님이 메모를 읽는 중…", arrived: "새 댓글이 도착했어요", open: "댓글 확인", delete: "삭제", limit: "오늘은 메모를 5개까지 남길 수 있어요.", back: "나로 돌아가기" },
  en: { title: "Captain Notes", sub: "Leave a thought, a story, or something you want to say", placeholder: "Write anything you would like a captain to find…", count: "Up to 5 notes a day · 500 characters", submit: "Leave note", saving: "Folding your note…", empty: "No notes yet.", pending: "A captain is reading your note…", arrived: "A new comment has arrived", open: "Open comment", delete: "Delete", limit: "You can leave up to five notes today.", back: "Back to My Page" },
  ja: { title: "機長メモ", sub: "伝えたいことや今日の気持ちを残してみましょう", placeholder: "機長に伝えたいことを自由に書いてください…", count: "1日5件まで・500文字", submit: "メモを残す", saving: "メモを折りたたみ中…", empty: "まだメモがありません。", pending: "機長がメモを読んでいます…", arrived: "新しいコメントが届きました", open: "コメントを見る", delete: "削除", limit: "今日は5件までメモを残せます。", back: "マイページへ" },
  zh: { title: "机长留言簿", sub: "写下想说的话或今天的心情吧", placeholder: "自由写下想对机长说的话…", count: "每天最多5条・500字", submit: "留下留言", saving: "正在收好留言…", empty: "还没有留言。", pending: "机长正在阅读留言…", arrived: "新评论已到达", open: "查看评论", delete: "删除", limit: "今天最多可以留下5条留言。", back: "返回个人中心" },
  "zh-TW": { title: "機長留言簿", sub: "寫下想說的話或今天的心情吧", placeholder: "自由寫下想對機長說的話…", count: "每天最多5則・500字", submit: "留下留言", saving: "正在收好留言…", empty: "還沒有留言。", pending: "機長正在閱讀留言…", arrived: "新留言已送達", open: "查看留言", delete: "刪除", limit: "今天最多可以留下5則留言。", back: "返回個人中心" },
  ru: { title: "Записки капитану", sub: "Оставьте мысль, историю или то, что хотите сказать", placeholder: "Напишите всё, что хотите сказать капитану…", count: "До 5 записок в день · 500 символов", submit: "Оставить записку", saving: "Складываем записку…", empty: "Записок пока нет.", pending: "Капитан читает записку…", arrived: "Пришёл новый комментарий", open: "Открыть", delete: "Удалить", limit: "Сегодня можно оставить до пяти записок.", back: "В личный кабинет" },
  th: { title: "สมุดโน้ตกัปตัน", sub: "ฝากเรื่องราวหรือความรู้สึกของวันนี้ไว้ได้เลย", placeholder: "เขียนสิ่งที่อยากบอกกัปตันได้อย่างอิสระ…", count: "สูงสุด 5 ข้อต่อวัน · 500 ตัวอักษร", submit: "ฝากโน้ต", saving: "กำลังพับโน้ต…", empty: "ยังไม่มีโน้ต", pending: "กัปตันกำลังอ่านโน้ต…", arrived: "มีความคิดเห็นใหม่แล้ว", open: "เปิดดู", delete: "ลบ", limit: "วันนี้ฝากโน้ตได้สูงสุดห้าข้อ", back: "กลับหน้าของฉัน" },
};

export default function NotesPage() {
  const { language } = useLanguage();
  const copy = COPY[language];
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captainId, setCaptainId] = useState("kyuhyun");

  useEffect(() => {
    const timer = window.setTimeout(() => setCaptainId(getPreferredCaptainId()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const loadNotes = useCallback(async () => {
    try {
      const userId = getEffectiveUserId();
      const res = await fetch(`${BACKEND_URL}/notes/${userId}`, { headers: getAuthHeaders() });
      if (res.ok) setNotes(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotes();
    const timer = window.setInterval(() => void loadNotes(), 60_000);
    return () => window.clearInterval(timer);
  }, [loadNotes]);

  const unreadCount = useMemo(() => notes.filter((note) => note.is_comment_ready && !note.is_comment_read).length, [notes]);

  async function submitNote(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ user_id: getEffectiveUserId(), captain_id: captainId, content: content.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(res.status === 429 ? copy.limit : (data?.detail ?? "Error"));
      setNotes((current) => [data, ...current]);
      void scheduleCaptainNoteComment(data.id, data.comment_ready_at);
      setContent("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function openComment(note: Note) {
    if (!note.is_comment_ready || note.is_comment_read) return;
    const res = await fetch(`${BACKEND_URL}/notes/${note.id}/read`, { method: "POST", headers: getAuthHeaders() });
    if (res.ok) {
      const updated = await res.json();
      setNotes((current) => current.map((item) => item.id === updated.id ? updated : item));
    }
  }

  async function deleteNote(id: string) {
    const res = await fetch(`${BACKEND_URL}/notes/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    if (res.ok) {
      void cancelCaptainNoteComment(id);
      setNotes((current) => current.filter((note) => note.id !== id));
    }
  }

  return (
    <>
      <main className={`page-content ${styles.page}`}>
        <header className={styles.header}>
          <Link href="/me" className={styles.back} aria-label={copy.back}>‹</Link>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>K-MATE PRIVATE LOG</p>
            <h1>{copy.title}</h1>
            <p>{copy.sub}</p>
          </div>
          {unreadCount > 0 && <span className={styles.unread}>{unreadCount}</span>}
        </header>

        <section className={styles.composer}>
          <form onSubmit={submitNote}>
            <label className={styles.captainPickerLabel} htmlFor="note-captain">
              {language === "ko" ? "답장을 받을 기장" : "Captain to reply"}
            </label>
            <select id="note-captain" className={styles.captainPicker} value={captainId} onChange={(event) => setCaptainId(event.target.value)}>
              {MOCK_CHARACTERS.map((captain) => <option key={captain.id} value={captain.id}>{captain.name}</option>)}
            </select>
            <textarea value={content} onChange={(event) => setContent(event.target.value.slice(0, 500))} placeholder={copy.placeholder} rows={5} />
            <div className={styles.composerBottom}>
              <span>{content.length}/500 · {copy.count}</span>
              <button type="submit" disabled={!content.trim() || submitting}>{submitting ? copy.saving : copy.submit}</button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
          </form>
        </section>

        <section className={styles.noteList} aria-live="polite">
          {!loading && notes.length === 0 && <div className={styles.empty}>🛫<p>{copy.empty}</p></div>}
          {notes.map((note) => {
            const captain = MOCK_CHARACTERS.find((item) => item.id === note.comment_character_id) ?? MOCK_CHARACTERS[0];
            return (
              <article key={note.id} className={styles.noteCard}>
                <div className={styles.noteMeta}>
                  <time>{new Intl.DateTimeFormat(language, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(note.created_at))}</time>
                  <button type="button" onClick={() => void deleteNote(note.id)}>{copy.delete}</button>
                </div>
                <p className={styles.noteBody}>{note.content}</p>
                {!note.is_comment_ready ? (
                  <div className={styles.pending}><span className={styles.pendingDots}>•••</span>{copy.pending}</div>
                ) : !note.is_comment_read ? (
                  <button type="button" className={styles.arrived} onClick={() => void openComment(note)}>
                    <Image src={`/characters/${captain.id}.png`} alt="" width={34} height={34} />
                    <span><strong>{copy.arrived}</strong><small>{copy.open}</small></span>
                  </button>
                ) : (
                  <div className={styles.comment}>
                    <Image src={`/characters/${captain.id}.png`} alt={captain.name} width={42} height={42} />
                    <div><strong>{captain.name}</strong><p>{note.comment_content}</p></div>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </main>
      <BottomNav />
    </>
  );
}
