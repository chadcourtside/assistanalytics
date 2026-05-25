import { useMemo, useState } from 'react';
import { PLAY_BY_PLAY_TAG_GROUPS } from '../data/playByPlayTags';
import { insertPlayByPlayLine } from '../utils/playByPlayForm';

const tagButtonClass =
  'px-2 py-1 text-xs font-semibold rounded-md border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 text-gray-700';

const quickTagButtonClass =
  'px-2.5 py-1.5 text-xs font-bold rounded-md border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800';

/** Most-tagged sideline shortcuts — always visible. */
const QUICK_TAGS = [
  { label: 'PTCH', line: 'Paint touch' },
  { label: 'Make 2', line: 'Make 2 PT' },
  { label: 'Make 3', line: 'Make 3 PT' },
  { label: 'Ast', line: 'Assist' },
  { label: 'LB TOV', line: 'LB TOV' },
  { label: 'Def reb', line: 'Def reb' },
  { label: 'TOV', line: 'TOV' },
  { label: 'Def', line: 'Def' },
];

export default function PlayByPlayTagBar({
  playByPlayText,
  timeStr,
  onChange,
  textareaRef,
  onAfterInsert,
  lastTagLine,
  onRepeatLast,
}) {
  const [expandedGroups, setExpandedGroups] = useState(() =>
    Object.fromEntries(PLAY_BY_PLAY_TAG_GROUPS.map((g) => [g.label, g.label === 'Shooting' || g.label === 'Playmaking']))
  );

  const insertTag = (line) => {
    const textarea = textareaRef?.current;
    const next = insertPlayByPlayLine({
      currentText: playByPlayText,
      timeStr,
      description: line,
      textarea,
    });
    onChange(next);
    onAfterInsert?.(line, timeStr);

    if (textarea) {
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(next.length, next.length);
      });
    }
  };

  const toggleGroup = (label) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const lineCount = useMemo(
    () => playByPlayText.split('\n').filter((l) => l.trim()).length,
    [playByPlayText]
  );

  return (
    <div className="space-y-3 mb-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-500">
          Tap a tag to insert at the clip time · {lineCount} line{lineCount === 1 ? '' : 's'} logged
        </p>
        {lastTagLine && onRepeatLast && (
          <button
            type="button"
            onClick={onRepeatLast}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900"
          >
            Repeat last tag
          </button>
        )}
      </div>

      <div className="p-2 rounded-md border border-blue-100 bg-blue-50/60">
        <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600">Quick tags</span>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag.label}
              type="button"
              onClick={() => insertTag(tag.line)}
              className={quickTagButtonClass}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {PLAY_BY_PLAY_TAG_GROUPS.map((group) => (
        <div key={group.label} className="border border-gray-100 rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => toggleGroup(group.label)}
            className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-left"
          >
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
              {group.label}
            </span>
            <span className="text-xs text-gray-400">{expandedGroups[group.label] ? '−' : '+'}</span>
          </button>
          {expandedGroups[group.label] && (
            <div className="flex flex-wrap gap-1.5 p-2">
              {group.tags.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => insertTag(tag.line)}
                  className={tagButtonClass}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
