import React from 'react';

export default function Footer({ count }) {
  return (
    <footer className="flex items-center justify-between px-3.5 py-2 select-none border-t border-black/[0.06] dark:border-white/[0.08] text-[10px] text-neutral-400 dark:text-neutral-500 bg-neutral-100/40 dark:bg-neutral-900/40 rounded-b-2xl">
      <div className="flex items-center space-x-2.5">
        <span className="flex items-center space-x-1">
          <kbd className="px-1 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 font-mono text-[9px] border border-black/[0.05] dark:border-white/[0.05]">
            ↑↓
          </kbd>
          <span>Select</span>
        </span>

        <span className="flex items-center space-x-1">
          <kbd className="px-1 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 font-mono text-[9px] border border-black/[0.05] dark:border-white/[0.05]">
            ↵
          </kbd>
          <span>Paste</span>
        </span>

        <span className="flex items-center space-x-1">
          <kbd className="px-1 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 font-mono text-[9px] border border-black/[0.05] dark:border-white/[0.05]">
            ⌘P
          </kbd>
          <span>Star</span>
        </span>

        <span className="flex items-center space-x-1">
          <kbd className="px-1 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 font-mono text-[9px] border border-black/[0.05] dark:border-white/[0.05]">
            ⌫
          </kbd>
          <span>Delete</span>
        </span>
      </div>

      <div className="flex items-center space-x-1">
        <kbd className="px-1 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 font-mono text-[9px] border border-black/[0.05] dark:border-white/[0.05]">
          esc
        </kbd>
        <span>Close</span>
      </div>
    </footer>
  );
}

