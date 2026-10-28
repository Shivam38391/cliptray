import React from 'react';
import { Star, Globe, Code2, Palette, FileText, Layers } from 'lucide-react';

export default function FilterTabs({ activeFilter, setFilter, counts }) {
  const tabs = [
    { id: 'all', label: 'All', icon: Layers, count: counts.all },
    { id: 'pinned', label: 'Starred', icon: Star, count: counts.pinned },
    { id: 'link', label: 'Links', icon: Globe, count: counts.link },
    { id: 'code', label: 'Code', icon: Code2, count: counts.code },
    { id: 'text', label: 'Text', icon: FileText, count: counts.text },
  ];

  return (
    <div className="flex items-center space-x-1 px-3 pb-2 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeFilter === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
              isActive
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40'
            }`}
          >
            <Icon className="w-3 h-3" />
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`text-[9px] px-1 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black font-semibold'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

