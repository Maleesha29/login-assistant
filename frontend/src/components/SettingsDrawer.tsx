import React, { useState } from 'react';
import { X, Link2, Monitor, RefreshCw, FileSpreadsheet, Shield, CheckCircle2, Sparkles } from 'lucide-react';
import { BackendStats } from '../types';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stats: BackendStats | null;
  keepBrowserOpen: boolean;
  onToggleKeepBrowserOpen: (val: boolean) => void;
  onRefreshData: (params?: { sheet1Url?: string; sheet1Name?: string; sheet2Url?: string; sheet2Name?: string }) => void;
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
  const [sheet1Url, setSheet1Url] = useState<string>('');
  const [sheet1Name, setSheet1Name] = useState<string>('Sheet 1');
  const [sheet2Url, setSheet2Url] = useState<string>('');
  const [sheet2Name, setSheet2Name] = useState<string>('Sheet 2');

  if (!isOpen) return null;

  const handleConnectSheets = (e: React.FormEvent) => {
    e.preventDefault();
    onRefreshData({
      sheet1Url: sheet1Url.trim(),
      sheet1Name: sheet1Name.trim() || 'Sheet 1',
      sheet2Url: sheet2Url.trim(),
      sheet2Name: sheet2Name.trim() || 'Sheet 2'
    });
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
          {/* Multi Google Sheet Links (Zero GCP) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-400" />
              Connect 2 Google Spreadsheets (Zero Cloud)
            </h3>

            <form onSubmit={handleConnectSheets} className="p-4 rounded-xl bg-dark-850 border border-dark-700/80 space-y-4">
              {/* Sheet 1 */}
              <div className="space-y-2 p-3 rounded-lg bg-dark-900/80 border border-dark-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Google Sheet 1
                  </span>
                  <input
                    type="text"
                    placeholder="Name (e.g. Sheet 1)"
                    value={sheet1Name}
                    onChange={(e) => setSheet1Name(e.target.value)}
                    className="w-28 px-2 py-1 text-[11px] rounded bg-dark-950 border border-dark-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  value={sheet1Url}
                  onChange={(e) => setSheet1Url(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-dark-950 border border-dark-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Sheet 2 */}
              <div className="space-y-2 p-3 rounded-lg bg-dark-900/80 border border-dark-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Google Sheet 2 (Optional)
                  </span>
                  <input
                    type="text"
                    placeholder="Name (e.g. Sheet 2)"
                    value={sheet2Name}
                    onChange={(e) => setSheet2Name(e.target.value)}
                    className="w-28 px-2 py-1 text-[11px] rounded bg-dark-950 border border-dark-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  value={sheet2Url}
                  onChange={(e) => setSheet2Url(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-dark-950 border border-dark-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="text-[11px] text-slate-400 bg-dark-900/90 p-2.5 rounded-lg border border-dark-800 space-y-1">
                <div className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Zero Cloud Setup
                </div>
                <div>In Google Sheets: Click <strong>Share</strong> → set to <strong>"Anyone with the link can view"</strong>, then paste the link(s) above.</div>
              </div>

              <button
                type="submit"
                disabled={isRefreshing}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white transition shadow-md shadow-emerald-900/30"
              >
                <RefreshCw className={'w-3.5 h-3.5 ' + (isRefreshing ? 'animate-spin' : '')} />
                <span>{isRefreshing ? 'Syncing Spreadsheets...' : 'Sync & Load Google Sheets'}</span>
              </button>
            </form>
          </div>

          {/* Current Source Stats */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-brand-400" />
              Spreadsheet Status
            </h3>

            <div className="p-4 rounded-xl bg-dark-850 border border-dark-700/80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Connection Status:</span>
                <span className={'font-bold px-2 py-0.5 rounded ' + (
                  stats?.configured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                )}>
                  {stats?.configured ? 'Connected' : 'Not Connected'}
                </span>
              </div>

              {stats?.sheets && stats.sheets.length > 0 ? (
                <div className="space-y-2 pt-1 border-t border-dark-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Configured Sheets ({stats.sheets.length})
                  </div>
                  {stats.sheets.map((sheet, sIdx) => (
                    <div
                      key={sheet.name + '_' + sIdx}
                      className="p-2.5 rounded-lg bg-dark-900/90 border border-dark-800 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <span className={'w-2 h-2 rounded-full ' + (sIdx === 0 ? 'bg-emerald-400' : 'bg-purple-400')} />
                        <span className="font-bold text-slate-200 truncate">{sheet.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        <strong className="text-slate-200">{sheet.totalCompanies}</strong> tabs •{' '}
                        <strong className="text-slate-200">{sheet.totalAccounts}</strong> accounts
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Spreadsheet Name:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[180px]">
                    {stats?.spreadsheetTitle || 'N/A'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-dark-800">
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
