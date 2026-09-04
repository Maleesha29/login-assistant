import { useState, useEffect } from 'react';
import { SavedItem } from '../types';

const STORAGE_KEY = 'login_assistant_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<SavedItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed: SavedItem[] = JSON.parse(stored);
      // Clean out legacy mock data if present
      const cleaned = parsed.filter(item => item.id !== 'holspin_jili' && item.id !== 'betsdoggy_jili');
      return cleaned;
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to save favorites to localStorage', e);
    }
  }, [favorites]);

  const addFavorite = (company: string, game: string, sheetSource?: string) => {
    if (!company || !game) return;
    const id = `${company.trim().toLowerCase()}_${game.trim().toLowerCase()}`;
    setFavorites((prev) => {
      if (prev.some((item) => item.id === id)) return prev;
      return [
        {
          id,
          company: company.trim(),
          game: game.trim(),
          sheetSource: sheetSource || undefined,
          timestamp: Date.now()
        },
        ...prev
      ];
    });
  };

  const removeFavorite = (idOrCompany: string, game?: string) => {
    const id = game
      ? `${idOrCompany.trim().toLowerCase()}_${game.trim().toLowerCase()}`
      : idOrCompany.trim().toLowerCase();

    setFavorites((prev) => prev.filter((item) => item.id !== id && item.id.toLowerCase() !== id));
  };

  const toggleFavorite = (company: string, game: string, sheetSource?: string) => {
    if (!company || !game) return;
    const id = `${company.trim().toLowerCase()}_${game.trim().toLowerCase()}`;
    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === id);
      if (exists) {
        return prev.filter((item) => item.id !== id);
      } else {
        return [
          {
            id,
            company: company.trim(),
            game: game.trim(),
            sheetSource: sheetSource || undefined,
            timestamp: Date.now()
          },
          ...prev
        ];
      }
    });
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  const isFavorite = (company: string, game: string): boolean => {
    if (!company || !game) return false;
    const id = `${company.trim().toLowerCase()}_${game.trim().toLowerCase()}`;
    return favorites.some((item) => item.id === id);
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
    isFavorite
  };
}
