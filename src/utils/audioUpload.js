const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = ['.mp3', '.m4a', '.wav', '.webm', '.ogg', '.mp4', '.mpeg'];

export const NARRATION_AUDIO_ACCEPT = 'audio/*,.m4a,.mp3,.wav,.webm,.mp4';

export function isAcceptedNarrationFile(file) {
  if (!file) return false;
  if (file.type.startsWith('audio/') || file.type === 'video/mp4') return true;
  const name = (file.name || '').toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

/**
 * Read an audio File as base64 payload for the transcription API.
 * @returns {Promise<{ audioBase64: string, audioMimeType: string, audioFileName: string }>}
 */
export function readAudioFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected'));
      return;
    }
    if (!isAcceptedNarrationFile(file)) {
      reject(new Error('Use MP3, M4A, WAV, or WebM audio'));
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      reject(new Error('Audio must be 25 MB or smaller'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') {
        reject(new Error('Could not read audio file'));
        return;
      }
      const comma = dataUrl.indexOf(',');
      const audioBase64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
      resolve({
        audioBase64,
        audioMimeType: file.type || 'audio/m4a',
        audioFileName: file.name || 'narration.m4a',
      });
    };
    reader.onerror = () => reject(new Error('Could not read audio file'));
    reader.readAsDataURL(file);
  });
}
