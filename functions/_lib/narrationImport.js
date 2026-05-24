import { processNarrationTranscript } from '../../shared/narrationImport.js';
import { transcribeAudioWithWhisper } from './openaiWhisper.js';

export async function handleNarrationToPlayByPlay(body, env) {
  const playerName = (body?.playerName || '').trim();
  let transcript = (body?.transcript || '').trim();
  const warnings = [];
  let transcriptionSource = 'paste';

  const hasAudio = Boolean(body?.audioBase64);
  if (!transcript && !hasAudio) {
    return { error: 'Transcript text or audio is required', status: 400 };
  }

  if (hasAudio) {
    const transcribed = await transcribeAudioWithWhisper(env, {
      audioBase64: body.audioBase64,
      audioMimeType: body.audioMimeType,
      audioFileName: body.audioFileName,
    });
    if (transcribed.error) {
      return { error: transcribed.error, status: transcribed.status || 502 };
    }
    transcript = transcribed.transcript.trim();
    transcriptionSource = 'whisper';
    if (transcribed.durationSeconds) {
      warnings.push(`Transcribed ${Math.round(transcribed.durationSeconds)}s of audio with Whisper.`);
    } else {
      warnings.push('Transcribed audio with Whisper.');
    }
  }

  if (transcript.length > 200_000) {
    return { error: 'Transcript is too long', status: 400 };
  }

  const result = processNarrationTranscript(transcript, { playerName });

  return {
    ok: true,
    stub: transcriptionSource !== 'whisper',
    transcriptionSource,
    transcript,
    segments: result.segments.length,
    suggestions: result.suggestions,
    warnings: [...warnings, ...result.warnings],
  };
}
