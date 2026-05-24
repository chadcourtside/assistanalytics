export function normalizeSeasonList(seasons) {
  if (!Array.isArray(seasons)) return [];
  return [...new Set(seasons.map((s) => String(s).trim()).filter(Boolean))];
}

export function getWorkspaceCurrentSeason(meta) {
  return (meta?.currentSeason || '').trim() || null;
}

export function getArchivedSeasons(meta) {
  return normalizeSeasonList(meta?.archivedSeasons);
}

export function isArchivedSeason(meta, seasonLabel) {
  const label = (seasonLabel || '').trim();
  if (!label) return false;
  return getArchivedSeasons(meta).includes(label);
}

export function archiveSeason(meta, seasonLabel) {
  const label = (seasonLabel || '').trim();
  if (!label) return { error: 'Season label is required' };

  const archived = getArchivedSeasons(meta);
  if (archived.includes(label)) {
    return { error: 'That season is already archived' };
  }

  const nextArchived = [...archived, label].sort();
  let nextCurrent = getWorkspaceCurrentSeason(meta);
  if (nextCurrent === label) {
    nextCurrent = '';
  }

  return {
    meta: {
      ...meta,
      archivedSeasons: nextArchived,
      currentSeason: nextCurrent,
    },
  };
}

export function setWorkspaceCurrentSeason(meta, seasonLabel) {
  const label = (seasonLabel || '').trim();
  return {
    ...meta,
    currentSeason: label || undefined,
  };
}
