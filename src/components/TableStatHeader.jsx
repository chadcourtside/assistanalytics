import StatHelp from './StatHelp';

export default function TableStatHeader({ statId, children, className = 'px-3 py-2' }) {
  return (
    <th className={className}>
      <StatHelp statId={statId}>{children}</StatHelp>
    </th>
  );
}
