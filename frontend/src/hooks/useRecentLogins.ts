import { useState, useEffect } from 'react';
import { SavedItem } from '../types';

const STORAGE_KEY = 'login_assistant_recent_logins';
const MAX_RECENTS = 10;

export function useRecentLogins() {
  const [recents, setRecents] = useState<SavedItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recents));
    } catch (e) {
      console.warn('Failed to save recent logins to localStorage', e);
    }
  }, [recents]);

  const addRecent = (company: string, game: string, sheetSource?: string) => {
    const id = (company.toLowerCase() + '_' + game.toLowerCase());
    setRecents((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      return [
        { id, company, game, sheetSource, timestamp: Date.now() },
        ...filtered
      ].slice(0, MAX_RECENTS);
    });
  };

  const removeRecent = (id: string) => {
    setRecents((prev) => prev.filter((item) => item.id !== id));
  };

  const clearRecents = () => {
    setRecents([]);
  };

  return { recents, addRecent, removeRecent, clearRecents };
}
