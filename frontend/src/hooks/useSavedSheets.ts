import { useState, useEffect } from 'react';

export interface SheetConfig {
  sheet1Url: string;
  sheet1Name: string;
  sheet2Url: string;
  sheet2Name: string;
  savedAt?: number;
}

const STORAGE_KEY = 'login_assistant_saved_sheets';

const DEFAULT_CONFIG: SheetConfig = {
  sheet1Url: '',
  sheet1Name: 'Sheet 1',
  sheet2Url: '',
  sheet2Name: 'Sheet 2'
};

function load(): SheetConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<SheetConfig>;
    return {
      sheet1Url: parsed.sheet1Url || '',
      sheet1Name: parsed.sheet1Name || 'Sheet 1',
      sheet2Url: parsed.sheet2Url || '',
      sheet2Name: parsed.sheet2Name || 'Sheet 2',
      savedAt: parsed.savedAt
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function useSavedSheets() {
  const [savedSheets, setSavedSheets] = useState<SheetConfig>(load);

  const hasSaved = Boolean(savedSheets.savedAt && (savedSheets.sheet1Url || savedSheets.sheet2Url));

  const saveSheets = (config: Omit<SheetConfig, 'savedAt'>) => {
    const toSave: SheetConfig = {
      ...config,
      savedAt: Date.now()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('Failed to persist sheet config:', e);
    }
    setSavedSheets(toSave);
  };

  const clearSaved = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setSavedSheets(DEFAULT_CONFIG);
  };

  return { savedSheets, hasSaved, saveSheets, clearSaved };
}
