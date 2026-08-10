"use client";

import { useState, useEffect } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const CACHE_PREFIX = "kmate_tr_";

// 챕터 콘텐츠(단어 뜻/예문 번역)는 한국어+영어로만 작성돼 있어, UI 언어가 그 외
// 언어일 때 영어가 그대로 노출되는 문제가 있었다. 백엔드 /translate(LLM + DB 캐시)를
// 통해 화면에 보여줄 때만 번역하고, 브라우저에도 한 번 더 캐싱해 같은 세션에서
// 같은 텍스트를 다시 요청하지 않게 한다.
export interface TranslatableItem {
  text: string;
  // 원본 한국어(단어 또는 예문) — 영어 글로스만 단독으로 번역하면 뜻이 모호해서
  // (예: "Rumor" 혼자면 속어로 오역되기 쉬움) 문맥으로 같이 보내면 정확도가 오른다.
  contextKo?: string;
  // 한국어 원문의 편지처럼 영어 화면에서도 번역이 필요한 콘텐츠에 사용한다.
  force?: boolean;
}

function cacheKey(item: TranslatableItem, lang: string): string {
  const raw = item.text + "||" + (item.contextKo ?? "") + "||" + (item.force ? "force" : "normal");
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `${CACHE_PREFIX}${lang}_${hash}`;
}

// 이 언어들만 실제로 번역이 필요하다 — 콘텐츠 원본이 이미 한국어(ko)+영어(en)라
// 그 둘은 번역할 필요가 없다.
// Vocabulary glosses are stored in English, so Korean users need a translated
// gloss too. English remains the source language and does not need a request.
const TRANSLATABLE_LANGS = new Set(["ko", "ru", "zh", "ja", "zh-TW", "th"]);

export async function translateBatch(items: TranslatableItem[], targetLang: string): Promise<string[]> {
  if ((!TRANSLATABLE_LANGS.has(targetLang) && !items.some((item) => item.force)) || typeof window === "undefined") {
    return items.map((i) => i.text);
  }

  const results: (string | null)[] = items.map(() => null);
  const misses: { idx: number; item: TranslatableItem }[] = [];

  items.forEach((item, idx) => {
    if (!item.text) {
      results[idx] = item.text;
      return;
    }
    const cached = localStorage.getItem(cacheKey(item, targetLang));
    if (cached !== null) {
      results[idx] = cached;
    } else {
      misses.push({ idx, item });
    }
  });

  if (misses.length > 0) {
    try {
      const res = await fetch(`${BACKEND_URL}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: misses.map((m) => ({ text: m.item.text, context_ko: m.item.contextKo ?? null })),
          target_lang: targetLang,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        misses.forEach((m, i) => {
          const translated: string = data.translations?.[i] ?? m.item.text;
          results[m.idx] = translated;
          localStorage.setItem(cacheKey(m.item, targetLang), translated);
        });
      }
    } catch {
      // 번역 실패 시 원문(영어)으로 폴백 — 화면이 비는 것보다는 낫다
    }
  }

  return results.map((r, i) => r ?? items[i].text);
}

// 텍스트 배열을 현재 UI 언어로 번역해 보여주는 훅. 번역이 끝나기 전까지는(또는 목록
// 자체가 바뀌는 순간에는) 원문을 그대로 보여주고, 끝나면 번역된 텍스트로 교체한다.
export function useTranslatedTexts(items: TranslatableItem[], targetLang: string): string[] {
  const depKey = targetLang + "::" + items.map((i) => i.text + "|" + (i.contextKo ?? "") + "|" + (i.force ? "1" : "0")).join("");
  const fallback = items.map((i) => i.text);
  const [state, setState] = useState<{ key: string; translated: string[] }>({
    key: depKey,
    translated: fallback,
  });

  useEffect(() => {
    let cancelled = false;
    translateBatch(items, targetLang).then((result) => {
      if (!cancelled) setState({ key: depKey, translated: result });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);

  // depKey가 바뀌었는데 아직 새 번역이 안 왔으면(state.key가 예전 것) 원문을 그대로
  // 보여준다 — 목록이 바뀌었는데 인덱스만 같은 예전 번역 결과를 잘못 매핑해서
  // 보여주는 걸 막기 위함.
  return state.key === depKey ? state.translated : fallback;
}

// 원문(영어) → 번역문 조회용 Map을 만들어주는 훅. 학습 세션처럼 여러 군데서 서로 다른
// 영어 조각(단어 뜻, 예문 번역, 스토리 문장 등)을 키로 찾아 써야 할 때 배열보다 쓰기 편하다.
export function useTranslationMap(items: TranslatableItem[], targetLang: string): Map<string, string> {
  const depKey = targetLang + "::" + items.map((i) => i.text + "|" + (i.contextKo ?? "") + "|" + (i.force ? "1" : "0")).join("");
  const [state, setState] = useState<{ key: string; map: Map<string, string> }>({
    key: depKey,
    map: new Map(),
  });

  useEffect(() => {
    let cancelled = false;
    // 같은 원문이 여러 번 나올 수 있으니(여러 단어가 같은 뜻을 공유하는 경우는 없지만
    // context가 다를 수 있음) 텍스트 기준으로 중복 제거해서 요청한다
    const seen = new Map<string, TranslatableItem>();
    for (const item of items) {
      if (item.text) seen.set(item.text, item);
    }
    const uniqueItems = Array.from(seen.values());

    translateBatch(uniqueItems, targetLang).then((translated) => {
      if (cancelled) return;
      const map = new Map<string, string>();
      uniqueItems.forEach((item, i) => map.set(item.text, translated[i]));
      setState({ key: depKey, map });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);

  return state.key === depKey ? state.map : new Map();
}

// 한국어 서술 안에 영어 조각이 끼워진 혼합 문자열(예: "'단어'의 뜻은 'meaning'입니다.")에서,
// map에 있는 영어 조각만 번역문으로 치환한다. 짧은 조각이 긴 조각의 일부일 수 있으니
// 긴 것부터 치환해서 부분 오치환을 막는다.
export function substituteTranslations(text: string, map: Map<string, string>): string {
  if (map.size === 0) return text;
  let out = text;
  const entries = Array.from(map.entries()).sort((a, b) => b[0].length - a[0].length);
  for (const [en, translated] of entries) {
    if (en && out.includes(en)) out = out.split(en).join(translated);
  }
  return out;
}
