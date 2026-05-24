import { processNarrationTranscript } from '../../shared/narrationImport.js';
import { requestNarrationSuggestions as fetchFromApi } from '../api/cloudApi';

/**
 * Request play-by-play suggestions from API when authed, else local stub parser.
 */
export async function requestNarrationSuggestions({ transcript, playerName }) {
  try {
    return await fetchFromApi({ transcript, playerName });
  } catch (err) {
    if (err.status === 401 || err.status === 404 || err.status === 503) {
      return processNarrationTranscript(transcript, { playerName });
    }
    throw err;
  }
}
