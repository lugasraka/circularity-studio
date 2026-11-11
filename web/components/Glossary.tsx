"use client";

import { HelpCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const GLOSSARY: Record<string, string> = {
  virgin: "Newly extracted material, not recycled. The stuff we are trying to avoid.",
  VM: "Virgin Material (kg). Total new material in the product + scrap.",
  TM: "Total Material (kg). Virgin + recycled/reused input.",
  P: "Product mass (kg). What ships.",
  US: "Useful Service. e.g. 'one drill over 8 years'. Never 'one drill'.",
  "VM/US": "Headline metric: kg virgin per unit of service. Lower is better.",
  "Factor 1": "VM/TM — share of input that is virgin. Recyclate & take-back move it.",
  "Factor 2": "TM/P — scrap & over-spec. Waste, valorization, redesign move it.",
  "Factor 3": "P/US — product needed per year of service. Leasing, reuse, lifetime move it.",
  cohort: "Batch of 1,000 units/year. All kg/€ are per cohort.",
  EBIT: "Earnings before interest & tax per unit. Used to justify Tier 2 levers.",
  "upper bound": "Σ totals over-count because levers overlap. Never add them as a plan.",
  "€/kg": "Cost per kg virgin avoided. Negative = the lever pays for itself.",
};

export function GlossaryTip({ term, children }: { term: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, flip: false });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const def = GLOSSARY[term];
  if (!def) return <>{children ?? term}</>;

  const show = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const flip = r.bottom > window.innerHeight - 180;
      setPos({ top: flip ? r.top - 8 : r.bottom + 6, left: Math.min(Math.max(8, r.left - 8), window.innerWidth - 270), flip });
    }
    setOpen(true);
  };

  return (
    <>
      <span className="inline-flex items-center gap-1">
        <span className={`underline decoration-dotted underline-offset-2 ${open ? "text-amber font-semibold" : ""}`}>{children ?? term}</span>
        <button
          ref={btnRef}
          type="button"
          aria-label={`What is ${term}?`}
          onClick={() => (open ? setOpen(false) : show())}
          className={`rounded-full p-0.5 ${open ? "text-amber bg-ink" : "text-steel4 bg-steel/10 hover:text-ink hover:bg-steel/20"}`}
        >
          <HelpCircle size={13} className="block" />
        </button>
      </span>
      {open && createPortal(
        <span
          style={pos.flip
            ? { position: "fixed", left: pos.left, bottom: window.innerHeight - pos.top + 8, zIndex: 9999 }
            : { position: "fixed", left: pos.left, top: pos.top, zIndex: 9999 }}
          className="w-64 max-w-[calc(100vw-16px)] rounded-xl border border-mist bg-ink p-3 text-[12px] leading-snug text-paper shadow-2xl"
        >
          <strong className="block text-[11px] uppercase tracking-wider text-amber">{term}</strong>
          <span className="mt-1 block text-paper/85">{def}</span>
          <button onClick={() => setOpen(false)} className="mt-2 text-[10px] font-semibold text-paper/60 hover:text-paper">✕ Close</button>
        </span>,
        document.body
      )}
    </>
  );
}

export function GlossaryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const entries = Object.entries(GLOSSARY).filter(([k, v]) => k.toLowerCase().includes(q.toLowerCase()) || v.toLowerCase().includes(q.toLowerCase()));
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-start justify-center bg-ink/60 p-4 pt-16 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-paper shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-mist p-4">
          <strong className="font-display text-lg">Glossary — plain English</strong>
          <button onClick={onClose} className="rounded-full bg-ink p-1.5 text-paper"><X size={16} /></button>
        </div>
        <div className="p-4 border-b border-mist">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search — e.g. cohort, €/kg…" className="field" autoFocus />
        </div>
        <div className="overflow-y-auto p-4 space-y-3">
          {entries.map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white border border-mist p-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-steel3">{k}</p>
              <p className="mt-1 text-[12.5px] leading-snug text-steel2">{v}</p>
            </div>
          ))}
          {entries.length === 0 && <p className="text-sm text-steel4">No matches</p>}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function PlainHelp({ text }: { text: string }) {
  return <p className="field-hint">{text}</p>;
}
