import React, { useRef, useEffect } from 'react';
import ClipboardItem from './ClipboardItem';
import EmptyState from './EmptyState';

export default function ClipboardList({
  items,
  selectedIndex,
  onSelect,
  onTogglePin,
  onDelete,
  filter,
  search,
}) {
  const listRef = useRef(null);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0 && selectedIndex < items.length) {
      const selectedEl = listRef.current.children[selectedIndex];
      if (selectedEl) {
        selectedEl.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedIndex, items]);

  if (items.length === 0) {
    return <EmptyState filter={filter} search={search} />;
  }

  return (
    <div
      ref={listRef}
      className="flex-1 overflow-y-auto overflow-x-hidden py-1 divide-y divide-black/[0.03] dark:divide-white/[0.03]"
    >
      {items.map((item, index) => (
        <ClipboardItem
          key={item.id}
          item={item}
          index={index}
          isSelected={index === selectedIndex}
          onSelect={onSelect}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

