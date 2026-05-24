import { useMemo, useState } from 'react';
import { getYoutubeId, getYoutubeWatchUrl, parseTime } from '../utils/youtube';
import { mergeSuggestionsIntoPlayByPlay } from '../../shared/narrationImport.js';
import { requestNarrationSuggestions } from '../utils/narrationImportClient';
import { NARRATION_AUDIO_ACCEPT, readAudioFileAsBase64 } from '../utils/audioUpload';
import NarrationCheatSheetModal from './NarrationCheatSheetModal';

const EXAMPLE_TRANSCRIPT = `00:00:25.000 --> 00:00:27.000
paint touch assist

00:03:50.000 --> 00:03:52.000
make two paint touch

00:05:30.000 --> 00:05:32.000
make three

00:06:14.000 --> 00:06:16.000
assist

00:06:50.000 --> 00:06:52.000
live ball turnover`;

const CONFIDENCE_STYLES = {
  high: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-slate-100 text-slate-600',
};

const FLAG_STYLES = {
  corrected: 'bg-sky-100 text-sky-800',
  uncertain: 'bg-orange-100 text-orange-800',
  reviewLater: 'bg-fuchsia-100 text-fuchsia-800',
};

const FLAG_LABELS = {
  corrected: 'Corrected',
  uncertain: 'Uncertain',
  reviewLater: 'Review later',
};

