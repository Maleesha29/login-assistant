import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SearchBox } from './components/SearchBox';
import { AccountPreview } from './components/AccountPreview';
import { AutomationStatusModal } from './components/AutomationStatusModal';
import { RecentLogins } from './components/RecentLogins';
import { FavoritesList } from './components/FavoritesList';
import { SettingsDrawer } from './components/SettingsDrawer';
import { SheetDataBrowser } from './components/SheetDataBrowser';
import { useRecentLogins } from './hooks/useRecentLogins';
import { useFavorites } from './hooks/useFavorites';
import { useSavedSheets } from './hooks/useSavedSheets';
import {
  fetchStatus,
  searchAccounts,
  getAccountDetails,
  refreshSheetData,
  triggerLoginAutomation
} from './services/api';
import {
  SearchSuggestion,
  AccountPreview as AccountPreviewType,
  BackendStats,
  AutomationProgressEvent
} from './types';
import { Sparkles } from 'lucide-react';

export function App() {
  const [query, setQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountPreviewType | null>(null);

  const [stats, setStats] = useState<BackendStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSyncSuccess, setIsSyncSuccess] = useState<boolean>(false);
  const [keepBrowserOpen, setKeepBrowserOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isBrowserOpen, setIsBrowserOpen] = useState<boolean>(false);

  const [isAutomating, setIsAutomating] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentEvent, setCurrentEvent] = useState<AutomationProgressEvent | null>(null);
  const [eventHistory, setEventHistory] = useState<AutomationProgressEvent[]>([]);

  const { recents, addRecent, clearRecents } = useRecentLogins();
  const { favorites, toggleFavorite, isFavorite, removeFavorite, clearFavorites } = useFavorites();
  const { savedSheets } = useSavedSheets();

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await fetchStatus();
      setStats(data.stats);
    } catch (e) {
      console.warn('Failed to load initial status', e);
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await searchAccounts(query);
        setSuggestions(results);
      } catch (e) {
        console.error('Search error', e);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchSubmit = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    try {
      const trimmed = searchQuery.trim();
      const parts = trimmed.split(/\s+/);
      let company = parts[0];
      let game = parts.slice(1).join(' ');
      let sheetSource: string | undefined = undefined;

      if (!game && suggestions.length > 0) {
        company = suggestions[0].company;
        game = suggestions[0].game;
        sheetSource = suggestions[0].sheetSource;
      }

      const account = await getAccountDetails(company, game, sheetSource);
      setSelectedAccount(account);
      setSuggestions([]);
      startLoginForAccount(account);
    } catch (err: any) {
      if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      } else {
        alert(err.message || 'Could not find matching Company and Game.');
      }
    }
  };

  const handleSelectSuggestion = async (suggestion: SearchSuggestion) => {
    try {
      setQuery(suggestion.company + ' ' + suggestion.game);
      setSuggestions([]);
      const account = await getAccountDetails(suggestion.company, suggestion.game, suggestion.sheetSource);
      setSelectedAccount(account);
      startLoginForAccount(account);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSelectSaved = async (company: string, game: string, sheetSource?: string) => {
    try {
      setQuery(company + ' ' + game);
      setSuggestions([]);
      const account = await getAccountDetails(company, game, sheetSource);
      setSelectedAccount(account);
      startLoginForAccount(account);
    } catch (err: any) {
      alert(err.message || 'Could not load account from history');
    }
  };

  const startLoginForAccount = async (account: AccountPreviewType) => {
    setIsAutomating(true);
    setIsModalOpen(true);
    setEventHistory([]);
    const sheetPrefix = account.sheetSource ? ` [${account.sheetSource}]` : '';
    setCurrentEvent({
      step: 'INIT',
      message: `Initializing login for ${account.company} / ${account.game}${sheetPrefix}...`,
      progressPercent: 5,
      timestamp: new Date().toISOString()
    });

    addRecent(account.company, account.game);

    try {
      await triggerLoginAutomation(
        account.company,
        account.game,
        (event) => {
          setCurrentEvent(event);
          setEventHistory((prev) => [...prev, event]);
        },
        { keepBrowserOpen, sheetSource: account.sheetSource }
      );
    } catch (err: any) {
      console.error('Automation error:', err);
    } finally {
      setIsAutomating(false);
    }
  };

  const handleManualRefresh = async (params?: any) => {
    setIsRefreshing(true);
    try {
      const payload = params || (savedSheets.sheet1Url || savedSheets.sheet2Url ? savedSheets : undefined);
      const res = await refreshSheetData(payload);
      setStats(res.stats);
      setIsSyncSuccess(true);
      setTimeout(() => setIsSyncSuccess(false), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to sync with Google Sheets');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-slate-100">
      <Header
        stats={stats}
        onRefresh={() => handleManualRefresh()}
        isRefreshing={isRefreshing}
        isSyncSuccess={isSyncSuccess}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBrowser={() => setIsBrowserOpen(true)}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center justify-start space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Local Gaming Account Automation</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            LOGIN ASSISTANT
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
            Type <strong className="text-slate-200">Company + Game</strong> and press <strong className="text-brand-400">ENTER</strong> to log in automatically.
          </p>
        </div>

        <div className="w-full max-w-2xl">
          <SearchBox
            value={query}
            onChange={setQuery}
            onSubmit={handleSearchSubmit}
            suggestions={suggestions}
            onSelectSuggestion={handleSelectSuggestion}
            isLoading={isSearching}
          />
        </div>

        {selectedAccount && (
          <div className="w-full max-w-2xl">
            <AccountPreview
              account={selectedAccount}
              onStartLogin={() => startLoginForAccount(selectedAccount)}
              isFavorite={isFavorite(selectedAccount.company, selectedAccount.game)}
              onToggleFavorite={() => toggleFavorite(selectedAccount.company, selectedAccount.game)}
              isLoggingIn={isAutomating}
              onSelectFallback={(comp, gm) => handleSelectSaved(comp, gm)}
            />
          </div>
        )}

        <div className="w-full max-w-2xl space-y-8 pt-4">
          <FavoritesList
            favorites={favorites}
            onSelect={handleSelectSaved}
            onRemove={removeFavorite}
            onClear={clearFavorites}
          />

          <RecentLogins
            recents={recents}
            onSelect={handleSelectSaved}
            onClear={clearRecents}
          />
        </div>
      </main>

      <footer className="py-6 border-t border-dark-800/60 text-center text-xs text-slate-500">
        <p>Login Assistant • Local Only • Playwright Chromium • Direct Google Sheets (Zero Cloud)</p>
      </footer>

      <AutomationStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentEvent={currentEvent}
        history={eventHistory}
        company={selectedAccount?.company || ''}
        game={selectedAccount?.game || ''}
        sheetSource={selectedAccount?.sheetSource}
      />

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        stats={stats}
        keepBrowserOpen={keepBrowserOpen}
        onToggleKeepBrowserOpen={setKeepBrowserOpen}
        onRefreshData={(params) => handleManualRefresh(params)}
        isRefreshing={isRefreshing}
      />

      <SheetDataBrowser
        isOpen={isBrowserOpen}
        onClose={() => setIsBrowserOpen(false)}
        onSelectAccount={(comp, gm, sheet) => handleSelectSaved(comp, gm, sheet)}
      />
    </div>
  );
}
