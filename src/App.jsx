import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import FilterTabs from './components/FilterTabs';
import ClipboardList from './components/ClipboardList';
import Footer from './components/Footer';
import Toast from './components/Toast';

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

const isTauri = typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__);

// Mock data for previewing frontend in standard browser
const MOCK_HISTORY = [
  {
    id: '1',
    content: 'https://developer.apple.com/design/human-interface-guidelines/',
    item_type: 'link',
    char_count: 67,
    preview: 'https://developer.apple.com/design/human-interface-guidelines/',
    pinned: 1,
    created_at: Date.now() - 1000 * 60 * 5,
  },
  {
    id: '2',
    content: 'const copyToClipboard = async (text) => await navigator.clipboard.writeText(text);',
    item_type: 'code',
    char_count: 83,
    preview: 'const copyToClipboard = async (text) => await navigator.clipboard.writeText(text);',
    pinned: 0,
    created_at: Date.now() - 1000 * 60 * 18,
  },
  {
    id: '3',
    content: '#007AFF',
    item_type: 'color',
    char_count: 7,
    preview: '#007AFF (Apple System Blue)',
    pinned: 0,
    created_at: Date.now() - 1000 * 60 * 45,
  },
  {
    id: '4',
    content: 'Remember to verify window positioning on multiple monitors under macOS Sequoia.',
    item_type: 'text',
    char_count: 78,
    preview: 'Remember to verify window positioning on multiple monitors under macOS Sequoia.',
    pinned: 0,
    created_at: Date.now() - 1000 * 60 * 120,
  },
  {
    id: '5',
    content: '{\n  "name": "Cliptray",\n  "version": "1.0.0",\n  "platform": "macOS"\n}',
    item_type: 'json',
    char_count: 62,
    preview: '{ "name": "Cliptray", "version": "1.0.0", "platform": "macOS" }',
    pinned: 0,
    created_at: Date.now() - 1000 * 60 * 240,
  },
];

