import { useState, useEffect } from 'react';
import { SavedItem } from '../types';

const STORAGE_KEY = 'login_assistant_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<SavedItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [
        { id: 'holspin_jili', company: 'HOLSPIN', game: 'JILI', timestamp: Date.now() },
        { id: 'betsdoggy_jili', company: 'BETSDOGGY', game: 'JILI', timestamp: Date.now() }
      ];
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

  const toggleFavorite = (company: string, game: string) => {
    const id = (company.toLowerCase() + '_' + game.toLowerCase());
    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === id);
      if (exists) {
        return prev.filter((item) => item.id !== id);
      } else {
        return [{ id, company, game, timestamp: Date.now() }, ...prev];
      }
    });
  };

  const isFavorite = (company: string, game: string): boolean => {
    const id = (company.toLowerCase() + '_' + game.toLowerCase());
    return favorites.some((item) => item.id === id);
  };

  return { favorites, toggleFavorite, isFavorite };
}
