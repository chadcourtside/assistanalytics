import { getSortedTypeBadges } from '../utils/playEvents';

const baseBadge = 'inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border';

export default function ClipTypeBadges({ types, variant = 'light', className = '' }) {
  const badges = getSortedTypeBadges(types);
  if (badges.length === 0) return null;

  const isDark = variant === 'dark';

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {badges.map((badge) => (
        <span
          key={badge.type}
          className={`${baseBadge} ${isDark ? badge.darkClassName : badge.className}`}
        >
          {badge.short}
        </span>
      ))}
    </div>
  );
}
