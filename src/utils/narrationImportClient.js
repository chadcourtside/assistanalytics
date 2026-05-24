import { processNarrationTranscript } from '../../shared/narrationImport.js';
import { requestNarrationSuggestions as fetchFromApi } from '../api/cloudApi';

/**
 * Request play-by-play suggestions from API when authed, else local stub parser (paste only).
 */
export async function requestNarrationSuggestions({
  transcript,
  playerName,
  audioBase64,
  audioMimeType,
  audioFileName,
}) {
  if (audioBase64) {
    return fetchFromApi({
      playerName,
      audioBase64,
      audioMimeType,
      audioFileName,
    });
  }

  try {
    return await fetchFromApi({ transcript, playerName });
  } catch (err) {
    if (err.status === 401 || err.status === 404 || err.status === 503) {
      return processNarrationTranscript(transcript, { playerName });
    }
    throw err;
  }
}
