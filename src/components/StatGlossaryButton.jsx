import { useState } from 'react';
import StatGlossaryModal from './StatGlossaryModal';

export default function StatGlossaryButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm border border-slate-600 text-slate-200 hover:bg-slate-800 px-3 py-2 rounded-md font-semibold whitespace-nowrap"
        title="Open stat definitions"
      >
        Stat Guide
      </button>
      {open && <StatGlossaryModal onClose={() => setOpen(false)} />}
    </>
  );
}
