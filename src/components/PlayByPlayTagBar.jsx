import { useRef } from 'react';
import { PLAY_BY_PLAY_TAG_GROUPS } from '../data/playByPlayTags';
import { insertPlayByPlayLine } from '../utils/playByPlayForm';

const tagButtonClass =
  'px-2 py-1 text-xs font-semibold rounded-md border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 text-gray-700';

export default function PlayByPlayTagBar({ playByPlayText, timeStr, onChange, textareaRef }) {
  const pendingFocusRef = useRef(null);

  const insertTag = (line) => {
    const textarea = textareaRef?.current;
    const next = insertPlayByPlayLine({
      currentText: playByPlayText,
      timeStr,
      description: line,
      textarea,
    });
    onChange(next);

    if (textarea) {
      pendingFocusRef.current = next.length;
      requestAnimationFrame(() => {
        textarea.focus();
        const pos = pendingFocusRef.current ?? next.length;
        textarea.setSelectionRange(pos, pos);
        pendingFocusRef.current = null;
      });
    }
  };

  return (
    <div className="space-y-3 mb-2">
      <p className="text-xs text-gray-500">
        Set a timestamp, then tap a tag to insert a formatted line. Edit the time before each clip.
      </p>
      {PLAY_BY_PLAY_TAG_GROUPS.map((group) => (
        <div key={group.label}>
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            {group.label}
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
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
        </div>
      ))}
    </div>
  );
}
