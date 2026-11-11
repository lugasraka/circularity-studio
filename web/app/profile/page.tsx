"use client";

import { useStudio } from "@/lib/AppContext";
import type { ProductInputs } from "@/lib/types";

export default function ProfilePage() {
  const { state, factors: f, setInput } = useStudio();
  const i = state.inputs;

  const num = (key: keyof ProductInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setInput(key, (Number.isFinite(v) ? v : 0) as never);
  };
  const txt = (key: keyof ProductInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(key, e.target.value as never);
  };

  const fields: { label: string; key: keyof ProductInputs; hint?: string; step?: number }[] = [
    { label: "Cohort size (units / year)", key: "cohortSize", hint: "Normalises Variant B per 1,000 units", step: 10 },
    { label: "Service life (years)", key: "serviceLifeYears", hint: "Useful life over which one unit delivers the US", step: 0.5 },
    { label: "Utilization (hours / year)", key: "utilizationHoursPerYear", hint: "Average operating hours per unit per year", step: 5 },
    { label: "Base year", key: "baseYear", hint: "Cost/price reference year", step: 1 },
    { label: "FX — EUR per 1 USD", key: "fxUsdEur", hint: "Variant A currency conversion", step: 0.01 },
    { label: "CO₂e factor (kg CO₂e / kg virgin avoided)", key: "co2eFactor", hint: "Default: plastic/steel/copper blend", step: 0.1 },
    { label: "Virgin share of material input (0–1)", key: "virginShare", hint: "Global default; per-component override on the BOM page", step: 0.01 },
    { label: "Production scrap rate (0–1)", key: "scrapRate", hint: "Scrap = rate × P (relative to product mass)", step: 0.01 },
    { label: "Selling price (ex-factory, €/unit)", key: "unitPrice", hint: "", step: 1 },
    { label: "Variable cost (COGS excl. OH, €/unit)", key: "cogs", hint: "", step: 1 },
    { label: "Allocated overhead (€/unit)", key: "allocatedOverhead", hint: "", step: 1 },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="kicker">Step 1 — Product profile</p>
      <h1 className="h-display mt-2 text-3xl font-semibold">Define the product &amp; the service</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel2">
        Everything on this page feeds the factor panel, live. The useful-service statement matters
        most: one measurable sentence, unchanged across every lever.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        {/* -------- form -------- */}
        <div className="card p-6 lg:col-span-7">
          <label className="field-label" htmlFor="productName">Product name</label>
          <input id="productName" className="field" value={i.productName} onChange={txt("productName")} placeholder="e.g., Cordless power drill" />

          <div className="mt-5">
            <label className="field-label" htmlFor="usStatement">Useful service (US) statement</label>
            <input id="usStatement" className="field" value={i.usStatement} onChange={txt("usStatement")} placeholder="one <product> over an <n>-year useful life (≈ <hours> hours)" />
            <p className="field-hint">Service statement, not a product statement. Hours, years, cycles.</p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {fields.map(({ label, key, hint, step }) => (
              <div key={key as string}>
                <label className="field-label" htmlFor={key as string}>{label}</label>
                <input
                  id={key as string}
                  className="field kpi"
                  type="number"
                  step={step}
                  value={String(i[key] as number)}
                  onChange={num(key)}
                />
                {hint && <p className="field-hint">{hint}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* -------- live factor panel -------- */}
        <div className="lg:col-span-5">
          <div className="card sticky top-20 bg-steel text-paper p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber">Live — the three factors</p>
            <dl className="mt-4 divide-y divide-white/10">
              {[
                ["P — product mass", `${f.mass.toFixed(2)} kg`],
                ["TM — total materials", `${f.tm.toFixed(2)} kg`],
                ["VM — virgin material", `${f.vm.toFixed(2)} kg`],
                ["Factor 1 — VM / TM", f.ratio1.toFixed(3)],
                ["Factor 2 — TM / P", f.ratio2.toFixed(3)],
                ["Factor 3 — P / US", `${f.ratio3.toFixed(3)} kg / unit-yr`],
                ["VM / US — headline", `${f.vmUsPerYear.toFixed(3)} kg per unit-yr`],
                ["VM / US × cohort", `${f.vmUsCohort.toFixed(1)} kg per cohort-yr`],
                ["EBIT per unit", `€${f.ebitUnit.toFixed(0)}`],
                ["EBIT per cohort", `€${f.ebitCohort.toLocaleString()}`],
              ].map(([k, v]) => (
                <div key={k as string} className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-[12px] text-paper/70">{k}</dt>
                  <dd className="kpi text-sm font-semibold text-paper">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-ink/50 px-4 py-3">
              <span className="text-[11px] text-paper/60">Identity residual |VM/US − (VM/TM)(TM/P)(P/US)|</span>
              <span className={`kpi text-xs font-bold ${f.identityResidual < 1e-9 ? "text-save" : "text-cost"}`}>
                {f.identityResidual < 1e-9 ? "PASS" : f.identityResidual.toExponential(2)}
              </span>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-paper/55">
              Factor 1 ↓ is moved by Group I levers, Factor 2 ↓ by Group II, Factor 3 ↓ by Group III.
              The three multiply — so small wins compound.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
