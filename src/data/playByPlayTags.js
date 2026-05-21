/** Quick-insert play-by-play lines — wording matches Film Room parser in playEvents.js */

export const PLAY_BY_PLAY_TAG_GROUPS = [
  {
    label: 'Shooting',
    tags: [
      { label: 'Make 3 PT', line: 'Make 3 PT' },
      { label: 'Make 2 PT', line: 'Make 2 PT' },
      { label: 'Miss 3 PT', line: 'Miss 3 PT' },
      { label: 'Miss 2 PT', line: 'Miss 2 PT' },
      { label: 'Make FT', line: 'Make FT' },
      { label: 'Miss FT', line: 'Miss FT' },
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
    label: 'Rebounds & blocks',
    tags: [
      { label: 'Off reb', line: 'Off reb' },
      { label: 'Def reb', line: 'Def reb' },
      { label: 'Block', line: 'Block' },
    ],
  },
  {
    label: 'Defense',
    tags: [
      { label: 'Def', line: 'Def' },
      { label: 'Steal', line: 'Steal' },
    ],
  },
  {
    label: 'Fouls',
    tags: [
      { label: 'PF', line: 'Personal foul' },
      { label: 'Foul drawn', line: 'Foul drawn' },
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
