"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Info, AlertTriangle } from "lucide-react";
import { useStudio } from "@/lib/AppContext";
import { PARAMS_META } from "@/lib/levers";
import type { Confidence } from "@/lib/types";
import { validateInputs } from "@/lib/validation";
import { Link2, Upload, Download, TrendingUp } from "lucide-react";
import { copyShareLink, exportStateJson, importStateJson } from "@/lib/share";
import { TornadoChart } from "@/components/TornadoChart";

const CONFIDENCES: Confidence[] = ["High", "Medium", "Low", "—"];

export default function QuantifyPage() {
  const { state, levers, factors, setCost, setOverride, setBasis, setConfidence, setParam, setStateDirect } = useStudio() as ReturnType<typeof useStudio> & { setStateDirect?: (s: import("@/lib/types").StudioState) => void };
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [view, setView] = useState<"impact" | "effort">("impact");
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const inc = levers.filter((l) => l.included);
  const totKg = inc.reduce((a, l) => a + l.kg, 0);
  const totCost = inc.reduce((a, l) => a + l.costEurPer1000, 0);
  const totCo2 = inc.reduce((a, l) => a + l.co2eKg, 0);
  const errs = validateInputs(state.inputs);

  const doShare = async () => {
    const url = await copyShareLink(state);
    setShareMsg(url);
    setTimeout(() => setShareMsg(null), 3000);
  };
  const doExport = () => {
    const blob = new Blob([exportStateJson(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "studio-state.json"; a.click();
    URL.revokeObjectURL(url);
  };
  const doImport = (file: File) => {
    file.text().then((t) => {
      try {
        const s = importStateJson(t);
        // @ts-ignore
        setStateDirect?.(s);
        setShareMsg("Imported ✓");
      } catch { setShareMsg("Import failed — invalid JSON"); }
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="kicker">Step 4 — Quantify the levers</p>
      <h1 className="h-display mt-2 text-3xl font-semibold">kg comes from the model. Costs are analyst input.</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel2">
        Two lenses: <strong>Impact</strong> (kg avoided, €/kg) and <strong>Effort</strong> (Δcost, confidence, basis).
        Switch views instead of scrolling sideways.
      </p>

      {errs.length > 0 && (
        <div className="mt-4 rounded-xl border border-cost/30 bg-costbg p-4">
          <p className="flex items-center gap-2 text-[12px] font-bold text-cost"><AlertTriangle size={14} /> {errs.length} issues to fix</p>
          <ul className="mt-2 list-disc pl-5 text-[12px] text-steel2">
            {errs.slice(0,4).map(e => <li key={e.field}>{e.message}</li>)}
            {errs.length > 4 && <li>+{errs.length-4} more</li>}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-mist bg-white p-1">
          {(["impact","effort"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold ${view===v?"bg-ink text-paper":"text-steel2"}`}>
              {v === "impact" ? "Impact (kg)" : "Effort (€ & confidence)"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2 no-print">
          <button className="btn btn-ghost !py-1.5 text-xs" onClick={doShare}><Link2 size={14} /> Copy link</button>
          <button className="btn btn-ghost !py-1.5 text-xs" onClick={doExport}><Download size={14} /> JSON</button>
          <label className="btn btn-ghost !py-1.5 text-xs cursor-pointer"><Upload size={14} /> Import<input type="file" accept="application/json" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if(f) doImport(f);}} /></label>
        </div>
      </div>
      {shareMsg && <p className="mt-2 text-xs font-semibold text-save">{shareMsg}</p>}

      <div className="card mt-4 overflow-x-auto">
        {view === "impact" ? (
          <table className="table-plain w-full min-w-[720px]">
            <thead><tr><th>Code</th><th>Lever</th><th className="text-right">kg model</th><th className="text-right">kg override</th><th className="text-right">kg used</th><th className="text-right">€/kg</th><th className="text-right">kg CO₂e</th><th className="text-center">Tier</th></tr></thead>
            <tbody>
              {levers.map(l=>(
                <tr key={l.code} className={l.included?"":"opacity-55"}>
                  <td className="kpi font-bold text-steel2">{l.code}</td>
                  <td>{l.name}</td>
                  <td className="kpi text-right text-steel2">{l.modelKg.toFixed(1)}</td>
                  <td className="text-right"><input aria-label={`kg override ${l.code}`} className="field kpi w-20 text-right" type="number" min="0" step="0.1" placeholder="model" value={l.overrideKg===null?"":String(l.overrideKg)} onChange={(e)=>setOverride(l.code, e.target.value===""?null:parseFloat(e.target.value)||0)} /></td>
                  <td className="kpi text-right font-semibold">{l.kg.toFixed(1)}</td>
                  <td className={`kpi text-right ${l.eurPerKg===null?"text-steel4":l.eurPerKg<0?"text-save":"text-cost"}`}>{l.eurPerKg===null?"n/a":l.eurPerKg.toFixed(2)}</td>
                  <td className="kpi text-right text-steel2">{l.co2eKg.toFixed(0)}</td>
                  <td className="text-center">{l.tier?<span className={`chip ${l.tier==="T1"?"chip-save":l.tier==="T2"?"chip-amber":"chip-slate"}`}>{l.tier}</span>:<span className="text-steel4">—</span>}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="bg-paper font-semibold"><td colSpan={4}>Σ included — upper bound</td><td className="kpi text-right">{totKg.toFixed(1)} kg</td><td></td><td className="kpi text-right">{totCo2.toFixed(0)}</td><td></td></tr></tfoot>
          </table>
        ) : (
          <table className="table-plain w-full min-w-[720px]">
            <thead><tr><th>Code</th><th>Lever (click for basis)</th><th className="text-right">Δcost €/1,000</th><th className="text-right">€/kg</th><th className="w-28">Confidence</th><th className="text-center">Tier</th></tr></thead>
            <tbody>
              {levers.map(l=>{
                const expanded=openCode===l.code;
                return (
                  <Fragment key={l.code}>
                    <tr className={l.included?"":"opacity-55"}>
                      <td className="kpi font-bold text-steel2">{l.code}</td>
                      <td><button className="flex items-center gap-1 text-left font-medium" onClick={()=>setOpenCode(expanded?null:l.code)}>{expanded?<ChevronDown size={13}/>:<ChevronRight size={13}/>} {l.name}</button></td>
                      <td className="text-right"><input aria-label={`Δcost ${l.code}`} className="field kpi w-24 text-right" type="number" step="1" value={String(l.costEurPer1000)} onChange={(e)=>setCost(l.code, parseFloat(e.target.value)||0)} /></td>
                      <td className={`kpi text-right ${l.eurPerKg===null?"text-steel4":l.eurPerKg<0?"text-save":"text-cost"}`}>{l.eurPerKg===null?"n/a":l.eurPerKg.toFixed(2)}</td>
                      <td><select aria-label={`confidence ${l.code}`} className="field" value={l.confidence} onChange={(e)=>setConfidence(l.code, e.target.value as Confidence)}>{CONFIDENCES.map(c=><option key={c} value={c}>{c}</option>)}</select></td>
                      <td className="text-center">{l.tier?<span className={`chip ${l.tier==="T1"?"chip-save":l.tier==="T2"?"chip-amber":"chip-slate"}`}>{l.tier}</span>:<span className="text-steel4">—</span>}</td>
                    </tr>
                    {expanded&&<tr><td></td><td colSpan={5} className="bg-paper"><label className="field-label" htmlFor={`basis-${l.code}`}>Basis / source note for {l.code}</label><input id={`basis-${l.code}`} className="field" value={l.basis} onChange={(e)=>setBasis(l.code, e.target.value)} placeholder="Where does this number come from?" /></td></tr>}
                  </Fragment>
                )})}
            </tbody>
            <tfoot><tr className="bg-paper font-semibold"><td colSpan={2}>Σ included</td><td className="kpi text-right">{totCost<0?`−€${Math.abs(totCost).toLocaleString()}`:`€${totCost.toLocaleString()}`}</td><td colSpan={3}></td></tr></tfoot>
          </table>
        )}
      </div>

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

      <div className="mt-6">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-steel3"><TrendingUp size={14} /> What-if — sensitivity</p>
        <p className="mt-1 text-[12px] text-steel2">±20% on each parameter. Leasing and mass reduction dominate — pressure-test those assumptions before the board.</p>
        <div className="mt-3"><TornadoChart /></div>
      </div>

      <p className="mt-4 text-[11px] text-steel4">
        Factors check: P {factors.mass.toFixed(2)} kg · VM {factors.vm.toFixed(2)} kg · cohort virgin {factors.cohortVm.toFixed(0)} kg
      </p>
    </div>
  );
}
