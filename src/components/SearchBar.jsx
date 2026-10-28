import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ search, setSearch, onKeyDown }) {
  const inputRef = useRef(null);

  // Auto-focus on mount and on global window focus
  useEffect(() => {
    inputRef.current?.focus();

    const handleWindowFocus = () => {
      inputRef.current?.focus();
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, []);

  return (
    <div className="relative px-3 pt-2.5 pb-2">
      <div className="relative flex items-center w-full">
        <Search className="absolute left-2.5 w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search clipboard... (⌘F)"
          className="w-full pl-8 pr-16 py-1.5 text-[13px] bg-neutral-200/50 dark:bg-neutral-800/60 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 rounded-lg border border-black/[0.05] dark:border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/80 transition-all"
        />

        <div className="absolute right-2 flex items-center space-x-1.5">
          {search ? (
            <button
              onClick={() => setSearch('')}
              className="p-0.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 bg-neutral-300/60 dark:bg-neutral-700/60 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-700/50 border border-black/[0.04] dark:border-white/[0.04]">
              ⌘F
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

