/**
 * Sideline narration vocabulary — single source for cheat sheet UI and speech mapping docs.
 * "savesAs" matches playByPlayTags.js / Film Room parser canonical lines.
 */

export const NARRATION_TIPS = [
  'Say one short phrase per event — pause briefly between plays.',
  'You do not need to say the game clock; timestamps come from the recording.',
  'Combine related tags in one breath: “make two paint touch”, “assist paint touch”.',
  'Only narrate your player’s events unless you add a Note.',
];

export const NARRATION_AVOID = [
  'Short cheerleading without a tag: “nice”, “good”, “great”, “wow”, “come on”, “let’s go”.',
  'Game admin words: “sub”, “timeout”, “quarter”, “halftime”.',
];

/** @typedef {{ say: string[], savesAs: string, hint?: string }} NarrationEntry */
/** @typedef {{ label: string, entries: NarrationEntry[] }} NarrationVocabGroup */

/** @type {NarrationVocabGroup[]} */
export const NARRATION_VOCAB_GROUPS = [
  {
    label: 'Shooting',
    entries: [
      { say: ['make two', 'made two', 'make 2'], savesAs: 'Make 2 PT' },
      { say: ['miss two', 'missed two', 'miss 2'], savesAs: 'Miss 2 PT' },
      { say: ['make three', 'make 3', 'three pointer', 'made three'], savesAs: 'Make 3 PT' },
      { say: ['miss three', 'miss 3', 'missed three'], savesAs: 'Miss 3 PT' },
      { say: ['make free throw', 'made FT', 'FT make', 'make FT'], savesAs: 'Make FT' },
      { say: ['miss free throw', 'missed FT', 'miss FT'], savesAs: 'Miss FT' },
    ],
  },
  {
    label: 'Playmaking',
    entries: [
      { say: ['assist'], savesAs: 'Assist' },
      { say: ['second assist', '2nd assist', 'hockey assist', '2nd ast'], savesAs: '2nd Assist' },
      { say: ['screen assist', 'scr ast'], savesAs: 'Screen assist' },
      {
        say: ['HQPA', 'clean entry', 'potential assist'],
        savesAs: 'HQPA',
        hint: 'High-quality potential assist',
      },
      { say: ['paint touch', 'PTCH'], savesAs: 'Paint touch' },
    ],
  },
  {
    label: 'Rebounds & blocks',
    entries: [
      { say: ['off reb', 'offensive reb', 'OREB'], savesAs: 'Off reb' },
      { say: ['def reb', 'defensive reb', 'DREB'], savesAs: 'Def reb' },
      {
        say: ['rebound', 'reb'],
        savesAs: 'Def reb',
        hint: 'Generic “rebound” maps to defensive rebound',
      },
      { say: ['block', 'blk'], savesAs: 'Block' },
    ],
  },
  {
    label: 'Defense',
    entries: [
      { say: ['steal', 'STL'], savesAs: 'Steal' },
      { say: ['def', 'deflection', 'defl'], savesAs: 'Def', hint: 'Defensive play / deflection' },
    ],
  },
  {
    label: 'Fouls',
    entries: [
      { say: ['foul drawn', 'drawn foul', 'FD'], savesAs: 'Foul drawn' },
      { say: ['personal foul', 'PF'], savesAs: 'Personal foul' },
    ],
  },
  {
    label: 'Turnovers',
    entries: [
      { say: ['live ball turnover', 'LB TOV'], savesAs: 'LB TOV' },
      { say: ['turnover', 'TOV', 'DB TOV', 'DB turnover', 'dead ball turnover'], savesAs: 'TOV' },
    ],
  },
  {
    label: 'Notes',
    entries: [
      {
        say: ['note: …'],
        savesAs: 'Note: …',
        hint: 'Custom timestamped observation — not a box-score stat',
      },
    ],
  },
];

/** Flat list of every canonical tag line from the tag bar. */
export function getCanonicalPlayTags() {
  const tags = new Set();
  for (const group of NARRATION_VOCAB_GROUPS) {
    for (const entry of group.entries) {
      if (!entry.savesAs.startsWith('Note:')) tags.add(entry.savesAs);
    }
  }
  return [...tags];
}
