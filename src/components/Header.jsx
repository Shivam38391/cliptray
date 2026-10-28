import React from 'react';
import { Clipboard, Trash2, X } from 'lucide-react';

export default function Header({ count, onClearAll, onClose }) {
  return (
    <header className="flex items-center justify-between px-3.5 pt-3 pb-2 select-none border-b border-black/[0.06] dark:border-white/[0.08]">
      <div className="flex items-center space-x-2">
        <div className="flex items-center justify-center w-5 h-5 rounded-md bg-neutral-200/80 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300">
          <Clipboard className="w-3.5 h-3.5" />
        </div>
        <h1 className="text-[13px] font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">
          Cliptray
        </h1>
        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400">
          {count}
        </span>
      </div>

      <div className="flex items-center space-x-1">
        {count > 0 && (
          <button
            onClick={onClearAll}
            title="Clear Unpinned History (⌘⇧⌫)"
            className="flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-medium text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
        <button
          onClick={onClose}
          title="Close (Esc)"
          className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}

