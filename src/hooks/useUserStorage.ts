import { useCallback, useEffect, useState } from 'react';
import type { Disposition, UserItemNote, UserStorageState } from '../types/item';

const STORAGE_KEY = 'arc-raiders-item-memo-v1';

const DEFAULT_STATE: UserStorageState = {
  notes: {},
  needsIds: [],
};

function loadInitialState(): UserStorageState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<UserStorageState>;
    return {
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
      needsIds: Array.isArray(parsed.needsIds) ? parsed.needsIds : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useUserStorage() {
  const [state, setState] = useState<UserStorageState>(loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
  }, [state]);

  const getNote = useCallback(
    (itemId: string): UserItemNote => {
      return (
        state.notes[itemId] ?? {
          disposition: 'unset',
          memo: '',
          updatedAt: '',
        }
      );
    },
    [state.notes]
  );

  const setDisposition = useCallback((itemId: string, disposition: Disposition) => {
    setState((prev) => {
      const current = prev.notes[itemId] ?? { disposition: 'unset', memo: '', updatedAt: '' };
      const nextDisposition = current.disposition === disposition ? 'unset' : disposition;
      const updated: UserItemNote = {
        ...current,
        disposition: nextDisposition,
        updatedAt: new Date().toISOString(),
      };
      const nextNotes = { ...prev.notes };
      if (updated.disposition === 'unset' && !updated.memo.trim()) {
        delete nextNotes[itemId];
      } else {
        nextNotes[itemId] = updated;
      }
      return { ...prev, notes: nextNotes };
    });
  }, []);

  const setMemo = useCallback((itemId: string, memo: string) => {
    setState((prev) => {
      const current = prev.notes[itemId] ?? { disposition: 'unset', memo: '', updatedAt: '' };
      const updated: UserItemNote = {
        ...current,
        memo,
        updatedAt: new Date().toISOString(),
      };
      const nextNotes = { ...prev.notes };
      if (updated.disposition === 'unset' && !updated.memo.trim()) {
        delete nextNotes[itemId];
      } else {
        nextNotes[itemId] = updated;
      }
      return { ...prev, notes: nextNotes };
    });
  }, []);

  const toggleNeed = useCallback((itemId: string) => {
    setState((prev) => {
      const exists = prev.needsIds.includes(itemId);
      const needsIds = exists
        ? prev.needsIds.filter((id) => id !== itemId)
        : [...prev.needsIds, itemId];
      return { ...prev, needsIds };
    });
  }, []);

  const exportJson = useCallback(() => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importJson = useCallback((jsonStr: string): { ok: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonStr) as Partial<UserStorageState>;
      if (!parsed || typeof parsed !== 'object') {
        return { ok: false, message: '不正なJSON形式です。' };
      }
      const nextState: UserStorageState = {
        notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
        needsIds: Array.isArray(parsed.needsIds)
          ? parsed.needsIds.filter((id): id is string => typeof id === 'string')
          : [],
      };
      setState(nextState);
      return {
        ok: true,
        message: `メモ ${Object.keys(nextState.notes).length} 件、ニーズ ${nextState.needsIds.length} 件を読み込みました。`,
      };
    } catch {
      return { ok: false, message: 'JSONの解析に失敗しました。ファイル内容を確認してください。' };
    }
  }, []);

  const resetAll = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  return {
    notes: state.notes,
    needsIds: state.needsIds,
    getNote,
    setDisposition,
    setMemo,
    toggleNeed,
    exportJson,
    importJson,
    resetAll,
  };
}
