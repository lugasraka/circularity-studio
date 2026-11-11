"use client";

import { Download, FileSpreadsheet, Printer, AlertTriangle } from "lucide-react";
import { useStudio } from "@/lib/AppContext";
import { buildMarkdownReport, downloadText, downloadBackFilledExcel } from "@/lib/exporters";
import type { Tier } from "@/lib/types";

const TIER_META: Record<Exclude<Tier, null>, { label: string; sub: string; accent: string; chip: string }> = {
  T1: { label: "Tier 1 — No-regret", sub: "Cost < 0 — these pay for themselves. Sign the business case; fund the rest from them.", accent: "border-l-save", chip: "chip-save" },
  T2: { label: "Tier 2 — Strategic", sub: "Cost > 0, ≥ 10 kg each. Invest deliberately; justify with lifetime EBIT + revenue overlay.", accent: "border-l-amber", chip: "chip-amber" },
  T3: { label: "Tier 3 — Monitor", sub: "Positive cost, narrow bars. Pilot cheaply or watch the cost curve; revisit annually.", accent: "border-l-steel4", chip: "chip-slate" },
};

export default function DecisionPage() {
  const { state, levers, summary } = useStudio();
  const included = levers.filter((l) => l.included);
  const excluded = levers.filter((l) => !l.included);
  const safeName = (state.inputs.productName || "product").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();

  const exportMarkdown = () => downloadText(`${safeName}-circularity-report.md`, buildMarkdownReport(state));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Step 6 — Decide</p>
          <h1 className="h-display mt-2 text-3xl font-semibold">Three tiers, ranked by return.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel2">
            Ranked on the base curve (cost + EBIT). Revenue upside stays out until you add it on purpose.
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={exportMarkdown}><Download size={15} /> Markdown</button>
          <button className="btn btn-ghost" onClick={() => downloadBackFilledExcel(state)}><FileSpreadsheet size={15} /> Excel template</button>
          <button className="btn btn-ink" onClick={() => window.print()}><Printer size={15} /> Print / PDF</button>
        </div>
      </div>

      {/* ---------- totals strip ---------- */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          [`${summary.includedKg.toFixed(0)} kg`, "virgin material avoided (upper bound)"],
          [summary.includedCostEur < 0 ? `−€${Math.abs(summary.includedCostEur).toLocaleString()}` : `€${summary.includedCostEur.toLocaleString()}`, "net Δcost per cohort-year"],
          [`€${Math.abs(summary.tier1SavingsEur).toLocaleString()}`, `captured by Tier 1 (n=${summary.tier1Count})`],
          [`€${Math.abs(summary.tier2CostsEur).toLocaleString()}`, `required by Tier 2+3 (n=${summary.tier2Count + summary.tier3Count})`],
        ].map(([v, d]) => (
          <div key={v as string} className="card p-4">
            <p className="kpi font-display text-2xl font-semibold text-steel">{v}</p>
            <p className="mt-1 text-[11px] leading-snug text-steel3">{d}</p>
          </div>
        ))}
      </div>

      {/* ---------- tiers ---------- */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {(["T1", "T2", "T3"] as const).map((t) => {
          const inTier = included.filter((l) => l.tier === t);
          const meta = TIER_META[t];
          const tierSavings = inTier.reduce((a, l) => a + l.costEurPer1000, 0);
          return (
            <section key={t} className={`card border-l-4 ${meta.accent} flex flex-col p-5`}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">{meta.label}</h2>
                <span className={`chip ${meta.chip}`}>{inTier.length}</span>
              </div>
              <p className="mt-1 text-[12px] leading-snug text-steel2">{meta.sub}</p>
              <ul className="mt-4 flex-1 space-y-2">
                {inTier.map((l) => (
                  <li key={l.code} className="flex items-center justify-between gap-3 rounded-lg border border-mist bg-paper px-3 py-2">
                    <span className="text-[13px]"><span className="kpi font-bold text-steel2">{l.code}</span> {l.name}</span>
                    <span className="kpi whitespace-nowrap text-[12px] text-steel2">{l.kg.toFixed(0)} kg · {l.costEurPer1000 < 0 ? "−" : ""}€{Math.abs(l.costEurPer1000).toLocaleString()}</span>
                  </li>
                ))}
                {inTier.length === 0 && <li className="text-[13px] text-steel4">None — adjust the screen or the cost inputs.</li>}
              </ul>
              <p className="kpi mt-4 border-t border-mist pt-3 text-sm font-semibold text-ink">
                Σ {tierSavings < 0 ? "−" : ""}€{Math.abs(tierSavings).toLocaleString()} per cohort-year
              </p>
            </section>
          );
        })}
      </div>

      {/* ---------- excluded + caveat ---------- */}
      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <div className="card p-5 lg:col-span-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-steel3">Screened out — on the record ({excluded.length})</p>
          <ul className="mt-2 space-y-1.5 text-[12.5px] leading-snug text-steel2">
            {excluded.map((l) => (
              <li key={l.code}><span className="kpi font-bold text-steel4">{l.code}</span> {l.name} — <span className="italic">{l.reason || "reason not recorded"}</span></li>
            ))}
          </ul>
        </div>
        <div className="card border-l-4 border-l-amber p-5 lg:col-span-7">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber2"><AlertTriangle size={13} /> Before you brief the board</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[12.5px] leading-snug text-steel2">
            <li>Σ totals are an <strong>upper bound</strong>, not a plan — levers overlap. Build mutually exclusive packages (e.g. “Leasing programme” = 6b + 7b + 7d + 1b) before committing capital.</li>
            <li>Every number above excludes revenue upside. If 6b’s subscription captures green premium, the arithmetic for 7a/7c/7d flips — model it explicitly, don’t smuggle it in.</li>
            <li>Δcost figures are analyst estimates pending your data — the basis/confidence columns exist so a reviewer can challenge them line by line.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
