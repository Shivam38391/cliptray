/**
 * Formats a UNIX timestamp (in milliseconds or seconds) into human-readable relative time
 */
export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Just now';
  
  // Normalize to milliseconds
  const time = timestamp < 1e11 ? timestamp * 1000 : timestamp;
  const now = Date.now();
  const diffSec = Math.floor((now - time) / 1000);

  if (diffSec < 15) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  const date = new Date(time);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Detects whether content is a link, hex/rgb color, JSON, code snippet, or plain text
 */
export function detectItemType(content) {
  if (!content) return 'text';
  const trimmed = content.trim();

  // URL / Link detection
  const urlRegex = /^(https?:\/\/|www\.)[^\s/$.?#].[^\s]*$/i;
  if (urlRegex.test(trimmed)) {
    return 'link';
  }

  // Hex or CSS Color detection
  const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
  const rgbColorRegex = /^(rgb|hsl)a?\(\s*[\d.]+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?(?:\s*,\s*[\d.]+%?)?\s*\)$/i;
  if (hexColorRegex.test(trimmed) || rgbColorRegex.test(trimmed)) {
    return 'color';
  }

  // JSON detection
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // not valid JSON, check code or text
    }
  }

  // Code detection
  const codeIndicators = [
    /\b(const|let|var|function|def|fn|pub fn|class|import|from|export|return|if|else|switch|case|while|for)\b/,
    /(=>|===|!==|;|{|}|\(\)|\[\])/,
    /<\w+(\s+[^>]*)?>.*<\/\w+>/, // HTML / JSX
    /SELECT\s+.+\s+FROM\s+/i,   // SQL
  ];
  const containsCodeKeywords = codeIndicators.some((regex) => regex.test(trimmed));
  const hasMultipleIndentedLines = trimmed.split('\n').filter((l) => /^\s{2,}|\t/.test(l)).length >= 2;

  if (containsCodeKeywords || hasMultipleIndentedLines) {
    return 'code';
  }

  return 'text';
}

/**
 * Returns UI metadata (label, styling, colors) for each item type
 */
export function getItemMetadata(type, content) {
  switch (type) {
    case 'link':
      return {
        label: 'Link',
        color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 border-sky-200/50 dark:border-sky-800/50',
        activeColor: 'text-sky-200 bg-sky-900/60 border-sky-400/40',
        icon: 'Globe',
      };
    case 'color':
      return {
        label: 'Color',
        color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/50 dark:border-emerald-800/50',
        activeColor: 'text-emerald-200 bg-emerald-900/60 border-emerald-400/40',
        icon: 'Palette',
        colorValue: content.trim(),
      };
    case 'json':
      return {
        label: 'JSON',
        color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200/50 dark:border-amber-800/50',
        activeColor: 'text-amber-200 bg-amber-900/60 border-amber-400/40',
        icon: 'Braces',
      };
    case 'code':
      return {
        label: 'Code',
        color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200/50 dark:border-purple-800/50',
        activeColor: 'text-purple-200 bg-purple-900/60 border-purple-400/40',
        icon: 'Code2',
      };
    default:
      return {
        label: 'Text',
        color: 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700/50',
        activeColor: 'text-neutral-200 bg-neutral-700/60 border-neutral-500/40',
        icon: 'FileText',
      };
  }
}

/**
 * Truncate long strings for single/multi-line previews
 */
export function truncate(text, maxLength = 120) {
  if (!text) return '';
  const singleLine = text.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= maxLength) return singleLine;
  return singleLine.slice(0, maxLength) + '…';
}

