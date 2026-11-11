"use client";

import { HelpCircle } from "lucide-react";
import { useState } from "react";

export const GLOSSARY: Record<string, string> = {
  "virgin": "Newly extracted material, not recycled. The stuff we are trying to avoid.",
  "VM": "Virgin Material (kg). Total new material in the product + scrap.",
  "TM": "Total Material (kg). Virgin + recycled/reused input.",
  "P": "Product mass (kg). What ships.",
  "US": "Useful Service. e.g. 'one drill over 8 years'. Never 'one drill'.",
  "VM/US": "Headline metric: kg virgin per unit of service. Lower is better.",
  "Factor 1": "VM/TM — share of input that is virgin. Recyclate & take-back move it.",
  "Factor 2": "TM/P — scrap & over-spec. Waste, valorization, redesign move it.",
  "Factor 3": "P/US — product needed per year of service. Leasing, reuse, lifetime move it.",
  "cohort": "Batch of 1,000 units/year. All kg/€ are per cohort.",
  "EBIT": "Earnings before interest & tax per unit. Used to justify Tier 2 levers.",
  "upper bound": "Σ totals over-count because levers overlap. Never add them as a plan.",
  "€/kg": "Cost per kg virgin avoided. Negative = the lever pays for itself.",
};

export function GlossaryTip({ term, children }: { term: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const def = GLOSSARY[term];
  if (!def) return <>{children ?? term}</>;
  return (
    <span className="relative inline-flex items-center gap-1">
      <span className="underline decoration-dotted underline-offset-2">{children ?? term}</span>
      <button
        type="button"
        aria-label={`What is ${term}?`}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-steel4 hover:text-ink"
      >
        <HelpCircle size={13} />
      </button>
      {open && (
        <span className="absolute left-0 top-full z-30 mt-2 w-64 rounded-xl border border-mist bg-ink p-3 text-[12px] leading-snug text-paper shadow-xl">
          <strong className="block text-[11px] uppercase tracking-wider text-amber">{term}</strong>
          <span className="mt-1 block text-paper/85">{def}</span>
        </span>
      )}
    </span>
  );
}

export function PlainHelp({ text }: { text: string }) {
  return <p className="field-hint">{text}</p>;
}