export default function App() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  // Trigger toast with auto-clear
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 1500);
  }, []);

  // Fetch history from Rust SQLite store
  const refreshHistory = useCallback(async () => {
    try {
      if (isTauri) {
        const history = await invoke('get_history');
        if (history) setItems(history);
      } else {
        setItems(MOCK_HISTORY);
      }
    } catch (err) {
      console.error('Failed to load clipboard history:', err);
      if (!isTauri) setItems(MOCK_HISTORY);
    }
  }, []);

  // Initial load & clipboard listener setup
  useEffect(() => {
    refreshHistory();

    let unlisten = null;
    if (isTauri) {
      listen('clipboard-updated', (event) => {
        const newItem = event.payload;
        setItems((prev) => {
          // Remove duplicate if it already exists and add to top
          const filtered = prev.filter((i) => i.id !== newItem.id && i.content !== newItem.content);
          return [newItem, ...filtered];
        });
      }).then((fn) => {
        unlisten = fn;
      });
    }

    return () => {
      if (unlisten) unlisten();
    };
  }, [refreshHistory]);

  // Filter items based on active tab and search query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (filter === 'pinned' && !item.pinned) return false;
      if (filter !== 'all' && filter !== 'pinned' && item.item_type !== filter) return false;

      // Search query
      if (search.trim()) {
        const query = search.toLowerCase();
        const contentMatch = item.content.toLowerCase().includes(query);
        const typeMatch = item.item_type.toLowerCase().includes(query);
        return contentMatch || typeMatch;
      }

      return true;
    });
  }, [items, filter, search]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems.length, selectedIndex]);

  // Reset selected index when search or filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search, filter]);

  // Handle item selection & auto-paste
  const handleSelectAndPaste = useCallback(
    async (item) => {
      if (!item) return;
      try {
        if (isTauri) {
          await invoke('paste_item', { content: item.content });
        } else {
          await navigator.clipboard.writeText(item.content);
          showToast('Copied to clipboard (Preview)');
        }
      } catch (err) {
        console.error('Failed to auto-paste item:', err);
      }
    },
    [showToast]
  );

  // Toggle pin/star
  const handleTogglePin = useCallback(
    async (id) => {
      try {
        if (isTauri) {
          await invoke('toggle_pin', { id });
        }
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, pinned: item.pinned ? 0 : 1 } : item
          )
        );
        showToast('Updated star');
      } catch (err) {
        console.error('Failed to toggle pin:', err);
      }
    },
    [showToast]
  );

  // Delete item
  const handleDelete = useCallback(
    async (id) => {
      try {
        if (isTauri) {
          await invoke('delete_item', { id });
        }
        setItems((prev) => prev.filter((item) => item.id !== id));
        showToast('Item deleted');
      } catch (err) {
        console.error('Failed to delete item:', err);
      }
    },
    [showToast]
  );

  // Clear unpinned history
  const handleClearAll = useCallback(async () => {
    try {
      if (isTauri) {
        await invoke('clear_history');
      }
      setItems((prev) => prev.filter((item) => item.pinned));
      showToast('Cleared unpinned items');
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  }, [showToast]);

  // Hide window
  const handleClose = useCallback(async () => {
    try {
      if (isTauri) {
        await invoke('hide_window');
      }
    } catch (err) {
      console.error('Failed to hide window:', err);
    }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Close on Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        if (search) {
          setSearch('');
        } else {
          handleClose();
        }
        return;
      }

      // 2. Navigation with Arrow Up / Down
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
        return;
      }

      // 3. Selection with Enter
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelectAndPaste(filteredItems[selectedIndex]);
        }
        return;
      }

      // 4. Pin / Star with Cmd+P or Ctrl+P
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleTogglePin(filteredItems[selectedIndex].id);
        }
        return;
      }

      // 5. Delete with Backspace / Delete
      if (
        (e.key === 'Backspace' || e.key === 'Delete') &&
        (e.metaKey || e.ctrlKey || document.activeElement.tagName !== 'INPUT')
      ) {
        if (filteredItems[selectedIndex]) {
          e.preventDefault();
          handleDelete(filteredItems[selectedIndex].id);
        }
        return;
      }

      // 6. Clear all unpinned with Cmd+Shift+Backspace
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'Backspace') {
        e.preventDefault();
        handleClearAll();
        return;
      }

      // 7. Quick selection with Cmd+1 to Cmd+9
      if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
        const targetIndex = parseInt(e.key, 10) - 1;
        if (targetIndex < filteredItems.length) {
          e.preventDefault();
          handleSelectAndPaste(filteredItems[targetIndex]);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    filteredItems,
    selectedIndex,
    search,
    handleClose,
    handleSelectAndPaste,
    handleTogglePin,
    handleDelete,
    handleClearAll,
  ]);

  // Compute counts for filter tabs
  const counts = useMemo(() => {
    return {
      all: items.length,
      pinned: items.filter((i) => i.pinned).length,
      link: items.filter((i) => i.item_type === 'link').length,
      code: items.filter((i) => i.item_type === 'code').length,
      text: items.filter((i) => i.item_type === 'text').length,
    };
  }, [items]);

  return (
    <div className="relative w-screen h-screen flex flex-col mac-vibrancy rounded-2xl border border-black/10 dark:border-white/10 shadow-mac-popover dark:shadow-mac-popover-dark overflow-hidden font-sans">
      {/* Top Header */}
      <Header count={items.length} onClearAll={handleClearAll} onClose={handleClose} />

      {/* Instant Search Bar */}
      <SearchBar search={search} setSearch={setSearch} />

      {/* Filter Tabs */}
      <FilterTabs activeFilter={filter} setFilter={setFilter} counts={counts} />

      {/* Main Clipboard Items Scroll List */}
      <ClipboardList
        items={filteredItems}
        selectedIndex={selectedIndex}
        onSelect={handleSelectAndPaste}
        onTogglePin={handleTogglePin}
        onDelete={handleDelete}
        filter={filter}
        search={search}
      />

      {/* Bottom Shortcuts / Status Bar */}
      <Footer count={filteredItems.length} />

      {/* Notification Toast */}
      <Toast message={toastMessage} />
    </div>
  );
}
