"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { useStudio } from "@/lib/AppContext";
import { PARAMS_META } from "@/lib/levers";
import type { Confidence } from "@/lib/types";

const CONFIDENCES: Confidence[] = ["High", "Medium", "Low", "—"];

export default function QuantifyPage() {
  const { state, levers, factors, setCost, setOverride, setBasis, setConfidence, setParam } = useStudio();
  const [openCode, setOpenCode] = useState<string | null>(null);
  const inc = levers.filter((l) => l.included);
  const totKg = inc.reduce((a, l) => a + l.kg, 0);
  const totCost = inc.reduce((a, l) => a + l.costEurPer1000, 0);
  const totCo2 = inc.reduce((a, l) => a + l.co2eKg, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="kicker">Step 4 — Quantify the levers</p>
      <h1 className="h-display mt-2 text-3xl font-semibold">kg comes from the model. Costs are analyst input.</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel2">
        Model kg is computed from the parameters below; override it with measured values when you have them.
        Δcost €/1,000 units (negative = saving) is analyst input.
      </p>

      {/* ---------- table ---------- */}
      <div className="card mt-6 overflow-x-auto">
        <table className="table-plain w-full min-w-[1080px]">
          <thead>
            <tr>
              <th className="w-12">Code</th>
              <th>Lever (click for basis note)</th>
              <th className="w-12 text-center">In</th>
              <th className="text-right">kg model</th>
              <th className="text-right">kg override</th>
              <th className="text-right">kg used</th>
              <th className="text-right">Δcost €/1,000</th>
              <th className="text-right">€/kg</th>
              <th className="text-right">kg CO₂e</th>
              <th className="text-center">Tier</th>
              <th className="w-28">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {levers.map((l) => {
              const expanded = openCode === l.code;
              return (
                <Fragment key={l.code}>
                  <tr className={l.included ? "" : "opacity-55"}>
                    <td className="kpi font-bold text-steel2">{l.code}</td>
                    <td>
                      <button className="flex items-center gap-1 text-left font-medium hover:text-steel2" onClick={() => setOpenCode(expanded ? null : l.code)}>
                        {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        {l.name}
                      </button>
                    </td>
                    <td className="text-center"><span className={`chip ${l.included ? "chip-save" : "chip-slate"}`}>{l.included ? "In" : "Out"}</span></td>
                    <td className="kpi text-right text-steel2">{l.modelKg.toFixed(1)}</td>
                    <td className="text-right">
                      <input
                        aria-label={`kg override ${l.code}`}
                        className="field kpi w-20 text-right"
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="model"
                        value={l.overrideKg === null ? "" : String(l.overrideKg)}
                        onChange={(e) => setOverride(l.code, e.target.value === "" ? null : parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="kpi text-right font-semibold">{l.kg.toFixed(1)}</td>
                    <td className="text-right">
                      <input
                        aria-label={`Δcost ${l.code}`}
                        className="field kpi w-24 text-right"
                        type="number"
                        step="1"
                        value={String(l.costEurPer1000)}
                        onChange={(e) => setCost(l.code, parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className={`kpi text-right ${l.eurPerKg === null ? "text-steel4" : l.eurPerKg < 0 ? "text-save" : "text-cost"}`}>
                      {l.eurPerKg === null ? "n/a" : l.eurPerKg.toFixed(2)}
                    </td>
                    <td className="kpi text-right text-steel2">{l.co2eKg.toFixed(0)}</td>
                    <td className="text-center">
                      {l.tier ? <span className={`chip ${l.tier === "T1" ? "chip-save" : l.tier === "T2" ? "chip-amber" : "chip-slate"}`}>{l.tier}</span> : <span className="text-steel4">—</span>}
                    </td>
                    <td>
                      <select aria-label={`confidence ${l.code}`} className="field" value={l.confidence} onChange={(e) => setConfidence(l.code, e.target.value as Confidence)}>
                        {CONFIDENCES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                  </tr>
                  {expanded && (
                    <tr>
                      <td></td>
                      <td colSpan={10} className="bg-paper">
                        <label className="field-label" htmlFor={`basis-${l.code}`}>Basis / source note for {l.code}</label>
                        <input
                          id={`basis-${l.code}`}
                          className="field"
                          value={l.basis}
                          onChange={(e) => setBasis(l.code, e.target.value)}
                          placeholder="Where does this number come from?"
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-paper font-semibold">
              <td colSpan={2}>Σ included — upper bound (non-additive)</td>
              <td className="text-center kpi">{inc.length}/20</td>
              <td></td><td></td>
              <td className="kpi text-right">{totKg.toFixed(1)} kg</td>
              <td className="kpi text-right">{totCost < 0 ? `−€${Math.abs(totCost).toLocaleString()}` : `€${totCost.toLocaleString()}`}</td>
              <td></td>
              <td className="kpi text-right">{totCo2.toFixed(0)} kg</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ---------- model parameters ---------- */}
      <details className="card mt-6 p-6">
        <summary className="flex cursor-pointer items-center gap-2 font-display text-lg font-semibold text-steel">
          <Info size={16} className="text-steel3" /> Model parameters (edit with care)
        </summary>
        <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-steel2">
          These 16 parameters drive the model-kg formulas. The curve and the tiers recompute immediately.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PARAMS_META.map((p) => (
            <div key={p.key} className="rounded-xl border border-mist bg-paper p-3">
              <label className="field-label" htmlFor={`param-${p.key}`}>{p.label} <span className="text-amber2">· {p.lever}</span></label>
              <input
                id={`param-${p.key}`}
                className="field kpi"
                type="number"
                step={p.step}
                value={String(state.params[p.key])}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setParam(p.key, Number.isFinite(v) ? v : 0);
                }}
              />
              <p className="field-hint">{p.note}</p>
            </div>
          ))}
        </div>
      </details>

      <p className="mt-4 text-[11px] text-steel4">
        Factors check: P {factors.mass.toFixed(2)} kg · VM {factors.vm.toFixed(2)} kg · cohort virgin {factors.cohortVm.toFixed(0)} kg
      </p>
    </div>
  );
}
