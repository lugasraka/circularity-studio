"use client";

import { useState } from "react";
import { useStudio } from "@/lib/AppContext";
import type { Currency, ProductInputs } from "@/lib/types";
import { GlossaryTip } from "@/components/Glossary";
import { ArrowRight, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { validateInputs } from "@/lib/validation";

export default function ProfilePage() {
  const { state, factors: f, setInput, preset, loadPreset } = useStudio();
  const i = state.inputs;
  const [tab, setTab] = useState<"essentials" | "advanced">("essentials");
  const errs = validateInputs(i);

  const num = (key: keyof ProductInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setInput(key, (Number.isFinite(v) ? v : 0) as never);
  };
  const txt = (key: keyof ProductInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(key, e.target.value as never);
  };

  const essentials: { label: string; key: keyof ProductInputs; hint?: string; step?: number; glossary?: string }[] = [
    { label: "Cohort size (units / year)", key: "cohortSize", hint: "Batch size — all kg/€ are per this cohort. 1,000 is standard.", step: 10, glossary: "cohort" },
    { label: "Service life (years)", key: "serviceLifeYears", hint: "How long one unit delivers the service. 8 years for a drill.", step: 0.5 },
    { label: "Utilization (hours / year)", key: "utilizationHoursPerYear", hint: "Average operating hours. 100 h/yr ≈ 800 h over 8 years.", step: 5 },
    { label: "Virgin share of material input (0–1)", key: "virginShare", hint: "Global default. Per-component override on BOM page.", step: 0.01, glossary: "Factor 1" },
    { label: "Production scrap rate (0–1)", key: "scrapRate", hint: "Scrap = rate × product mass. 0.08 = 8% scrap.", step: 0.01, glossary: "Factor 2" },
  ];

  const advanced: { label: string; key: keyof ProductInputs; hint?: string; step?: number; glossary?: string }[] = [
    { label: "Base year", key: "baseYear", hint: "Cost / price reference year", step: 1 },
    { label: "FX — EUR per 1 USD", key: "fxUsdEur", hint: "Used only when display currency is USD", step: 0.01 },
    { label: "CO₂e factor (kg CO₂e / kg virgin avoided)", key: "co2eFactor", hint: "Default 2.2 for plastic/steel/copper blend", step: 0.1 },
    { label: "Selling price (ex-factory, €/unit)", key: "unitPrice", hint: "", step: 1 },
    { label: "Variable cost (COGS excl. OH, €/unit)", key: "cogs", hint: "", step: 1 },
    { label: "Allocated overhead (€/unit)", key: "allocatedOverhead", hint: "Needed for EBIT — used to justify Tier 2", step: 1, glossary: "EBIT" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="kicker">Step 1 — Product profile</p>
      <h1 className="h-display mt-2 text-3xl font-semibold">Define the product &amp; the service</h1>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-steel4">Example product:</span>
        <button onClick={() => loadPreset("drill")} className={`rounded-full px-3 py-1 text-xs font-bold ${preset==="drill"?"bg-ink text-paper":"border border-mist bg-white text-steel2"}`}>Cordless drill</button>
        <button onClick={() => loadPreset("chair")} className={`rounded-full px-3 py-1 text-xs font-bold ${preset==="chair"?"bg-ink text-paper":"border border-mist bg-white text-steel2"}`}>Ergonomic chair</button>
        <span className="text-[11px] text-steel4 ml-1">Switch to see same method, different BOM.</span>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-steel2">
        Start with <strong>Essentials</strong> — five numbers define the story. Advanced costs can wait until you have data.
        The useful-service statement matters most: <GlossaryTip term="US">one measurable sentence</GlossaryTip>, unchanged across every lever.
      </p>
      {errs.length>0 && <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber/40 bg-[#faf0d3] p-3 text-[12px] text-steel2"><AlertTriangle size={14} className="mt-0.5 text-amber2 shrink-0" /><div><strong>{errs.length} issue{errs.length>1?"s":""} —</strong> {errs.slice(0,2).map(e=>e.message).join(" · ")}{errs.length>2?` · +${errs.length-2} more`:""}</div></div>}

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setTab("essentials")}
          className={`rounded-full px-4 py-1.5 text-xs font-bold ${tab === "essentials" ? "bg-ink text-paper" : "border border-mist bg-white text-steel2"}`}
        >
          Essentials (5)
        </button>
        <button
          onClick={() => setTab("advanced")}
          className={`rounded-full px-4 py-1.5 text-xs font-bold ${tab === "advanced" ? "bg-ink text-paper" : "border border-mist bg-white text-steel2"}`}
        >
          Advanced (costs &amp; context)
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="card p-6 lg:col-span-7">
          <label className="field-label" htmlFor="productName">Product name</label>
          <input id="productName" className="field" value={i.productName} onChange={txt("productName")} placeholder="e.g., Cordless power drill" />

          <div className="mt-5">
            <label className="field-label" htmlFor="usStatement">Useful service (<GlossaryTip term="US">US</GlossaryTip>) statement</label>
            <input id="usStatement" className="field" value={i.usStatement} onChange={txt("usStatement")} placeholder="one <product> over an <n>-year useful life (≈ <hours> hours)" />
            <p className="field-hint">Service, not product. Hours, years, cycles. Example: “one drill over 8 years ≈ 800 hours”.</p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {(tab === "essentials" ? essentials : advanced).map(({ label, key, hint, step, glossary }) => (
              <div key={key as string}>
                <label className="field-label" htmlFor={key as string}>
                  {glossary ? <GlossaryTip term={glossary}>{label}</GlossaryTip> : label}
                </label>
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

          <div className="mt-6 border-t border-mist pt-4">
            <label className="field-label">Display currency</label>
            <div className="flex gap-2">
              {(["EUR", "USD"] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setInput("displayCurrency" as never, c as never)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold ${((i.displayCurrency ?? "EUR") === c) ? "bg-ink text-paper" : "border border-mist bg-white text-steel2"}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="field-hint mt-2">One currency everywhere. EUR is default; USD converts via FX above.</p>
          </div>

          <div className="mt-8 flex justify-between">
            <Link href="/" className="btn btn-ghost"><ArrowLeft size={15} /> Home</Link>
            <Link href="/bom" className="btn btn-primary">Next: BOM <ArrowRight size={15} /></Link>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="card sticky top-20 bg-steel text-paper p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber">Live — the three factors</p>
            <p className="mt-1 text-[11px] text-paper/60"><GlossaryTip term="VM/US">VM/US</GlossaryTip> = (<GlossaryTip term="Factor 1">VM/TM</GlossaryTip>) × (<GlossaryTip term="Factor 2">TM/P</GlossaryTip>) × (<GlossaryTip term="Factor 3">P/US</GlossaryTip>)</p>
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
              <span className="text-[11px] text-paper/60">Identity check</span>
              <span className={`kpi text-xs font-bold ${f.identityResidual < 1e-9 ? "text-save" : "text-cost"}`}>
                {f.identityResidual < 1e-9 ? "PASS ✓" : f.identityResidual.toExponential(2)}
              </span>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-paper/55">
              Factor 1 moves with recirculation levers, Factor 2 with efficiency, Factor 3 with business models. They multiply — so 20% off each = −48.8% overall.
            </p>
            <p className="mt-3 text-[11px] text-amber">Tip: try virgin share 0.5 on BOM to see Factor 1 drop.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