function SuggestionFlags({ flags = [] }) {
  if (!flags.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {flags.map((flag) => (
        <span
          key={flag}
          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${FLAG_STYLES[flag] || 'bg-gray-100 text-gray-600'}`}
        >
          {FLAG_LABELS[flag] || flag}
        </span>
      ))}
    </div>
  );
}

export default function NarrationImportModal({
  playerName = '',
  videoUrl = '',
  existingPlayByPlayText = '',
  onApply,
  onClose,
}) {
  const [step, setStep] = useState('input');
  const [inputMode, setInputMode] = useState('paste');
  const [transcript, setTranscript] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [transcriptionSource, setTranscriptionSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [cheatSheetOpen, setCheatSheetOpen] = useState(false);

  const videoId = getYoutubeId(videoUrl);

  const acceptedCount = useMemo(
    () => suggestions.filter((s) => s.accepted).length,
    [suggestions]
  );

  const canGenerate =
    inputMode === 'paste' ? Boolean(transcript.trim()) : Boolean(audioFile);

  const applyResult = (result) => {
    setSuggestions(result.suggestions || []);
    setWarnings(result.warnings || []);
    if (result.transcript) setTranscript(result.transcript);
    setTranscriptionSource(result.transcriptionSource || 'paste');
    setStep('review');
  };

  const handleGenerate = async () => {
    setError('');
    setLoading(true);
    try {
      if (inputMode === 'audio' && audioFile) {
        const audioPayload = await readAudioFileAsBase64(audioFile);
        const result = await requestNarrationSuggestions({
          playerName,
          ...audioPayload,
        });
        applyResult(result);
      } else {
        const result = await requestNarrationSuggestions({
          transcript,
          playerName,
        });
        applyResult(result);
      }
    } catch (err) {
      setError(err.message || 'Could not generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const toggleAccepted = (id) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, accepted: !s.accepted } : s))
    );
  };

  const updateLine = (id, line) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, line, accepted: line.trim().length > 0 } : s))
    );
  };

  const acceptHighConfidence = () => {
    setSuggestions((prev) =>
      prev.map((s) => ({
        ...s,
        accepted:
          (s.confidence === 'high' || s.confidence === 'medium') &&
          !(s.flags || []).includes('uncertain') &&
          !(s.flags || []).includes('reviewLater'),
      }))
    );
  };

  const handleApply = () => {
    const lines = suggestions.filter((s) => s.accepted && s.line.trim()).map((s) => s.line.trim());
    const merged = mergeSuggestionsIntoPlayByPlay(existingPlayByPlayText, lines);
    onApply(merged);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 no-print">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col"
        role="dialog"
        aria-labelledby="narration-import-title"
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 id="narration-import-title" className="text-xl font-bold text-gray-800">
              Import from narration
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload sideline audio or paste a transcript. Whisper transcribes speech; you review
              every line before it enters play-by-play.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {step === 'input' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <p className="font-semibold">How to narrate</p>
                  <button
                    type="button"
                    onClick={() => setCheatSheetOpen(true)}
                    className="text-xs font-semibold text-violet-700 hover:text-violet-900 underline underline-offset-2 shrink-0"
                  >
                    Full cheat sheet
                  </button>
                </div>
                <p>
                  Say short tags at each moment: &quot;make two&quot;, &quot;paint touch&quot;,
                  &quot;assist&quot;, &quot;live ball turnover&quot;. Fix mistakes with
                  &quot;correction missed two&quot;, &quot;scratch that&quot;, or &quot;mark
                  uncertain&quot;.
                </p>
              </div>

              <div className="flex gap-2 border-b border-gray-200 pb-2">
                <button
                  type="button"
                  onClick={() => setInputMode('audio')}
                  className={`px-4 py-2 text-sm font-semibold rounded-t-md border-b-2 ${
                    inputMode === 'audio'
                      ? 'border-violet-600 text-violet-800'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Upload audio
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={`px-4 py-2 text-sm font-semibold rounded-t-md border-b-2 ${
                    inputMode === 'paste'
                      ? 'border-violet-600 text-violet-800'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Paste transcript
                </button>
              </div>

              {inputMode === 'audio' ? (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">
                    Voice memo / narration audio
                    <input
                      type="file"
                      accept={NARRATION_AUDIO_ACCEPT}
                      onChange={(e) => {
                        setAudioFile(e.target.files?.[0] || null);
                        setError('');
                      }}
                      className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-violet-50 file:text-violet-800 file:font-semibold hover:file:bg-violet-100"
                    />
                  </label>
                  {audioFile && (
                    <p className="text-sm text-gray-600">
                      Selected: <span className="font-medium">{audioFile.name}</span> (
                      {(audioFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    MP3, M4A, WAV, or WebM up to 25 MB. Requires cloud sign-in and{' '}
                    <code className="text-gray-500">OPENAI_API_KEY</code> on the server.
                  </p>
                </div>
              ) : (
                <>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">
                    Transcript
                    <textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      rows={12}
                      className="mt-1 w-full text-sm px-3 py-2 border border-gray-300 rounded-md font-mono focus:ring focus:ring-blue-200 focus:outline-none"
                      placeholder={EXAMPLE_TRANSCRIPT}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setTranscript(EXAMPLE_TRANSCRIPT)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Load example transcript
                  </button>
                </>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}
            </>
          )}

          {step === 'review' && (
            <>
              {transcriptionSource === 'whisper' && (
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-sm text-violet-900">
                  Transcribed with Whisper. Edit the transcript below if needed, then regenerate or
                  adjust individual lines.
                </div>
              )}

              {warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900 space-y-1">
                  {warnings.slice(0, 8).map((w) => (
                    <p key={w}>{w}</p>
                  ))}
                  {warnings.length > 8 && (
                    <p className="text-xs text-amber-700">+ {warnings.length - 8} more skipped lines</p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 items-center justify-between">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">{acceptedCount}</span> of{' '}
                  {suggestions.length} selected
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={acceptHighConfidence}
                    className="text-xs font-semibold px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    Accept medium &amp; high
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    className="text-xs font-semibold px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    Back to input
                  </button>
                </div>
              </div>

              {transcript && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-semibold text-gray-600">
                    View transcript ({transcriptionSource === 'whisper' ? 'Whisper' : 'pasted'})
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-50 border border-gray-200 rounded-md text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {transcript}
                  </pre>
                </details>
              )}

              {suggestions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No suggestions — try different phrasing or check timestamps.
                </p>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-3 py-2 w-10">Use</th>
                        <th className="px-3 py-2 w-16">Time</th>
                        <th className="px-3 py-2">Play-by-play line</th>
                        <th className="px-3 py-2 hidden md:table-cell">Heard</th>
                        <th className="px-3 py-2 w-20">Conf.</th>
                        {videoId && <th className="px-3 py-2 w-16">Film</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {suggestions.map((s) => (
                        <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 align-top">
                            <input
                              type="checkbox"
                              checked={s.accepted}
                              onChange={() => toggleAccepted(s.id)}
                              aria-label={`Include ${s.line}`}
                            />
                          </td>
                          <td className="px-3 py-2 align-top font-mono text-gray-600">{s.time}</td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="text"
                              value={s.line}
                              onChange={(e) => updateLine(s.id, e.target.value)}
                              className="w-full text-sm px-2 py-1 border border-gray-300 rounded font-mono"
                            />
                            <SuggestionFlags flags={s.flags} />
                          </td>
                          <td className="px-3 py-2 align-top hidden md:table-cell text-gray-500 text-xs">
                            {s.sourceText}
                          </td>
                          <td className="px-3 py-2 align-top">
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${CONFIDENCE_STYLES[s.confidence] || CONFIDENCE_STYLES.low}`}
                            >
                              {s.confidence}
                            </span>
                          </td>
                          {videoId && (
                            <td className="px-3 py-2 align-top">
                              <a
                                href={getYoutubeWatchUrl(videoId, parseTime(s.time))}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                              >
                                ▶
                              </a>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-md font-semibold text-sm"
          >
            Cancel
          </button>
          {step === 'input' ? (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-md font-semibold text-sm"
            >
              {loading
                ? inputMode === 'audio'
                  ? 'Transcribing…'
                  : 'Generating…'
                : inputMode === 'audio'
                  ? 'Transcribe & suggest'
                  : 'Generate suggestions'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              disabled={acceptedCount === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-md font-semibold text-sm"
            >
              Apply {acceptedCount} line{acceptedCount === 1 ? '' : 's'}
            </button>
          )}
        </div>
      </div>

      {cheatSheetOpen && <NarrationCheatSheetModal onClose={() => setCheatSheetOpen(false)} />}
    </div>
  );
}
