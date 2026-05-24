import NarrationCheatSheetContent from './NarrationCheatSheetContent';

export default function NarrationCheatSheetModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 no-print"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        role="dialog"
        aria-labelledby="narration-cheat-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 id="narration-cheat-sheet-title" className="text-xl font-bold text-gray-800">
              Narration cheat sheet
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Phrases for sideline voice-over and Import from narration (Whisper).
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

        <div className="overflow-y-auto flex-1 p-5">
          <NarrationCheatSheetContent />
        </div>

        <div className="px-5 py-4 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-md font-semibold text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
