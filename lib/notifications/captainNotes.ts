import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const CHANNEL_ID = "captain-note-comments";

export function captainNoteNotificationId(noteId: string): number {
  let hash = 0;
  for (let index = 0; index < noteId.length; index += 1) {
    hash = ((hash << 5) - hash + noteId.charCodeAt(index)) | 0;
  }
  return Math.abs(hash || 1);
}

function nativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export async function scheduleCaptainNoteComment(noteId: string, readyAt: string): Promise<void> {
  if (!nativeAndroid()) return;

  const permission = await LocalNotifications.checkPermissions();
  const resolved = permission.display === "prompt"
    ? await LocalNotifications.requestPermissions()
    : permission;
  if (resolved.display !== "granted") return;

  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: "기장 메모 댓글",
    description: "기장님이 메모에 댓글을 남기면 알려드려요.",
    importance: 4,
    visibility: 1,
    vibration: true,
  });

  // Railway stores these timestamps as UTC without a trailing timezone marker.
  const normalized = /(?:Z|[+-]\d\d:\d\d)$/.test(readyAt) ? readyAt : `${readyAt}Z`;
  const at = new Date(normalized);
  if (Number.isNaN(at.getTime())) return;

  await LocalNotifications.schedule({
    notifications: [{
      id: captainNoteNotificationId(noteId),
      title: "K-MATE",
      body: "기장님이 메모장에 댓글을 달았어요!",
      schedule: { at: new Date(Math.max(at.getTime(), Date.now() + 1_000)), allowWhileIdle: true },
      channelId: CHANNEL_ID,
      extra: { type: "captain-note-comment", noteId },
    }],
  });
}

export async function cancelCaptainNoteComment(noteId: string): Promise<void> {
  if (!nativeAndroid()) return;
  await LocalNotifications.cancel({ notifications: [{ id: captainNoteNotificationId(noteId) }] });
}
