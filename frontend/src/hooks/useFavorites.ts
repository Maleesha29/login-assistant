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
    if (!idOrCompany) return;
    setFavorites((prev) => {
      if (game) {
        const targetId = `${idOrCompany.trim().toLowerCase()}_${game.trim().toLowerCase()}`;
        return prev.filter((item) => {
          const itemKey = `${(item.company || '').trim().toLowerCase()}_${(item.game || '').trim().toLowerCase()}`;
          return item.id !== targetId && itemKey !== targetId;
        });
      }

      const target = idOrCompany.trim().toLowerCase();
      return prev.filter((item) => {
        const itemId = (item.id || '').trim().toLowerCase();
        const itemKey = `${(item.company || '').trim().toLowerCase()}_${(item.game || '').trim().toLowerCase()}`;
        return itemId !== target && itemKey !== target;
      });
    });
  };

  const toggleFavorite = (company: string, game: string, sheetSource?: string) => {
    if (!company || !game) return;
    const cNorm = company.trim().toLowerCase();
    const gNorm = game.trim().toLowerCase();
    const id = `${cNorm}_${gNorm}`;

    setFavorites((prev) => {
      const exists = prev.some((item) => {
        const itemC = (item.company || '').trim().toLowerCase();
        const itemG = (item.game || '').trim().toLowerCase();
        return item.id === id || (itemC === cNorm && itemG === gNorm);
      });

      if (exists) {
        return prev.filter((item) => {
          const itemC = (item.company || '').trim().toLowerCase();
          const itemG = (item.game || '').trim().toLowerCase();
          return item.id !== id && !(itemC === cNorm && itemG === gNorm);
        });
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
    const cNorm = company.trim().toLowerCase();
    const gNorm = game.trim().toLowerCase();
    const id = `${cNorm}_${gNorm}`;

    return favorites.some((item) => {
      const itemC = (item.company || '').trim().toLowerCase();
      const itemG = (item.game || '').trim().toLowerCase();
      return item.id === id || (itemC === cNorm && itemG === gNorm);
    });
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
