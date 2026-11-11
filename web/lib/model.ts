import { LEVERS, LEVER_MAP } from "./levers";
import type {
  Factors,
  Gates,
  LeverComputation,
  ModelParams,
  ProductInputs,
  StudioState,
  Summary,
  Tier,
} from "./types";

/** Factors for a product profile — mirrors spreadsheet sheet 03 cell-for-cell. */
export function computeFactors(inp: ProductInputs): Factors {
  const bomMass = inp.bom.map((c) => c.massKg || 0);
  const mass = bomMass.reduce((a, b) => a + b, 0);
  const scrap = inp.scrapRate * mass;
  const tm = mass + scrap;
  const vmProduct = inp.bom.reduce(
    (acc, c) => acc + (c.massKg || 0) * (c.virginShare ?? inp.virginShare),
    0,
  );
  const vmScrap = inp.virginShare * scrap;
  const vm = vmProduct + vmScrap;
  const circulated = tm - vm;
  const ratio1 = tm === 0 ? 0 : vm / tm;
  const ratio2 = mass === 0 ? 0 : tm / mass;
  const ratio3 = mass === 0 ? 0 : mass / inp.serviceLifeYears;
  const vmUsPerYear = vm / inp.serviceLifeYears;
  const vmUsCohort = vmUsPerYear * inp.cohortSize;
  const cohortVm = vm * inp.cohortSize;
  const cohortTm = tm * inp.cohortSize;
  const ebitUnit = inp.unitPrice - inp.cogs - inp.allocatedOverhead;
  const ebitCohort = ebitUnit * inp.cohortSize;
  const identityResidual = Math.abs(vmUsPerYear - ratio1 * ratio2 * ratio3);
  return {
    mass, scrap, tm, vmProduct, vmScrap, vm, circulated,
    ratio1, ratio2, ratio3, vmUsPerYear, vmUsCohort, cohortVm, cohortTm,
    ebitUnit, ebitCohort, identityResidual,
  };
}

/** Model-driven kg avoided per lever (per cohort). Mirrors sheet 05, column E. */
export function modelKg(code: string, inp: ProductInputs, f: Factors, p: ModelParams): number {
  const mass = f.mass;
  const tm = f.tm;
  const scrap = f.scrap;
  const A = p.recycled_uplift * tm * inp.cohortSize;
  const B = p.return_rate * p.closed_loop_yield * mass * inp.cohortSize;
  switch (code) {
    case "1a": return A;
    case "1b": return B;
    case "1c": return p.recyc_design_uplift * (A + B);
    case "2a": return p.reman_units * p.reman_yield * mass;
    case "4a": return p.scrap_pp * tm * inp.cohortSize;
    case "4b": return p.valorized_share * scrap * inp.cohortSize;
    case "5a": return p.mass_reduction * mass * inp.cohortSize;
    case "6b": return mass * ((p.leasing_uplift - 1) / p.leasing_uplift) * inp.cohortSize;
    case "6c": return p.reuse_share * mass * inp.cohortSize;
    case "7a": return p.life_ext_repair * mass * inp.cohortSize;
    case "7b": return p.refurb_share * mass * inp.cohortSize;
    case "7c": return p.life_ext_durability * mass * inp.cohortSize;
    case "7d": return p.life_ext_care * mass * inp.cohortSize;
    case "8a": return p.unsold_units * mass;
    default: return 0; // 2b, 3a, 3b, 5b, 5c, 6a — model is analyst-override only
  }
}

export function includedFromGates(gates: Gates | undefined): boolean {
  return !!gates && gates.every(Boolean);
}

export function computeLevers(state: StudioState): { factors: Factors; levers: LeverComputation[] } {
  const factors = computeFactors(state.inputs);
  const levers: LeverComputation[] = LEVERS.map((def) => {
    const gates = state.gates[def.code] ?? [true, true, true];
    const included = includedFromGates(gates);
    const mk = modelKg(def.code, state.inputs, factors, state.params);
    const overrideKg = state.overrides[def.code] ?? null;
    const kg = overrideKg ?? mk;
    const cost = state.costs[def.code] ?? 0;
    const eurPerKg = kg > 0 ? cost / kg : null;
    const usdPerKg = eurPerKg !== null ? eurPerKg / state.inputs.fxUsdEur : null;
    const co2eKg = kg * state.inputs.co2eFactor;
    const shareOfCohortVirgin = factors.cohortVm > 0 ? kg / factors.cohortVm : 0;
    let tier: Tier = null;
    if (included) tier = cost < 0 ? "T1" : kg >= 10 ? "T2" : "T3";
    return {
      code: def.code, name: def.name, group: def.group, factor: def.factor,
      included, gates, reason: def.screenReason, modelKg: mk, overrideKg, kg,
      costEurPer1000: cost, eurPerKg, usdPerKg, co2eKg, shareOfCohortVirgin, tier,
      basis: state.basis[def.code] ?? def.basis, confidence: state.confidence[def.code] ?? def.confidence,
    };
  });
  return { factors, levers };
}

/** Included levers sorted ascending by EUR/kg (Variant B default). Excluded levers are not returned. */
export function sortLevers(levers: LeverComputation[]): LeverComputation[] {
  const inc = levers.filter((l) => l.included);
  return [...inc].sort((a, b) => {
    const ka = a.eurPerKg ?? Number.POSITIVE_INFINITY;
    const kb = b.eurPerKg ?? Number.POSITIVE_INFINITY;
    if (ka !== kb) return ka - kb;
    return a.code.localeCompare(b.code); // deterministic tiebreak
  });
}

export function summarize(levers: LeverComputation[]): Summary {
  const inc = levers.filter((l) => l.included);
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const t1 = inc.filter((l) => l.tier === "T1");
  const t2 = inc.filter((l) => l.tier === "T2");
  const t3 = inc.filter((l) => l.tier === "T3");
  return {
    includedKg: sum(inc.map((l) => l.kg)),
    includedCostEur: sum(inc.map((l) => l.costEurPer1000)),
    includedCo2eKg: sum(inc.map((l) => l.co2eKg)),
    includedCount: inc.length,
    excludedCount: levers.length - inc.length,
    tier1Kg: sum(t1.map((l) => l.kg)),
    tier1SavingsEur: sum(t1.map((l) => l.costEurPer1000)),
    tier2CostsEur: sum(t2.concat(t3).map((l) => l.costEurPer1000)),
    tier1Count: t1.length,
    tier2Count: t2.length,
    tier3Count: t3.length,
  };
}

/** Cumulative kg in sorted order — for the chart's secondary axis. */
export function cumulativeKg(sorted: LeverComputation[]): number[] {
  let acc = 0;
  return sorted.map((l) => (acc += l.kg));
}
