import React from 'react';
import { History, Play } from 'lucide-react';
import { SavedItem } from '../types';

interface RecentLoginsProps {
  recents: SavedItem[];
  onSelect: (company: string, game: string) => void;
  onClear: () => void;
}

export const RecentLogins: React.FC<RecentLoginsProps> = ({ recents, onSelect, onClear }) => {
  if (recents.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-brand-400" />
          Recent Logins
        </h3>
        <button
          onClick={onClear}
          className="text-[11px] text-slate-500 hover:text-slate-300 transition"
        >
          Clear History
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {recents.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.company, item.game)}
            className="group flex items-center justify-between p-3 rounded-xl bg-dark-900/80 hover:bg-dark-850 border border-dark-700/80 hover:border-brand-500/40 text-left transition shadow-sm"
          >
            <div className="truncate pr-2">
              <span className="text-xs font-bold text-brand-400 block">
                {item.company}
              </span>
              <span className="text-sm font-semibold text-slate-200 group-hover:text-white">
                {item.game}
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-dark-800 group-hover:bg-brand-600 flex items-center justify-center text-slate-400 group-hover:text-white transition shrink-0">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
