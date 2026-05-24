import { useMemo, useState } from 'react';
import { getYoutubeId, getYoutubeWatchUrl, parseTime } from '../utils/youtube';
import { mergeSuggestionsIntoPlayByPlay } from '../../shared/narrationImport.js';
import { requestNarrationSuggestions } from '../utils/narrationImportClient';

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

export default function NarrationImportModal({
  playerName = '',
  videoUrl = '',
  existingPlayByPlayText = '',
  onApply,
  onClose,
}) {
  const [step, setStep] = useState('input');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const videoId = getYoutubeId(videoUrl);

  const acceptedCount = useMemo(
    () => suggestions.filter((s) => s.accepted).length,
    [suggestions]
  );

  const handleGenerate = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await requestNarrationSuggestions({
        transcript,
        playerName,
      });
      setSuggestions(result.suggestions || []);
      setWarnings(result.warnings || []);
      setStep('review');
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
        accepted: s.confidence === 'high' || s.confidence === 'medium',
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
              Paste a timestamped transcript from sideline voice-over or YouTube captions. Review
              suggestions before adding to play-by-play.
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
                <p className="font-semibold mb-1">How to narrate</p>
                <p>
                  Say short tags at each moment: &quot;make two&quot;, &quot;paint touch&quot;,
                  &quot;assist&quot;, &quot;live ball turnover&quot;. Timestamps come from the
                  transcript — you don&apos;t need to say the clock aloud.
                </p>
              </div>

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

              {error && <p className="text-sm text-red-600">{error}</p>}
            </>
          )}

          {step === 'review' && (
            <>
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
                    Edit transcript
                  </button>
                </div>
              </div>

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

              <p className="text-xs text-gray-400">
                Stub parser (PR1) — rule-based mapping. Whisper + LLM normalization coming next.
              </p>
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
              disabled={!transcript.trim() || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-md font-semibold text-sm"
            >
              {loading ? 'Generating…' : 'Generate suggestions'}
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
    </div>
  );
}
