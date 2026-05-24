import { whisperSegmentsToTranscript } from '../../shared/narrationImport.js';

const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'video/mp4',
]);

function decodeBase64Audio(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function extensionForMime(mime) {
  const map = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/mp4': 'm4a',
    'audio/m4a': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'video/mp4': 'm4a',
  };
  return map[mime] || 'm4a';
}

/**
 * Transcribe audio with OpenAI Whisper (verbose_json for segment timestamps).
 * @returns {Promise<{ transcript: string, segments: object[], durationSeconds?: number }>}
 */
export async function transcribeAudioWithWhisper(env, { audioBase64, audioMimeType, audioFileName }) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      error: 'Audio transcription is not configured. Paste a transcript instead, or set OPENAI_API_KEY.',
      status: 503,
    };
  }

  if (!audioBase64 || typeof audioBase64 !== 'string') {
    return { error: 'Audio data is required', status: 400 };
  }

  let bytes;
  try {
    bytes = decodeBase64Audio(audioBase64);
  } catch {
    return { error: 'Invalid audio encoding', status: 400 };
  }

  if (bytes.byteLength > MAX_AUDIO_BYTES) {
    return { error: 'Audio file is too large (max 25 MB)', status: 400 };
  }

  if (bytes.byteLength < 100) {
    return { error: 'Audio file is too small', status: 400 };
  }

  const mime = (audioMimeType || 'audio/m4a').toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    return { error: 'Unsupported audio format. Use MP3, M4A, WAV, or WebM.', status: 400 };
  }

  const ext = (audioFileName || '').split('.').pop()?.toLowerCase() || extensionForMime(mime);
  const fileName = audioFileName || `narration.${ext}`;

  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mime }), fileName);
  form.append('model', 'whisper-1');
  form.append('response_format', 'verbose_json');
  form.append('language', 'en');

  const response = await fetch(WHISPER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('Whisper API error', response.status, body.slice(0, 500));
    return {
      error: 'Transcription failed. Try a shorter clip or paste the transcript manually.',
      status: 502,
    };
  }

  const data = await response.json();
  const segments = Array.isArray(data.segments) ? data.segments : [];
  const transcript =
    segments.length > 0
      ? whisperSegmentsToTranscript(segments)
      : (data.text || '').trim();

  if (!transcript) {
    return { error: 'No speech detected in the audio', status: 422 };
  }

  return {
    transcript,
    segments,
    durationSeconds: typeof data.duration === 'number' ? data.duration : undefined,
  };
}
