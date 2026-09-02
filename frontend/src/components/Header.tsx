import React from 'react';
import { Shield, RefreshCw, Sliders, Database } from 'lucide-react';
import { BackendStats } from '../types';

interface HeaderProps {
  stats: BackendStats | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenSettings: () => void;
  onOpenBrowser: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  onRefresh,
  isRefreshing,
  onOpenSettings,
  onOpenBrowser
}) => {
  return (
    <header className="border-b border-dark-700/60 bg-dark-900/60 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-cyan p-0.5 shadow-lg shadow-brand-500/20">
            <div className="w-full h-full bg-dark-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-brand-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                LOGIN ASSISTANT
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30">
                Local Only
              </span>
            </div>
            <p className="text-xs text-slate-400">Google Sheets + Playwright Automation</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {stats && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-dark-850/80 border border-dark-700 text-xs">
              <div className={'w-2 h-2 rounded-full ' + (stats.configured ? 'bg-accent-emerald' : 'bg-rose-500')} />
              <span className="text-slate-300 font-medium">
                {stats.sheets && stats.sheets.length > 1
                  ? `${stats.sheets.length} Sheets Connected`
                  : stats.configured
                  ? 'Google Sheet Connected'
                  : 'No Sheet Connected'}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">
                <strong className="text-slate-200">{stats.totalCompanies}</strong> tabs /{' '}
                <strong className="text-slate-200">{stats.totalAccounts}</strong> accounts
              </span>
            </div>
          )}

          <button
            onClick={onOpenBrowser}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-800/80 hover:bg-dark-700 text-slate-300 hover:text-white border border-dark-700 transition text-xs font-medium"
            title="Browse all Companies and Games"
          >
            <Database className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="hidden md:inline">Browse Accounts</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-800/80 hover:bg-dark-700 disabled:opacity-50 text-slate-300 hover:text-white border border-dark-700 transition text-xs font-medium"
            title="Reload Google Sheets Data"
          >
            <RefreshCw className={'w-3.5 h-3.5 text-brand-400 ' + (isRefreshing ? 'animate-spin' : '')} />
            <span className="hidden md:inline">Refresh Data</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-dark-800/80 hover:bg-dark-700 text-slate-300 hover:text-white border border-dark-700 transition"
            title="Configure Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
