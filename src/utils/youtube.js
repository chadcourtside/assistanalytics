export function getYoutubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function parseTime(str) {
  const match = str.match(/\[?\s*(\d{1,2}:\d{2})\s*\]?/);
  if (!match) return 0;
  const [m, s] = match[1].split(':');
  return parseInt(m, 10) * 60 + parseInt(s, 10);
}

/** Seconds before the tagged moment to start embedded playback. */
export function getEmbedStartSeconds(clipSeconds, preroll = 3) {
  const sec = Number(clipSeconds) || 0;
  const lead = Number(preroll) || 0;
  return Math.max(0, sec - lead);
}

export function getYoutubeWatchUrl(videoId, seconds = 0) {
  if (!videoId) return null;
  const t = Math.max(0, Math.floor(Number(seconds) || 0));
  return `https://www.youtube.com/watch?v=${videoId}&t=${t}s`;
}

export const FILM_PREROLL_OPTIONS = [1, 3, 5];
export const FILM_PREROLL_STORAGE_KEY = 'assistanalytics-film-preroll';

export function loadFilmPreroll() {
  try {
    const n = parseInt(localStorage.getItem(FILM_PREROLL_STORAGE_KEY), 10);
    if (FILM_PREROLL_OPTIONS.includes(n)) return n;
  } catch {
    // ignore
  }
  return 3;
}

export function saveFilmPreroll(seconds) {
  try {
    localStorage.setItem(FILM_PREROLL_STORAGE_KEY, String(seconds));
  } catch {
    // ignore
  }
}
