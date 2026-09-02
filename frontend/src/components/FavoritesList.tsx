import React from 'react';
import { Star, Play } from 'lucide-react';
import { SavedItem } from '../types';

interface FavoritesListProps {
  favorites: SavedItem[];
  onSelect: (company: string, game: string) => void;
}

export const FavoritesList: React.FC<FavoritesListProps> = ({ favorites, onSelect }) => {
  if (favorites.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          Favorites
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {favorites.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.company, item.game)}
            className="group flex items-center justify-between p-3 rounded-xl bg-dark-900/80 hover:bg-dark-850 border border-dark-700/80 hover:border-amber-500/40 text-left transition shadow-sm"
          >
            <div className="truncate pr-2">
              <span className="text-xs font-bold text-amber-400 block">
                {item.company}
              </span>
              <span className="text-sm font-semibold text-slate-200 group-hover:text-white">
                {item.game}
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-dark-800 group-hover:bg-amber-500 flex items-center justify-center text-slate-400 group-hover:text-dark-950 transition shrink-0">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
