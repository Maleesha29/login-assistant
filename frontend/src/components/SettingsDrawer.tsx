import React, { useState } from 'react';
import { X, Link2, Monitor, RefreshCw, FileSpreadsheet, Shield, CheckCircle2, Sparkles } from 'lucide-react';
import { BackendStats } from '../types';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stats: BackendStats | null;
  keepBrowserOpen: boolean;
  onToggleKeepBrowserOpen: (val: boolean) => void;
  onRefreshData: (sheetUrl?: string) => void;
  isRefreshing: boolean;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  stats,
  keepBrowserOpen,
  onToggleKeepBrowserOpen,
  onRefreshData,
  isRefreshing
}) => {
  const [sheetInput, setSheetInput] = useState<string>('');

  if (!isOpen) return null;

  const handleConnectSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (sheetInput.trim()) {
      onRefreshData(sheetInput.trim());
    } else {
      onRefreshData();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in">
      <div className="w-full max-w-md bg-dark-900 border-l border-dark-700/80 h-full p-6 flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-dark-700/80">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-bold text-white">Application Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Sections */}
        <div className="py-6 space-y-6 flex-1">
          {/* Direct Google Sheet Link (Zero GCP) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-400" />
              Connect Google Spreadsheet (Zero Cloud Setup)
            </h3>

            <form onSubmit={handleConnectSheet} className="p-4 rounded-xl bg-dark-850 border border-dark-700/80 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Google Sheet URL or Spreadsheet ID
                </label>
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  value={sheetInput}
                  onChange={(e) => setSheetInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-dark-950 border border-dark-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="text-[11px] text-slate-400 bg-dark-900/90 p-2.5 rounded-lg border border-dark-800 space-y-1">
                <div className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> No Google Cloud required!
                </div>
                <div>In Google Sheets: Click <strong>Share</strong> → change to <strong>"Anyone with the link can view"</strong>, then paste the link above and click sync.</div>
              </div>

              <button
                type="submit"
                disabled={isRefreshing}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white transition shadow-md shadow-emerald-900/30"
              >
                <RefreshCw className={'w-3.5 h-3.5 ' + (isRefreshing ? 'animate-spin' : '')} />
                <span>{isRefreshing ? 'Syncing Spreadsheet...' : 'Sync & Load Google Sheet'}</span>
              </button>
            </form>
          </div>

          {/* Current Source Stats */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-brand-400" />
              Spreadsheet Status
            </h3>

            <div className="p-4 rounded-xl bg-dark-850 border border-dark-700/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Mode:</span>
                <span className={'font-bold px-2 py-0.5 rounded ' + (
                  stats?.isMockData ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                )}>
                  {stats?.isMockData ? 'Mock Offline Dataset' : 'Live Google Sheet'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Spreadsheet Name:</span>
                <span className="text-slate-200 font-medium truncate max-w-[180px]">
                  {stats?.spreadsheetTitle || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Indexed Companies (Tabs):</span>
                <span className="text-slate-200 font-bold">{stats?.totalCompanies || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Game Accounts:</span>
                <span className="text-slate-200 font-bold">{stats?.totalAccounts || 0}</span>
              </div>
            </div>
          </div>

          {/* Browser Automation Options */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-accent-cyan" />
              Browser Automation (Playwright)
            </h3>

            <div className="p-4 rounded-xl bg-dark-850 border border-dark-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Keep Browser Open</div>
                  <div className="text-xs text-slate-400">Leave Chromium open after logging in</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepBrowserOpen}
                    onChange={(e) => onToggleKeepBrowserOpen(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              <div className="text-xs text-slate-400 bg-dark-900 p-2.5 rounded-lg border border-dark-750">
                <div className="font-semibold text-slate-300">Headed Mode Active</div>
                <div>Chromium opens on your screen so you can observe the login and start gaming.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-dark-700/80">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
