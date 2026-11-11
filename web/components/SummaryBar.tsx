"use client";

import { useStudio } from "@/lib/AppContext";

export function SummaryBar() {
  const { factors, summary, state } = useStudio();
  const currency = state.inputs.displayCurrency ?? "EUR";
  const sym = currency === "EUR" ? "€" : "$";
  const fx = state.inputs.fxUsdEur || 1;
  const toDisplay = (eur: number) => (currency === "EUR" ? eur : eur / fx);

  const kg = summary.includedKg;
  const cost = toDisplay(summary.includedCostEur);
  const co2 = summary.includedCo2eKg;

  return (
    <div className="border-b border-mist bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 sm:px-6">
        <span className="kpi text-[12px] font-semibold">
          <span className="text-steel4">VM/US</span> {factors.vmUsPerYear.toFixed(3)} kg/yr
        </span>
        <span className="kpi text-[12px]">
          <strong>{kg.toFixed(0)} kg</strong> <span className="text-steel4">avoided · upper bound</span>
        </span>
        <span className={`kpi text-[12px] font-semibold ${cost < 0 ? "text-save" : "text-cost"}`}>
          {cost < 0 ? "−" : ""}{sym}{Math.abs(cost).toLocaleString()}
        </span>
        <span className="kpi text-[12px] text-steel2">{co2.toFixed(0)} kg CO₂e</span>
        <span className="chip chip-save text-[10px]">T1 {summary.tier1Count}</span>
        <span className="chip chip-amber text-[10px]">T2 {summary.tier2Count}</span>
        <span className="chip chip-slate text-[10px]">T3 {summary.tier3Count}</span>
        <span className="ml-auto text-[10px] text-steel4">Per {state.inputs.cohortSize.toLocaleString()} units · {sym} = {currency}</span>
      </div>
    </div>
  );
}
