/** Quick-insert play-by-play lines — wording matches Film Room parser in playEvents.js */

export const PLAY_BY_PLAY_TAG_GROUPS = [
  {
    label: 'Shooting',
    tags: [
      { label: 'Make 3 PT', line: 'Make 3 PT' },
      { label: 'Make 2 PT', line: 'Make 2 PT' },
      { label: 'Miss 3 PT', line: 'Miss 3 PT' },
      { label: 'Miss 2 PT', line: 'Miss 2 PT' },
    ],
  },
  {
    label: 'Playmaking',
    tags: [
      { label: 'Assist', line: 'Assist' },
      { label: 'HQPA', line: 'HQPA' },
      { label: 'Paint touch', line: 'Paint touch' },
    ],
  },
  {
    label: 'Defense',
    tags: [
      { label: 'Def reb', line: 'Def reb' },
      { label: 'Def', line: 'Def' },
      { label: 'Steal', line: 'Steal' },
    ],
  },
  {
    label: 'Turnovers',
    tags: [
      { label: 'TOV', line: 'TOV' },
      { label: 'LB TOV', line: 'LB TOV' },
    ],
  },
];
