import { getStatEntry, formatStatTooltip } from '../data/statGlossary';

/**
 * Inline stat label with hover tooltip from the glossary.
 * Pass statId (glossary id) or children for display text.
 */
export default function StatHelp({ statId, children, className = '' }) {
  const entry = getStatEntry(statId);
  const text = children ?? entry?.abbrev ?? statId;
  const tooltip = entry ? formatStatTooltip(entry) : undefined;

  if (!tooltip) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span
      className={`border-b border-dotted border-gray-400 cursor-help ${className}`}
      title={tooltip}
      tabIndex={0}
      aria-label={tooltip}
    >
      {text}
    </span>
  );
}
