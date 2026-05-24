import { processNarrationTranscript } from '../../shared/narrationImport.js';

export function handleNarrationToPlayByPlay(body) {
  const transcript = (body?.transcript || '').trim();
  if (!transcript) {
    return { error: 'Transcript text is required', status: 400 };
  }

  if (transcript.length > 200_000) {
    return { error: 'Transcript is too long', status: 400 };
  }

  const playerName = (body?.playerName || '').trim();
  const result = processNarrationTranscript(transcript, { playerName });

  return {
    ok: true,
    stub: true,
    segments: result.segments.length,
    suggestions: result.suggestions,
    warnings: result.warnings,
  };
}
