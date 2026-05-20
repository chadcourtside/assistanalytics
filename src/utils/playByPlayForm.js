/**
 * Helpers for play-by-play entry in the game form.
 */

/** Normalize user time input to M:SS (e.g. "3:5" → "3:05", "350" → "3:50"). */
export function normalizePlayTimeInput(raw) {
  const t = (raw || '').trim();
  if (!t) return '';

  const colonMatch = t.match(/^(\d{1,2}):(\d{1,2})$/);
  if (colonMatch) {
    const mins = parseInt(colonMatch[1], 10);
    const secs = parseInt(colonMatch[2], 10);
    if (secs > 59) return '';
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  const digitsOnly = t.match(/^(\d{1,2})(\d{2})$/);
  if (digitsOnly) {
    const mins = parseInt(digitsOnly[1], 10);
    const secs = parseInt(digitsOnly[2], 10);
    if (secs > 59) return '';
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  return '';
}

export function formatPlayByPlayLine(timeStr, description) {
  const desc = (description || '').trim();
  if (!desc) return '';

  const time = normalizePlayTimeInput(timeStr);
  if (!time) return desc;
  return `${time} ${desc}`;
}

/**
 * Insert a play-by-play line into text at the textarea cursor, or append if no ref.
 */
export function insertPlayByPlayLine({ currentText, timeStr, description, textarea }) {
  const line = formatPlayByPlayLine(timeStr, description);
  if (!line) return currentText;

  const insertion = `${line}\n`;

  if (textarea && typeof textarea.selectionStart === 'number') {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = currentText.slice(0, start);
    const after = currentText.slice(end);
    const prefix =
      before.length > 0 && !before.endsWith('\n') && start === before.length ? '\n' : '';
    return before + prefix + insertion + after;
  }

  const suffix = currentText.length > 0 && !currentText.endsWith('\n') ? '\n' : '';
  return currentText + suffix + insertion;
}
