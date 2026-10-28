import React from 'react';
import { ClipboardList, SearchX, Star } from 'lucide-react';

export default function EmptyState({ filter, search }) {
  if (search) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-10 h-10 rounded-full bg-neutral-200/50 dark:bg-neutral-800/50 flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-2.5">
          <SearchX className="w-5 h-5" />
        </div>
        <p className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
          No matches found
        </p>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 max-w-[220px]">
          No clips match "{search}". Try searching for another phrase.
        </p>
      </div>
    );
  }

  if (filter === 'pinned') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2.5">
          <Star className="w-5 h-5" />
        </div>
        <p className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
          No starred clips
        </p>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 max-w-[220px]">
          Click the star icon or press ⌘P on any clip to keep it pinned at the top.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
      <div className="w-12 h-12 rounded-2xl bg-neutral-200/50 dark:bg-neutral-800/50 flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-3 border border-black/[0.05] dark:border-white/[0.05]">
        <ClipboardList className="w-6 h-6" />
      </div>
      <p className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
        Clipboard is empty
      </p>
      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 max-w-[220px]">
        Copy text, URLs, or code from any app. They will appear here automatically.
      </p>
    </div>
  );
}

