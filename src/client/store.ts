"use client";

import { useEffect, useRef, useState } from "react";
import { toUserMessage } from "@/domain/errors";

/**
 * 最小限のデータキャッシュ（stale-while-revalidate）。
 * - 同じキーのデータは画面をまたいで使い回し、即座に表示する
 * - 画面を開く（マウントする）たびに裏で取り直す
 * - 書き込みに成功したら invalidateAll() で表示中のものを全部取り直す
 */
type Entry = { data?: unknown; error?: string; promise?: Promise<void>; updatedAt?: number };

const cache = new Map<string, Entry>();
const listeners = new Set<() => void>();
const active = new Map<string, { fetcher: () => Promise<unknown>; count: number }>();

function emit() {
  for (const l of listeners) l();
}

function load(key: string, fetcher: () => Promise<unknown>) {
  const entry = cache.get(key) ?? {};
  if (entry.promise) return;
  entry.promise = fetcher()
    .then((d) => {
      entry.data = d;
      entry.error = undefined;
    })
    .catch((e: unknown) => {
      entry.error = toUserMessage(e instanceof Error ? e.message : String(e));
    })
    .finally(() => {
      entry.promise = undefined;
      entry.updatedAt = Date.now();
      emit();
    });
  cache.set(key, entry);
}

export function useQuery<T>(key: string | null, fetcher: () => Promise<T>) {
  const [, setTick] = useState(0);
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  useEffect(() => {
    if (!key) return;
    const a = active.get(key);
    active.set(key, { fetcher, count: (a?.count ?? 0) + 1 });
    load(key, fetcher);
    return () => {
      const cur = active.get(key);
      if (!cur) return;
      if (cur.count <= 1) active.delete(key);
      else active.set(key, { ...cur, count: cur.count - 1 });
    };
    // fetcher はキーで識別するので依存に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const entry = key ? cache.get(key) : undefined;
  return {
    data: entry?.data as T | undefined,
    error: entry?.error,
    loading: !!key && entry?.data === undefined && !entry?.error,
    /** この画面を開いてから取り直し済みか（古いキャッシュで判断してはいけない処理用） */
    fresh: !!entry?.updatedAt && entry.updatedAt >= mountedAt.current,
  };
}

/** 書き込み成功後に呼ぶ。表示中のデータは即取り直し、それ以外は次に開いたとき取り直される */
export function invalidateAll() {
  for (const [key, a] of active) load(key, a.fetcher);
}

/** ログアウト時など */
export function clearCache() {
  cache.clear();
  emit();
}

/** 表示中の1つのデータだけ取り直す（未読数の定期確認など） */
export function refresh(key: string) {
  const a = active.get(key);
  if (a) load(key, a.fetcher);
}
