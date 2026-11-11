import { describe, expect, it } from "vitest";
import fixture from "./fixtures/drill.json";
import { drillDefaults } from "./defaults";
import {
  computeFactors,
  computeLevers,
  sortLevers,
  summarize,
  cumulativeKg,
} from "./model";
import { LEVERS } from "./levers";

const state = drillDefaults();
const exp = fixture.expected;
const tol = (a: number, b: number, t: number) => Math.abs(a - b) < t;

describe("drill worked example — parity with Python fixture", () => {
  it("computes the BOM/factor decomposition", () => {
    const f = computeFactors(state.inputs);
    expect(tol(f.mass, exp.massKg, 1e-9)).toBe(true);
    expect(tol(f.scrap, exp.scrapKg, 1e-9)).toBe(true);
    expect(tol(f.tm, exp.totalMaterialsKg, 1e-9)).toBe(true);
    expect(tol(f.vmProduct, exp.vmProductKg, 1e-9)).toBe(true);
    expect(tol(f.vm, exp.virginMaterialKg, 1e-9)).toBe(true);
    expect(tol(f.circulated, exp.circulatedKg, 1e-9)).toBe(true);
    expect(tol(f.ratio1, exp.ratio1, 1e-9)).toBe(true);
    expect(tol(f.ratio2, exp.ratio2, 1e-9)).toBe(true);
    expect(tol(f.ratio3, exp.ratio3, 1e-9)).toBe(true);
    expect(tol(f.vmUsPerYear, exp.vmUsPerYear, 1e-9)).toBe(true);
    expect(tol(f.vmUsCohort, exp.vmUsCohort, 1e-6)).toBe(true);
    expect(tol(f.cohortVm, exp.cohortVm, 1e-6)).toBe(true);
    expect(tol(f.ebitUnit, exp.ebitUnit, 1e-9)).toBe(true);
    expect(tol(f.ebitCohort, exp.ebitCohort, 1e-9)).toBe(true);
    expect(f.identityResidual).toBeLessThan(1e-12);
  });

  it("computes per-lever model kg, EUR/kg, USD/kg, CO2e and tier", () => {
    const { levers } = computeLevers(state);
    for (const l of levers) {
      const expKg = exp.leverKg[l.code as keyof typeof exp.leverKg];
      expect(tol(l.kg, expKg as number, 1e-6), `kg ${l.code}`).toBe(true);

      const expEur = exp.eurPerKg[l.code as keyof typeof exp.eurPerKg] as number | null;
      if (expEur === null) {
        expect(l.eurPerKg).toBeNull();
      } else {
        expect(l.eurPerKg !== null && tol(l.eurPerKg!, expEur, 1e-9), `eur/kg ${l.code}`).toBe(true);
      }
      expect(tol(l.co2eKg, exp.co2eKg[l.code as keyof typeof exp.co2eKg] as number, 1e-6), `co2e ${l.code}`).toBe(true);
      expect(l.tier).toBe(exp.tier[l.code as keyof typeof exp.tier]);
    }
  });

  it("screens exactly the drill-example 14 levers in", () => {
    const { levers } = computeLevers(state);
    const included = levers.filter((l) => l.included).map((l) => l.code).sort();
    expect(included).toEqual(["1a","1b","1c","2a","4a","4b","5a","6b","6c","7a","7b","7c","7d","8a"]);
    expect(levers).toHaveLength(LEVERS.length);
  });

  it("matches the fixture totals (upper bound)", () => {
    const { levers } = computeLevers(state);
    const s = summarize(levers);
    expect(tol(s.includedKg, exp.sums.includedKg, 1e-6)).toBe(true);
    expect(tol(s.includedCostEur, exp.sums.includedCostEur, 1e-6)).toBe(true);
    expect(tol(s.includedCo2eKg, exp.sums.includedCo2eKg, 1e-6)).toBe(true);
    expect(s.tier1Count).toBe(exp.sums.tier1Count);
    expect(s.tier2Count).toBe(exp.sums.tier2Count);
    expect(s.tier3Count).toBe(exp.sums.tier3Count);
    expect(s.includedCount).toBe(14);
    expect(s.excludedCount).toBe(6);
  });

  it("sorts the curve ascending as expected", () => {
    const { levers } = computeLevers(state);
    const ordered = sortLevers(levers).map((l) => l.code);
    expect(ordered).toEqual(exp.sortedCodes);
  });

  it("cumulative kg ends at the total", () => {
    const { levers } = computeLevers(state);
    const sorted = sortLevers(levers);
    const cum = cumulativeKg(sorted);
    expect(tol(cum[cum.length - 1], exp.sums.includedKg, 1e-6)).toBe(true);
  });
});
