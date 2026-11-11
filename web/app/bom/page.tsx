"use client";

import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { useStudio } from "@/lib/AppContext";
import { validateInputs } from "@/lib/validation";
import { GlossaryTip } from "@/components/Glossary";

export default function BomPage() {
  const { state, factors: f, setBomRow, addBomRow, removeBomRow } = useStudio();
  const bom = state.inputs.bom;
  const bomErrs = validateInputs(state.inputs).filter(e=>e.field.startsWith("bom"));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="kicker">Step 2 — Bill of materials</p>
      <h1 className="h-display mt-2 text-3xl font-semibold">What is the product made of?</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel2">
        Component masses and <GlossaryTip term="virgin">virgin shares</GlossaryTip>. Leave virgin share blank to use the global default
        ({Math.round(state.inputs.virginShare * 100)}% <GlossaryTip term="Factor 1">(Factor 1)</GlossaryTip>) — set it per component when you can, e.g. a 50% PCR housing.
      </p>
      {bomErrs.length>0 && <div className="mt-3 flex items-center gap-2 rounded-xl border border-cost/30 bg-costbg p-3 text-[12px] text-cost font-semibold"><AlertTriangle size={14}/> {bomErrs.map(e=>e.message).join(" · ")}</div>}

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="card overflow-hidden lg:col-span-8">
          <table className="table-plain w-full">
            <thead>
              <tr>
                <th className="w-6">#</th>
                <th>Component</th>
                <th>Material family</th>
                <th className="w-28">Mass (kg)</th>
                <th className="w-32">Virgin share</th>
                <th className="w-28 text-right">Virgin (kg)</th>
                <th className="w-28"></th>
              </tr>
            </thead>
            <tbody>
              {bom.map((row, idx) => {
                const virgin = row.massKg * (row.virginShare ?? state.inputs.virginShare);
                return (
                  <tr key={idx}>
                    <td className="text-steel4">{idx + 1}</td>
                    <td>
                      <input aria-label={`Component ${idx + 1}`} className="field" value={row.component} onChange={(e) => setBomRow(idx, "component", e.target.value)} placeholder="Component" />
                    </td>
                    <td>
                      <input aria-label={`Family ${idx + 1}`} className="field" value={row.family} onChange={(e) => setBomRow(idx, "family", e.target.value)} placeholder="Material family" />
                    </td>
                    <td>
                      <input aria-label={`Mass ${idx + 1}`} className="field kpi" type="number" step="0.01" min="0" value={String(row.massKg)} onChange={(e) => setBomRow(idx, "massKg", parseFloat(e.target.value) || 0)} />
                    </td>
                    <td>
                      <input aria-label={`Virgin share ${idx + 1}`} className="field kpi" type="number" step="0.05" min="0" max="1" placeholder={`default ${state.inputs.virginShare}`} value={row.virginShare === null ? "" : String(row.virginShare)} onChange={(e) => setBomRow(idx, "virginShare", e.target.value === "" ? null : parseFloat(e.target.value))} />
                    </td>
                    <td className="kpi text-right font-semibold">{virgin.toFixed(3)}</td>
                    <td className="text-right">
                      <button aria-label="Remove row" className="rounded-md p-1.5 text-steel4 hover:bg-costbg hover:text-cost" onClick={() => removeBomRow(idx)}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-paper">
                <td colSpan={3} className="font-semibold">Totals ({bom.length} components)</td>
                <td className="kpi font-semibold">{f.mass.toFixed(2)} kg</td>
                <td></td>
                <td className="kpi text-right font-semibold">{f.vmProduct.toFixed(3)} kg</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          <div className="border-t border-mist p-3">
            <button className="btn btn-ghost" onClick={addBomRow}>
              <Plus size={15} /> Add component
            </button>
          </div>
        </div>

        {/* -------- summary panel -------- */}
        <div className="lg:col-span-4">
          <div className="card p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-steel3">Mass split</p>
            <div className="mt-3 space-y-2 text-sm">
              {bom.filter((r) => r.massKg > 0).map((r, i) => {
                const pct = f.mass > 0 ? (r.massKg / f.mass) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[12.5px]">{r.component || `Component ${i + 1}`}</span>
                      <span className="kpi text-[11.5px] text-steel2">{r.massKg.toFixed(2)} kg · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-mist">
                      <div className="h-full rounded-full bg-steel2" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <dl className="mt-5 space-y-2 border-t border-mist pt-4 text-[12.5px]">
              <div className="flex justify-between"><dt className="text-steel2">Virgin in product</dt><dd className="kpi font-semibold">{f.vmProduct.toFixed(2)} kg ({state.inputs.virginShare * 100}% default)</dd></div>
              <div className="flex justify-between"><dt className="text-steel2">Virgin in scrap ({Math.round(state.inputs.scrapRate * 100)}% rate)</dt><dd className="kpi font-semibold">{f.vmScrap.toFixed(2)} kg</dd></div>
              <div className="flex justify-between"><dt className="text-steel2">VM — total virgin</dt><dd className="kpi font-semibold text-ink">{f.vm.toFixed(2)} kg</dd></div>
              <div className="flex justify-between"><dt className="text-steel2">VM / TM (Factor 1)</dt><dd className="kpi font-semibold text-ink">{f.ratio1.toFixed(3)}</dd></div>
            </dl>
            <p className="field-hint mt-4">A recycled-content BOM (e.g., housing at 50% PCR) moves Factor 1 immediately — try typing 0.5 into the housing row.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
