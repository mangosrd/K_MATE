const STAMP_ROOT = "/icons/kmate-stamps";

const LEARNING_STAMPS = [
  "learning-start",
  "vocab",
  "meaning-match",
  "translation",
  "sentence-build",
  "listening",
  "pronunciation",
  "quiz",
  "hint",
  "replay",
] as const;

export function getChapterStamp(
  chapterId: string,
  state: "default" | "completed" | "locked" = "default",
) {
  if (state === "completed") return `${STAMP_ROOT}/completion.png`;
  if (state === "locked") return `${STAMP_ROOT}/premium-lock.png`;

  const order = Number(chapterId.match(/(\d+)$/)?.[1] ?? 1);
  const stamp = LEARNING_STAMPS[(Math.max(1, order) - 1) % LEARNING_STAMPS.length];
  return `${STAMP_ROOT}/${stamp}.png`;
}

export function getRegionStamp(regionId: string) {
  const regionStamps: Record<string, string> = {
    seoul: "seoul",
    jeonju: "jeonju",
    busan: "busan",
    chungcheong: "chungcheong",
    jeju: "jeju",
  };
  return `${STAMP_ROOT}/${regionStamps[regionId] ?? "learning-start"}.png`;
}
