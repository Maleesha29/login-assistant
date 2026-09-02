import React, { useRef, useEffect, useState } from 'react';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { SearchSuggestion } from '../types';

interface SearchBoxProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (val: string) => void;
  suggestions: SearchSuggestion[];
  onSelectSuggestion: (suggestion: SearchSuggestion) => void;
  isLoading: boolean;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  value,
  onChange,
  onSubmit,
  suggestions,
  onSelectSuggestion,
  isLoading
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement !== inputRef.current)) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev + 1 < suggestions.length ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : suggestions.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        onSelectSuggestion(suggestions[selectedIndex]);
      } else if (value.trim()) {
        onSubmit(value.trim());
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="w-full relative">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/20 via-accent-cyan/20 to-accent-purple/20 rounded-2xl blur-xl opacity-60 group-focus-within:opacity-100 transition duration-500" />
        
        <div className="relative flex items-center bg-dark-900 border-2 border-dark-700/80 rounded-2xl shadow-2xl transition duration-200 search-input-glow">
          <div className="pl-5 pr-3 text-slate-400 flex items-center pointer-events-none">
            <Search className="w-6 h-6 text-brand-400 group-focus-within:text-brand-300 transition" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search company + game (e.g. HOLSPIN JILI)"
            autoComplete="off"
            spellCheck="false"
            className="w-full py-4 sm:py-5 text-lg sm:text-xl font-medium bg-transparent text-white placeholder:text-slate-500 focus:outline-none tracking-wide"
          />

          {value && (
            <button
              onClick={() => {
                onChange('');
                inputRef.current?.focus();
              }}
              className="p-2 mr-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-dark-800 transition"
              title="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="pr-4 hidden sm:flex items-center">
            <button
              onClick={() => value.trim() && onSubmit(value.trim())}
              disabled={!value.trim()}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-brand-600/90 hover:bg-brand-500 disabled:opacity-30 disabled:hover:bg-brand-600/90 text-white text-xs font-semibold tracking-wider transition shadow-md shadow-brand-600/30"
            >
              <span>ENTER</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {isFocused && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 py-2 bg-dark-900/95 backdrop-blur-xl border border-dark-700/90 rounded-xl shadow-2xl z-40 max-h-80 overflow-y-auto">
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Suggestions</span>
            <span>Use ↑ ↓ to navigate, Enter to launch</span>
          </div>
          {suggestions.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={item.company + '_' + item.game + '_' + idx}
                onMouseDown={() => onSelectSuggestion(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={'px-4 py-2.5 mx-1.5 my-0.5 rounded-lg flex items-center justify-between cursor-pointer transition text-sm ' + (
                  isSelected
                    ? 'bg-brand-600/20 text-white border border-brand-500/40'
                    : 'text-slate-300 hover:bg-dark-800 hover:text-white'
                )}
              >
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-dark-800 text-brand-400 border border-dark-700">
                    {item.company}
                  </span>
                  <span className="font-semibold text-slate-100">{item.game}</span>
                  <span className="text-xs text-slate-500 hidden md:inline truncate max-w-xs">
                    {item.url}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span className="font-mono text-[11px] text-slate-400">@{item.username}</span>
                  <CornerDownLeft className="w-3.5 h-3.5 text-brand-400 opacity-60" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
