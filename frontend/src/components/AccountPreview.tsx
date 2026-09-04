import React, { useState } from 'react';
import { ExternalLink, Play, Eye, EyeOff, Star, FileSpreadsheet, Link2 } from 'lucide-react';
import { AccountPreview as AccountPreviewType } from '../types';

interface AccountPreviewProps {
  account: AccountPreviewType;
  onStartLogin: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isLoggingIn: boolean;
  onSelectFallback?: (company: string, game: string) => void;
}

export const AccountPreview: React.FC<AccountPreviewProps> = ({
  account,
  onStartLogin,
  isFavorite,
  onToggleFavorite,
  isLoggingIn
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <div className="w-full glass-panel rounded-2xl p-6 shadow-2xl border border-dark-700/80 relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-dark-700/60">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider rounded-md bg-brand-500/20 text-brand-400 border border-brand-500/30">
              COMPANY: {account.company}
            </span>
            <span className="px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider rounded-md bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30">
              GAME: {account.game}
            </span>
            {account.sheetSource && (
              <span className="px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                SHEET: {account.sheetSource}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            {account.company} <span className="text-slate-500 font-light">/</span> {account.game}
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleFavorite}
            className={'p-3 rounded-xl border transition ' + (
              isFavorite
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-dark-800 border-dark-700 text-slate-400 hover:text-amber-400'
            )}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={'w-5 h-5 ' + (isFavorite ? 'fill-amber-400 text-amber-400' : '')} />
          </button>

          <button
            onClick={onStartLogin}
            disabled={isLoggingIn}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan hover:from-brand-500 hover:to-accent-cyan text-white font-bold text-sm tracking-wide shadow-lg shadow-brand-500/25 transition disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isLoggingIn ? 'Automating Login...' : 'START AUTO-LOGIN'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
        <div className="p-4 rounded-xl bg-dark-900/80 border border-dark-700/60">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Website</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <a
            href={account.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-brand-400 hover:text-brand-300 truncate block underline underline-offset-2"
          >
            {account.url.replace(/^https?:\/\//, '') || 'No URL'}
          </a>
        </div>

        <div className="p-4 rounded-xl bg-dark-900/80 border border-dark-700/60">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Username</span>
          </div>
          <div className="text-sm font-mono font-medium text-slate-100 truncate">
            {account.username || '<empty>'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-dark-900/80 border border-dark-700/60">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Password</span>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-200 focus:outline-none"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-sm font-mono font-medium text-slate-100 truncate flex items-center justify-between">
            <span>
              {account.password
                ? (showPassword ? account.password : '••••••••••••')
                : (account.hasPassword ? '••••••••••••' : '<none>')}
            </span>
            <span className="text-[10px] text-slate-500 font-sans">
              {showPassword ? 'Visible' : 'Masked'}
            </span>
          </div>
        </div>
      </div>

      {account.fallbacks && account.fallbacks.length > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-dark-900/90 border border-dark-750 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Link2 className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
            <span>Alternative working links for <strong className="text-slate-200">{account.game}</strong>:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {account.fallbacks.map((fb) => (
              <button
                key={fb.game}
                type="button"
                onClick={() => onSelectFallback ? onSelectFallback(account.company, fb.game) : window.open(fb.url, '_blank')}
                className="px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-750 border border-dark-700 hover:border-accent-cyan/50 text-[11px] font-semibold text-accent-cyan hover:text-white transition flex items-center gap-1"
                title={`Switch to ${fb.game} (${fb.url})`}
              >
                <span>{fb.game}</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
