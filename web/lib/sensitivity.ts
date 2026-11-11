import { computeLevers, summarize } from "./model";
import type { StudioState, ModelParams } from "./types";
import { PARAMS_META } from "./levers";

export interface TornadoItem {
  key: keyof ModelParams;
  label: string;
  lever: string;
  lowKg: number;
  highKg: number;
  baseKg: number;
  deltaKg: number; // high - low range
  lowCost: number;
  highCost: number;
}

function variant(state: StudioState, key: keyof ModelParams, delta: number): StudioState {
  return {
    ...state,
    params: { ...state.params, [key]: (state.params[key] + delta) as number },
  };
}

export function computeTornado(state: StudioState): TornadoItem[] {
  const base = summarize(computeLevers(state).levers);
  const baseKg = base.includedKg;
  const items: TornadoItem[] = [];

  for (const meta of PARAMS_META) {
    const baseVal = state.params[meta.key];
    // choose delta: 20% of value, at least 1 step, at most sensible cap
    let delta: number;
    if (meta.key === "reman_units" || meta.key === "unsold_units") delta = Math.max(5, baseVal * 0.3);
    else if (meta.key === "leasing_uplift") delta = 0.03; // small because >1
    else if (baseVal > 0 && baseVal < 2) delta = baseVal * 0.2 || meta.step * 5;
    else delta = meta.step * 10;

    const lowState = variant(state, meta.key, -delta);
    const highState = variant(state, meta.key, delta);
    // clamp params that should stay >=0
    if ((lowState.params[meta.key] as number) < 0) (lowState.params[meta.key] as number) = baseVal * 0.2;
    const low = summarize(computeLevers(lowState).levers);
    const high = summarize(computeLevers(highState).levers);
    items.push({
      key: meta.key,
      label: meta.label,
      lever: meta.lever,
      lowKg: low.includedKg,
      highKg: high.includedKg,
      baseKg,
      deltaKg: Math.abs(high.includedKg - low.includedKg),
      lowCost: low.includedCostEur,
      highCost: high.includedCostEur,
    });
  }
  return items.sort((a,b)=>b.deltaKg - a.deltaKg);
}

export function computeSensitivityRange(state: StudioState): { minKg: number; maxKg: number; minCost: number; maxCost: number } {
  const t = computeTornado(state);
  if (t.length===0) return { minKg:0,maxKg:0,minCost:0,maxCost:0 };
  return {
    minKg: Math.min(...t.map(x=>x.lowKg)),
    maxKg: Math.max(...t.map(x=>x.highKg)),
    minCost: Math.min(...t.map(x=>x.lowCost)),
    maxCost: Math.max(...t.map(x=>x.highCost)),
  };
}
