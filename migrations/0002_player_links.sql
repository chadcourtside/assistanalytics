-- Player portal magic links (one active link per player per team workspace)

CREATE TABLE IF NOT EXISTS player_links (
  token TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE (team_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_player_links_team_player ON player_links(team_id, player_id);
