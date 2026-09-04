import React from 'react';
import { Star, Play, Trash2, Sparkles, FileSpreadsheet } from 'lucide-react';
import { SavedItem } from '../types';

interface FavoritesListProps {
  favorites: SavedItem[];
  onSelect: (company: string, game: string, sheetSource?: string) => void;
  onRemove: (id: string) => void;
  onClear?: () => void;
}

export const FavoritesList: React.FC<FavoritesListProps> = ({
  favorites,
  onSelect,
  onRemove,
  onClear
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center space-x-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Favorites</span>
          </h3>
          {favorites.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {favorites.length}
            </span>
          )}
        </div>

        {favorites.length > 0 && onClear && (
          <button
            onClick={onClear}
            className="text-[11px] text-slate-500 hover:text-rose-400 transition flex items-center gap-1"
            title="Clear all favorites"
          >
            Clear All
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="p-5 rounded-2xl bg-dark-900/40 border border-dashed border-dark-750 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-dark-800/80 border border-dark-700 flex items-center justify-center text-slate-500">
            <Star className="w-5 h-5 text-amber-400/40" />
          </div>
          <div className="text-xs font-semibold text-slate-300">No favorites pinned yet</div>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Click the <Star className="w-3 h-3 text-amber-400 inline mx-0.5 fill-amber-400" /> star icon on any account preview, search suggestion, or recent login to pin your top accounts here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {favorites.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item.company, item.game, item.sheetSource)}
              className="group relative flex items-center justify-between p-3 rounded-xl bg-dark-900/90 hover:bg-dark-850 border border-dark-750 hover:border-amber-500/50 cursor-pointer transition duration-150 shadow-sm hover:shadow-lg hover:shadow-amber-500/5"
            >
              <div className="truncate pr-2 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[11px] font-bold text-amber-400 truncate">
                    {item.company}
                  </span>
                  {item.sheetSource && (
                    <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0 flex items-center gap-0.5">
                      <FileSpreadsheet className="w-2.5 h-2.5" />
                      {item.sheetSource}
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-slate-200 group-hover:text-white truncate block">
                  {item.game}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
                  className="w-7 h-7 rounded-lg bg-dark-800/80 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 flex items-center justify-center transition border border-transparent hover:border-rose-500/30"
                  title="Remove from favorites"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Launch button */}
                <div
                  className="w-7 h-7 rounded-lg bg-dark-800 group-hover:bg-amber-500 flex items-center justify-center text-slate-400 group-hover:text-dark-950 transition"
                  title="Launch auto-login"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
