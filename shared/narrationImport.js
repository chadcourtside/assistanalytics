/**
 * Parse sideline narration transcripts into timestamped play-by-play suggestions.
 * Shared between the UI (local fallback) and the API (stub until Whisper/LLM in PR2).
 */

/** @typedef {{ startSeconds: number, time: string, text: string }} TranscriptSegment */
/** @typedef {'uncertain' | 'reviewLater' | 'corrected'} NarrationSuggestionFlag */
/** @typedef {{ id: string, time: string, line: string, sourceText: string, confidence: 'high'|'medium'|'low', accepted: boolean, parseable: boolean, flags?: NarrationSuggestionFlag[], correctionNote?: string }} NarrationSuggestion */

function padTime(mins, secs) {
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/** Seconds → M:SS for play-by-play lines. */
export function formatSecondsAsPlayTime(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  return padTime(mins, rem);
}

function parseClockToSeconds(raw) {
  const t = (raw || '').trim();
  if (!t) return null;

  const hms = t.match(/^(\d{1,2}):(\d{2}):(\d{2})(?:\.\d+)?$/);
  if (hms) {
    return parseInt(hms[1], 10) * 3600 + parseInt(hms[2], 10) * 60 + parseInt(hms[3], 10);
  }

  const ms = t.match(/^(\d{1,2}):(\d{2})(?:\.\d+)?$/);
  if (ms) {
    return parseInt(ms[1], 10) * 60 + parseInt(ms[2], 10);
  }

  return null;
}

const SKIP_LINE = /^(WEBVTT|Kind:|Language:|NOTE|STYLE|REGION|\d+)$/i;

/**
 * Parse pasted transcript text into timestamped segments.
 * Supports WebVTT cues, bracket timestamps, and plain M:SS prefixes.
 */
export function parseTranscriptToSegments(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  const lines = rawText.replace(/\r\n/g, '\n').split('\n');
  const segments = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || SKIP_LINE.test(line)) continue;

    const vttCue = line.match(
      /^(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?)\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?)\s*(.*)$/
    );
    if (vttCue) {
      const startSeconds = parseClockToSeconds(vttCue[1]);
      let text = (vttCue[3] || '').trim();
      if (!text) {
        const textLines = [];
        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j].trim();
          if (!nextLine) break;
          if (nextLine.includes('-->')) break;
          textLines.push(nextLine);
          j += 1;
        }
        text = textLines.join(' ').trim();
        i = j - 1;
      }
      if (startSeconds != null && text) {
        segments.push({
          startSeconds,
          time: formatSecondsAsPlayTime(startSeconds),
          text,
        });
      }
      continue;
    }

    const prefixed = line.match(/^\[?\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*\]?\s+(.+)$/);
    if (prefixed) {
      const startSeconds = parseClockToSeconds(prefixed[1]);
      const text = prefixed[2].trim();
      if (startSeconds != null && text) {
        segments.push({
          startSeconds,
          time: formatSecondsAsPlayTime(startSeconds),
          text,
        });
      }
      continue;
    }

    if (i + 1 < lines.length) {
      const next = lines[i + 1].trim();
      const maybeTime = parseClockToSeconds(line);
      if (maybeTime != null && next && !next.includes('-->')) {
        segments.push({
          startSeconds: maybeTime,
          time: formatSecondsAsPlayTime(maybeTime),
          text: next,
        });
        i += 1;
        continue;
      }
    }
  }

  return segments.sort((a, b) => a.startSeconds - b.startSeconds);
}

