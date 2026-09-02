import React, { useState, useEffect } from 'react';
import { X, Database, Search, Play, Folder } from 'lucide-react';
import { fetchCompanies, fetchGamesForCompany } from '../services/api';
import { AccountPreview } from '../types';

interface SheetDataBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (company: string, game: string, sheetSource?: string) => void;
}

export const SheetDataBrowser: React.FC<SheetDataBrowserProps> = ({
  isOpen,
  onClose,
  onSelectAccount
}) => {
  const [companies, setCompanies] = useState<Array<{ name: string; gameCount: number }>>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [games, setGames] = useState<AccountPreview[]>([]);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen]);

  const loadCompanies = async () => {
    try {
      const data = await fetchCompanies();
      setCompanies(data);
      if (data.length > 0) {
        selectCompany(data[0].name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectCompany = async (company: string) => {
    setSelectedCompany(company);
    try {
      const data = await fetchGamesForCompany(company);
      setGames(data);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const filteredGames = games.filter(
    (g) => g.game.toLowerCase().includes(filter.toLowerCase()) || g.username.toLowerCase().includes(filter.toLowerCase()) || (g.sheetSource && g.sheetSource.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-dark-900 border border-dark-700 rounded-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-700 flex items-center justify-between bg-dark-850">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-accent-cyan" />
            <h2 className="text-base font-bold text-white">Google Sheet Accounts Browser</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-dark-700/80 bg-dark-950/60 overflow-y-auto p-3 space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Company Tabs ({companies.length})
            </div>
            {companies.map((c) => (
              <button
                key={c.name}
                onClick={() => selectCompany(c.name)}
                className={'w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition ' + (
                  selectedCompany === c.name
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-300 hover:bg-dark-800 hover:text-white'
                )}
              >
                <div className="flex items-center space-x-2 truncate">
                  <Folder className="w-3.5 h-3.5 opacity-70" />
                  <span className="truncate">{c.name}</span>
                </div>
                <span className={'text-[10px] px-1.5 py-0.5 rounded-full ' + (
                  selectedCompany === c.name ? 'bg-brand-700 text-brand-100' : 'bg-dark-800 text-slate-400'
                )}>
                  {c.gameCount}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden bg-dark-900">
            <div className="p-3 border-b border-dark-700/80 flex items-center space-x-2">
              <Search className="w-4 h-4 text-slate-500 ml-2" />
              <input
                type="text"
                placeholder={'Filter games or sheets under ' + selectedCompany + '...'}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredGames.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No games found matching filter.
                </div>
              ) : (
                filteredGames.map((game) => (
                  <div
                    key={game.company + '_' + game.game + '_' + (game.sheetSource || '')}
                    className="p-3 rounded-xl bg-dark-850 border border-dark-700/80 flex items-center justify-between hover:border-brand-500/40 transition"
                  >
                    <div className="space-y-0.5 truncate pr-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{game.game}</span>
                        {game.sheetSource && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {game.sheetSource}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">@{game.username}</span>
                      </div>
                      <div className="text-xs text-slate-500 truncate">{game.url}</div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectAccount(game.company, game.game, game.sheetSource);
                        onClose();
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shrink-0 transition"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Select</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
