"use client";

import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Printer, AlertTriangle, Briefcase, Package } from "lucide-react";
import { useStudio } from "@/lib/AppContext";
import { buildMarkdownReport, buildExecutiveSummary, downloadText, downloadBackFilledExcel } from "@/lib/exporters";
import type { Tier } from "@/lib/types";
import { GlossaryTip } from "@/components/Glossary";
import { validateInputs } from "@/lib/validation";

const TIER_META: Record<Exclude<Tier, null>, { label: string; sub: string; accent: string; chip: string }> = {
  T1: { label: "Tier 1 — No-regret", sub: "Cost < 0 — these pay for themselves. Sign the business case; fund the rest from them.", accent: "border-l-save", chip: "chip-save" },
  T2: { label: "Tier 2 — Strategic", sub: "Cost > 0, ≥ 10 kg each. Invest deliberately; justify with lifetime EBIT + revenue overlay.", accent: "border-l-amber", chip: "chip-amber" },
  T3: { label: "Tier 3 — Monitor", sub: "Positive cost, narrow bars. Pilot cheaply or watch the cost curve; revisit annually.", accent: "border-l-steel4", chip: "chip-slate" },
};

export default function DecisionPage() {
  const { state, levers, summary, factors } = useStudio();
  const included = levers.filter((l) => l.included);
  const excluded = levers.filter((l) => !l.included);
  const safeName = (state.inputs.productName || "product").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
  const exec = buildExecutiveSummary(state);
  const currency = state.inputs.displayCurrency ?? "EUR";
  const sym = currency === "EUR" ? "€" : "$";
  const fx = state.inputs.fxUsdEur || 1;
  const toDisplay = (eur: number) => currency === "EUR" ? eur : eur / fx;
  const errs = validateInputs(state.inputs);
  const [pkg, setPkg] = useState<Set<string>>(new Set(included.filter(l=>l.tier==="T1").map(l=>l.code)));

  const toggle = (code: string) => setPkg(s => { const n=new Set(s); n.has(code)?n.delete(code):n.add(code); return n; });
  const pkgLevers = useMemo(()=> included.filter(l=>pkg.has(l.code)), [included, pkg]);
  const pkgKg = pkgLevers.reduce((a,l)=>a+l.kg,0);
  const pkgCost = pkgLevers.reduce((a,l)=>a+l.costEurPer1000,0);
  const pkgCo2 = pkgLevers.reduce((a,l)=>a+l.co2eKg,0);

  const exportMarkdown = () => downloadText(`${safeName}-circularity-report.md`, buildMarkdownReport(state));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Step 6 — Decide</p>
          <h1 className="h-display mt-2 text-3xl font-semibold">Three tiers, ranked by return.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel2">
            Ranked on the base curve (cost + <GlossaryTip term="EBIT">EBIT</GlossaryTip>). Revenue upside stays out until you add it on purpose.
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={exportMarkdown}><Download size={15} /> Markdown</button>
          <button className="btn btn-ghost" onClick={() => downloadBackFilledExcel(state)}><FileSpreadsheet size={15} /> Excel template</button>
          <button className="btn btn-ink" onClick={() => window.print()}><Printer size={15} /> Print / PDF</button>
        </div>
      </div>

      {/* ---------- executive one-pager (print-visible) ---------- */}
      <section className="card mt-6 border-l-4 border-l-amber p-6 print:shadow-none">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-steel3">
          <Briefcase size={14} /> Board one-pager — {state.inputs.productName}
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold leading-tight">{exec.headline}</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-steel2">
          {exec.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-savebg p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-save">Tier 1 — Do now</p>
            <p className="mt-2 text-[13px] leading-snug">{exec.tier1List}</p>
          </div>
          <div className="rounded-xl bg-[#faf0d3] p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber2">Tier 2/3 — Invest / Monitor</p>
            <p className="mt-2 text-[13px] leading-snug">{exec.tier2List}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-[12px] text-steel3">
          <span><strong className="kpi">{factors.vmUsPerYear.toFixed(3)} kg</strong> VM/US</span>
          <span>·</span>
          <span><strong className="kpi">{summary.includedKg.toFixed(0)} kg</strong> <GlossaryTip term="upper bound">upper bound</GlossaryTip></span>
          <span>·</span>
          <span><strong className="kpi">{summary.includedCo2eKg.toFixed(0)} kg</strong> CO₂e</span>
          <span>·</span>
          <span>US: {state.inputs.usStatement}</span>
        </div>
        <p className="mt-3 border-t border-mist pt-3 text-[11px] text-steel4">
          Illustrative values — replace with measured BOM &amp; costs before investing. Σ excludes revenue upside. Full method: docs/circularity-decision-framework.md §5.
        </p>
      </section>

      {/* ---------- totals strip ---------- */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 no-print">
        {[
          [`${summary.includedKg.toFixed(0)} kg`, "virgin avoided (upper bound)"],
          [`${summary.includedCostEur < 0 ? "−" : ""}${sym}${Math.abs(toDisplay(summary.includedCostEur)).toLocaleString()}`, "net Δcost per cohort-year"],
          [`${sym}${Math.abs(toDisplay(summary.tier1SavingsEur)).toLocaleString()}`, `Tier 1 (n=${summary.tier1Count}) — self-funding`],
          [`${sym}${Math.abs(toDisplay(summary.tier2CostsEur)).toLocaleString()}`, `Tier 2+3 (n=${summary.tier2Count + summary.tier3Count}) — investment`],
        ].map(([v, d]) => (
          <div key={v as string} className="card p-4">
            <p className="kpi font-display text-2xl font-semibold text-steel">{v}</p>
            <p className="mt-1 text-[11px] leading-snug text-steel3">{d}</p>
          </div>
        ))}
      </div>

      {errs.length>0 && (
        <div className="mt-4 rounded-xl border border-cost/30 bg-costbg p-3 text-[12px] text-cost font-semibold">
          {errs.length} input issue{errs.length>1?"s":""} — fix to publish: {errs[0].message}
        </div>
      )}

      {/* ---------- package builder ---------- */}
      <section className="card mt-6 p-5 no-print">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-steel3"><Package size={14} /> Package builder — avoid double-counting</p>
        <p className="mt-2 text-[12.5px] text-steel2">Pick a mutually-exclusive bundle. Σ on the curve is an upper bound; this is your investable slice.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {included.map(l=>(
            <button key={l.code} onClick={()=>toggle(l.code)} aria-pressed={pkg.has(l.code)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold border ${pkg.has(l.code)?"bg-ink text-paper border-ink":"border-mist bg-white text-steel2"}`}>
              {l.code} {l.name} · {l.kg.toFixed(0)} kg
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-paper p-3 text-center"><p className="kpi font-display text-xl font-semibold">{pkgKg.toFixed(0)} kg</p><p className="text-[11px] text-steel4">kg avoided</p></div>
          <div className="rounded-xl bg-paper p-3 text-center"><p className={`kpi font-display text-xl font-semibold ${pkgCost<0?"text-save":"text-cost"}`}>{pkgCost<0?"−":""}{sym}{Math.abs(toDisplay(pkgCost)).toLocaleString()}</p><p className="text-[11px] text-steel4">Δcost / cohort-yr</p></div>
          <div className="rounded-xl bg-paper p-3 text-center"><p className="kpi font-display text-xl font-semibold">{pkgCo2.toFixed(0)} kg</p><p className="text-[11px] text-steel4">CO₂e</p></div>
        </div>
        <p className="mt-3 text-[11px] text-steel4">{pkgLevers.length} levers selected · overlaps still apply within the package — verify with engineering lead.</p>
      </section>

      {/* ---------- tiers ---------- */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3 no-print">
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
                    <span className="kpi whitespace-nowrap text-[12px] text-steel2">{l.kg.toFixed(0)} kg · {l.costEurPer1000 < 0 ? "−" : ""}{sym}{Math.abs(toDisplay(l.costEurPer1000)).toLocaleString()}</span>
                  </li>
                ))}
                {inTier.length === 0 && <li className="text-[13px] text-steel4">None — adjust screen or costs.</li>}
              </ul>
              <p className="kpi mt-4 border-t border-mist pt-3 text-sm font-semibold text-ink">
                Σ {tierSavings < 0 ? "−" : ""}{sym}{Math.abs(toDisplay(tierSavings)).toLocaleString()} per cohort-year
              </p>
            </section>
          );
        })}
      </div>

      {/* ---------- excluded + caveat ---------- */}
      <div className="mt-6 grid gap-4 lg:grid-cols-12 no-print">
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
            <li>Every number above excludes revenue upside. If 6b’s subscription captures green premium, the arithmetic for 7a/7c/7d flips — model it explicitly.</li>
            <li>Δcost figures are analyst estimates pending your data — basis/confidence columns exist so a reviewer can challenge them line by line.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
