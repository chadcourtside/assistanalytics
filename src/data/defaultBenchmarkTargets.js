/** Default development benchmark targets (cloned per new player). */
export const DEFAULT_BENCHMARK_TARGETS = [
  { metricKey: 'mins', label: 'Minutes', target4: '16+', target12: '18 - 24' },
  { metricKey: 'pts', label: 'Points', target4: '6 - 10', target12: '8 - 14' },
  { metricKey: 'threePa', label: '3PT Attempts', target4: '2 - 4', target12: '3 - 5', isKey: true },
  { metricKey: 'tpPct', label: '3PT %', target4: '35%+', target12: '35 - 38%+', format: '%', isKey: true },
  { metricKey: 'ast', label: 'Assists', target4: '2 - 4', target12: '3 - 5' },
  { metricKey: 'astHqpa', label: 'AST + HQPA', target4: '3 - 6', target12: '5+', isKey: true },
  { metricKey: 'ptch', label: 'Paint Touches', target4: '3 - 5', target12: '5+', isKey: true },
  { metricKey: 'reb', label: 'Rebounds', target4: '3 - 5', target12: '4 - 6' },
  { metricKey: 'defl', label: 'Deflections', target4: '2 - 4', target12: '4+' },
  { metricKey: 'tov', label: 'Turnovers', target4: '≤ 2', target12: '≤ 2', isLowerBetter: true },
  { metricKey: 'liveBallTov', label: 'Initiator LB TOV', target4: '≤ 0.5', target12: 'Near Zero', isKey: true, isLowerBetter: true },
  { metricKey: 'astTo', label: 'AST:TO Ratio', target4: '1.5:1', target12: '2:1+' },
];

export function createBenchmarkSet(playerId, id) {
  return {
    id,
    playerId,
    name: 'Development Benchmarks',
    targets: DEFAULT_BENCHMARK_TARGETS.map((t) => ({ ...t })),
  };
}