const NOISE_RE =
  /\b(nice|good|great|wow|come on|let's go|sub|timeout|quarter|halftime|coach|parents|crowd)\b/i;

/** Rule-based speech → canonical play-by-play description (stub for future LLM). */
export function normalizeSpeechToDescription(rawText) {
  const text = (rawText || '').trim();
  if (!text) return { description: '', confidence: 'low', mapped: false };

  if (NOISE_RE.test(text) && text.split(/\s+/).length <= 4) {
    return { description: '', confidence: 'low', mapped: false };
  }

  const lower = text.toLowerCase();
  const parts = [];
  let mapped = false;

  const add = (label) => {
    if (!parts.includes(label)) {
      parts.push(label);
      mapped = true;
    }
  };

  if (/\bmake\s*ft\b|\bmade\s*ft\b|\bft\s*make\b|make\s*free\s*throw|\bftm\b/.test(lower)) add('Make FT');
  else if (/\bmiss\s*ft\b|\bmissed\s*ft\b|miss\s*free\s*throw/.test(lower)) add('Miss FT');
  else if (/\bmake\s*three\b|\bmake\s*3\b|\bmade\s*three\b|\bmade\s*3\b|\bthree\s*pointer\b/.test(lower)) {
    add('Make 3 PT');
  } else if (/\bmiss\s*three\b|\bmiss\s*3\b|\bmissed\s*three\b/.test(lower)) {
    add('Miss 3 PT');
  } else if (/\bmake\s*two\b|\bmake\s*2\b|\bmade\s*two\b|\bmade\s*2\b/.test(lower)) {
    add('Make 2 PT');
  } else if (/\bmiss\s*two\b|\bmiss\s*2\b|\bmissed\s*two\b/.test(lower)) {
    add('Miss 2 PT');
  }

  if (/\blive\s*ball\s*turnover\b|\blb\s*tov\b/.test(lower)) add('LB TOV');
  else if (/\bdb\s*tov\b|\bdb\s*turnover\b|\bdead\s*ball\s*turnover\b/.test(lower)) add('TOV');
  else if (/\bturnover\b|\btov\b/.test(lower)) add('TOV');

  if (/\b(?:2nd|second)\s*assist\b|\b2nd\s*ast\b|\bhockey\s*assist\b/.test(lower)) add('2nd Assist');
  else if (/\bscreen\s*assist\b|\bscr\s*ast\b/.test(lower)) add('Screen assist');
  else if (/\bassist\b/.test(lower)) add('Assist');

  if (/\bhqpa\b|clean entry|potential assist/.test(lower)) add('HQPA');
  if (/paint touch|\bptch\b/.test(lower)) add('Paint touch');

  if (/\boff(?:ensive)?\s*reb\b|\boreb\b/.test(lower)) add('Off reb');
  else if (/\bdef\s*reb\b|\bdreb\b|defensive reb/.test(lower)) add('Def reb');
  else if (/\brebound\b|\breb\b/.test(lower)) add('Def reb');

  if (/\bsteal\b|\bstl\b/.test(lower)) add('Steal');
  if (/\bblock\b|\bblk\b/.test(lower)) add('Block');
  if (/foul drawn|drawn foul|\bfd\b/.test(lower)) add('Foul drawn');
  else if (/\bpersonal foul\b|\bpf\b/.test(lower)) add('Personal foul');

  if (/\bdefl\b|\bdeflection\b/.test(lower)) add('Def');
  else if (/\bdef\b/.test(lower) && !parts.some((p) => p.includes('reb'))) add('Def');

  if (!mapped && /^note:/i.test(text)) {
    return { description: text.replace(/^note:\s*/i, 'Note: '), confidence: 'medium', mapped: true };
  }

  if (!mapped) {
    return { description: '', confidence: 'low', mapped: false };
  }

  const confidence = parts.length >= 2 ? 'high' : parts.length === 1 ? 'medium' : 'low';
  return { description: parts.join(', '), confidence, mapped: true };
}

/** Strip correction phrasing and negation ("… no missed two") to get the intended tag phrase. */
export function extractCorrectionPayload(rawText) {
  let t = (rawText || '').trim();
  t = t.replace(/^(correction|correct|actually)\b[\s.:,-]*/i, '').trim();
  t = t.replace(/^(?:the\s+)?last\s+event\s+was\s+/i, '').trim();
  t = t.replace(/^(?:that|it)\s+was\s+/i, '').trim();

  const noMatch = t.match(/\bno[,.]?\s+(.+)$/i);
  if (noMatch) t = noMatch[1].trim();

  return t.replace(/^[,.\s-]+/, '').trim();
}

/**
 * Detect sideline control phrases (corrections, undo, flags).
 * @returns {{ type: 'delete_last'|'mark_uncertain'|'review_later'|'correction'|'event', payload?: string }}
 */
export function detectNarrationCommand(rawText) {
  const text = (rawText || '').trim();
  const lower = text.toLowerCase();

  if (/^(scratch that|ignore last|delete last|undo last|cancel last)\b/.test(lower)) {
    return { type: 'delete_last' };
  }
  if (/^(mark uncertain|uncertain|not sure)\b/.test(lower)) {
    return { type: 'mark_uncertain' };
  }
  if (/^(review later|check later|flag for review)\b/.test(lower)) {
    return { type: 'review_later' };
  }
  if (/^(correction|correct|actually)\b/i.test(text)) {
    return { type: 'correction', payload: extractCorrectionPayload(text) };
  }
  return { type: 'event' };
}

function defaultAccepted(suggestion) {
  const flags = suggestion.flags || [];
  if (flags.includes('uncertain') || flags.includes('reviewLater')) return false;
  return suggestion.confidence !== 'low';
}

function pushEventSuggestion(suggestions, seen, segment, sourceText, description, confidence, extra = {}) {
  const line = formatPlayByPlayLine(segment.time, description);
  const dedupeKey = `${segment.time}|${description.toLowerCase()}`;
  if (seen.has(dedupeKey)) return false;
  seen.add(dedupeKey);

  const suggestion = {
    id: nextSuggestionId(),
    time: segment.time,
    line,
    sourceText,
    confidence,
    accepted: true,
    parseable: isParseablePlayLine(line),
    flags: [],
    ...extra,
  };
  suggestion.accepted = defaultAccepted(suggestion);
  suggestions.push(suggestion);
  return true;
}

function getLastSuggestion(suggestions) {
  return suggestions.length > 0 ? suggestions[suggestions.length - 1] : null;
}

function applyFlagToLast(suggestions, flag) {
  const last = getLastSuggestion(suggestions);
  if (!last) return false;
  last.flags = [...new Set([...(last.flags || []), flag])];
  last.accepted = defaultAccepted(last);
  return true;
}

export function formatPlayByPlayLine(time, description) {
  const desc = (description || '').trim();
  if (!desc) return '';
  const t = (time || '').trim();
  if (!t) return desc;
  return `${t} ${desc}`;
}

/** Lightweight parse check — mirrors playEvents line shape without importing app code. */
export function isParseablePlayLine(line) {
  const trimmed = (line || '').trim();
  const match = trimmed.match(/^\[?\s*(\d{1,2}:\d{2})\s*\]?\s*(.+)$/);
  if (!match) return false;
  const desc = match[2].trim();
  if (!desc) return false;
  if (/^note:/i.test(desc)) return true;
  return normalizeSpeechToDescription(desc).mapped || desc.length > 2;
}

let suggestionCounter = 0;

function nextSuggestionId() {
  suggestionCounter += 1;
  return `sug-${Date.now()}-${suggestionCounter}`;
}

/**
 * Build review-ready suggestions from transcript segments.
 * @param {TranscriptSegment[]} segments
 * @param {{ playerName?: string }} options
 * @returns {{ suggestions: NarrationSuggestion[], warnings: string[] }}
 */
export function buildNarrationSuggestions(segments, { playerName = '' } = {}) {
  const warnings = [];
  const suggestions = [];
  const seen = new Set();

  for (const segment of segments) {
    const sourceText = segment.text.trim();
    if (!sourceText) continue;

    const command = detectNarrationCommand(sourceText);

    if (command.type === 'delete_last') {
      const removed = suggestions.pop();
      if (removed) {
        seen.delete(`${removed.time}|${(removed.line.split(' ').slice(1).join(' ') || '').toLowerCase()}`);
        warnings.push(`Removed previous event after "${sourceText}"`);
      } else {
        warnings.push(`Nothing to remove for "${sourceText}"`);
      }
      continue;
    }

    if (command.type === 'mark_uncertain') {
      if (applyFlagToLast(suggestions, 'uncertain')) {
        warnings.push(`Marked previous event uncertain (${sourceText})`);
      } else {
        warnings.push(`No previous event to mark uncertain (${sourceText})`);
      }
      continue;
    }

    if (command.type === 'review_later') {
      if (applyFlagToLast(suggestions, 'reviewLater')) {
        warnings.push(`Flagged previous event for review (${sourceText})`);
      } else {
        warnings.push(`No previous event to flag (${sourceText})`);
      }
      continue;
    }

    if (command.type === 'correction') {
      const last = getLastSuggestion(suggestions);
      if (!last) {
        warnings.push(`Correction with no prior event: "${sourceText}"`);
        continue;
      }
      const { description, confidence, mapped } = normalizeSpeechToDescription(command.payload || '');
      if (!mapped || !description) {
        warnings.push(`Could not parse correction: "${sourceText}"`);
        continue;
      }
      const previousLine = last.line;
      last.line = formatPlayByPlayLine(last.time, description);
      last.confidence = confidence;
      last.parseable = isParseablePlayLine(last.line);
      last.flags = [...new Set([...(last.flags || []), 'corrected'])];
      last.correctionNote = sourceText;
      last.sourceText = `${last.sourceText} → corrected: ${command.payload}`;
      last.accepted = defaultAccepted(last);
      seen.delete(`${last.time}|${(previousLine.split(' ').slice(1).join(' ') || '').toLowerCase()}`);
      seen.add(`${last.time}|${description.toLowerCase()}`);
      warnings.push(`Corrected previous event to "${description}"`);
      continue;
    }

    const { description, confidence, mapped } = normalizeSpeechToDescription(sourceText);
    if (!mapped || !description) {
      warnings.push(`Skipped (unrecognized): "${sourceText}"`);
      continue;
    }

    pushEventSuggestion(suggestions, seen, segment, sourceText, description, confidence);
  }

  if (segments.length === 0) {
    warnings.push('No timestamped segments found. Paste WebVTT cues or lines like "3:50 make two".');
  } else if (suggestions.length === 0) {
    warnings.push(
      playerName
        ? `No mappable events for ${playerName}. Try phrases like "paint touch", "make two", "assist".`
        : 'No mappable events. Try phrases like "paint touch", "make two", "assist".'
    );
  }

  return { suggestions, warnings, stub: true };
}

/** Build WebVTT-style transcript text from Whisper verbose_json segments. */
export function whisperSegmentsToTranscript(segments) {
  if (!Array.isArray(segments)) return '';
  return segments
    .filter((s) => (s?.text || '').trim())
    .map((s) => {
      const start = formatSecondsAsPlayTime(s.start ?? 0);
      const end = formatSecondsAsPlayTime(s.end ?? s.start ?? 0);
      return `${start} --> ${end}\n${String(s.text).trim()}`;
    })
    .join('\n\n');
}

/**
 * Full pipeline: raw transcript text → suggestions JSON.
 */
export function processNarrationTranscript(transcript, options = {}) {
  const segments = parseTranscriptToSegments(transcript);
  return {
    segments,
    ...buildNarrationSuggestions(segments, options),
  };
}

/** Merge accepted suggestion lines into existing play-by-play text. */
export function mergeSuggestionsIntoPlayByPlay(existingText, acceptedLines) {
  const existing = (existingText || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const incoming = (acceptedLines || []).map((l) => l.trim()).filter(Boolean);
  const merged = [...existing];

  for (const line of incoming) {
    if (!merged.includes(line)) merged.push(line);
  }

  merged.sort((a, b) => {
    const ta = parseClockToSeconds(a.match(/^(\d{1,2}:\d{2})/)?.[1] || '') ?? 0;
    const tb = parseClockToSeconds(b.match(/^(\d{1,2}:\d{2})/)?.[1] || '') ?? 0;
    return ta - tb;
  });

  return merged.join('\n');
}
