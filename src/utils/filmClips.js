import { getYoutubeId } from './youtube';
import { playEventsFromPlayByPlay } from './playEvents';

export function makeClipId(gameId, eventIndex) {
  return `${gameId}-${eventIndex}`;
}

export function parseClipId(clipId) {
  if (!clipId || typeof clipId !== 'string') return null;
  const lastDash = clipId.lastIndexOf('-');
  if (lastDash <= 0) return null;
  const gameId = clipId.slice(0, lastDash);
  const index = parseInt(clipId.slice(lastDash + 1), 10);
  if (Number.isNaN(index)) return null;
  return { gameId, index };
}

export function buildClipsFromGames(games) {
  return (games ?? []).reduce((acc, game) => {
    const videoId = getYoutubeId(game.videoUrl);
    if (!videoId) return acc;

    const events = playEventsFromPlayByPlay(game.playByPlay || []);

    const clips = events
      .map((event, index) => {
        if (!event.timeStr) return null;
        return {
          id: makeClipId(game.id, index),
          gameId: game.id,
          eventIndex: index,
          opponent: game.opponent,
          videoId,
          timeStr: event.timeStr,
          seconds: event.seconds ?? 0,
          rawDesc: event.description ?? event.raw ?? '',
          types: event.types ?? ['other'],
        };
      })
      .filter(Boolean);

    return [...acc, ...clips];
  }, []);
}

export function isClipStarredForPlayer(game, clipId) {
  return (game?.starredClipIds ?? []).includes(clipId);
}
