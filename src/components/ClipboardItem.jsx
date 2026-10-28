import React from 'react';
import { Star, Trash2, Globe, Code2, Palette, FileText, Braces, CornerDownLeft } from 'lucide-react';
import { formatTimeAgo, getItemMetadata } from '../utils/formatters';

export default function ClipboardItem({
  item,
  index,
  isSelected,
  onSelect,
  onTogglePin,
  onDelete,
}) {
  const metadata = getItemMetadata(item.item_type, item.content);

  const getIcon = () => {
    switch (item.item_type) {
      case 'link':
        return <Globe className="w-3 h-3" />;
      case 'color':
        return (
          <span
            className="w-3 h-3 rounded-full border border-black/20 dark:border-white/20 inline-block shadow-sm"
            style={{ backgroundColor: metadata.colorValue || item.content }}
          />
        );
      case 'code':
        return <Code2 className="w-3 h-3" />;
      case 'json':
        return <Braces className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const lineCount = (item.content.match(/\n/g) || []).length + 1;
  const isQuickKey = index < 9;

  return (
    <div
      onClick={() => onSelect(item)}
      className={`group relative flex flex-col px-3 py-2.5 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-100 select-none ${
        isSelected
          ? 'bg-[#007AFF] text-white shadow-md'
          : 'hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200'
      }`}
    >
      {/* Top row: Type badge, metadata, quick key, pin/delete buttons */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-1.5">
          <span
            className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${
              isSelected ? metadata.activeColor : metadata.color
            }`}
          >
            {getIcon()}
            <span>{metadata.label}</span>
          </span>

          <span
            className={`text-[10px] ${
              isSelected ? 'text-white/80' : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            {item.char_count} chars {lineCount > 1 && `• ${lineCount} lines`}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {/* Quick key indicator (⌘1 - ⌘9) */}
          {isQuickKey && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-neutral-200/70 dark:bg-neutral-800/70 text-neutral-400 dark:text-neutral-500'
              }`}
            >
              ⌘{index + 1}
            </span>
          )}

          {/* Timestamp */}
          <span
            className={`text-[10px] mr-1 ${
              isSelected ? 'text-white/80' : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            {formatTimeAgo(item.created_at)}
          </span>

          {/* Star / Pin Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(item.id);
            }}
            title={item.pinned ? 'Unpin' : 'Pin to top (⌘P)'}
            className={`p-1 rounded-md transition-colors ${
              item.pinned
                ? 'text-amber-400 hover:text-amber-500'
                : isSelected
                ? 'text-white/60 hover:text-white hover:bg-white/10'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 opacity-0 group-hover:opacity-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${item.pinned ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            title="Delete item (⌫)"
            className={`p-1 rounded-md transition-colors ${
              isSelected
                ? 'text-white/60 hover:text-white hover:bg-white/10'
                : 'text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content Preview */}
      <div
        className={`text-[12.5px] leading-relaxed line-clamp-2 break-all ${
          item.item_type === 'code' || item.item_type === 'json'
            ? 'font-mono text-[11.5px]'
            : 'font-normal'
        } ${isSelected ? 'text-white' : 'text-neutral-700 dark:text-neutral-300'}`}
      >
        {item.preview || item.content}
      </div>

      {/* Paste Action Hint when Selected */}
      {isSelected && (
        <div className="flex items-center justify-end mt-1 space-x-1 text-[10px] text-white/90 font-medium">
          <CornerDownLeft className="w-2.5 h-2.5" />
          <span>Press Return to auto-paste</span>
        </div>
      )}
    </div>
  );
}

