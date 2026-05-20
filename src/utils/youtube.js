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
