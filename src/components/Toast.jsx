import React from 'react';
import { Check } from 'lucide-react';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none animate-fade-in">
      <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-neutral-900/90 dark:bg-neutral-100/90 text-white dark:text-neutral-900 text-[11px] font-medium shadow-lg backdrop-blur-md">
        <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
        <span>{message}</span>
      </div>
    </div>
  );
}

