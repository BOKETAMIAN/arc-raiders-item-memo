import { useEffect, useMemo, useState } from 'react';
import type { ArcItem, ItemsPayload } from '../types/item';

export function useItemsData() {
  const [payload, setPayload] = useState<ItemsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('./data/items.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`データ読み込みエラー (${res.status})`);
        }
        return res.json() as Promise<ItemsPayload>;
      })
      .then((data) => {
        if (active) {
          setPayload(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'アイテムデータの読み込みに失敗しました');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const items = useMemo(() => payload?.items ?? [], [payload]);

  const itemMap = useMemo(() => {
    const map = new Map<string, ArcItem>();
    for (const item of items) {
      map.set(item.id, item);
    }
    return map;
  }, [items]);

  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      set.add(item.type);
    }
    return Array.from(set).sort();
  }, [items]);

  return {
    items,
    itemMap,
    availableTypes,
    meta: payload
      ? {
          generatedAt: payload.generatedAt,
          fetchedAt: payload.fetchedAt,
          itemCount: payload.itemCount,
        }
      : null,
    loading,
    error,
  };
}
