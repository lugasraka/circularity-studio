import drill from "./fixtures/drill.json";
import { LEVERS } from "./levers";
import type { Confidence, Gates, ModelParams, ProductInputs, StudioState } from "./types";

export const DRILL_FIXTURE = drill;

export function inputsFromFixture(): ProductInputs {
  const f = DRILL_FIXTURE;
  return {
    productName: f.inputs.productName,
    usStatement: f.inputs.usStatement,
    serviceLifeYears: f.inputs.serviceLifeYears,
    utilizationHoursPerYear: f.inputs.utilizationHoursPerYear,
    cohortSize: f.inputs.cohortSize,
    baseYear: f.inputs.baseYear,
    fxUsdEur: f.inputs.fxUsdEur,
    co2eFactor: f.inputs.co2eFactor,
    virginShare: f.inputs.virginShare,
    scrapRate: f.inputs.scrapRate,
    unitPrice: f.inputs.unitPrice,
    cogs: f.inputs.cogs,
    allocatedOverhead: f.inputs.allocatedOverhead,
    bom: f.inputs.bom.map((c) => ({
      component: c.component,
      family: c.family,
      massKg: c.massKg,
      virginShare: c.virginShare,
    })),
  };
}

/** Initial app state — the cordless-drill worked example, fully live. */
export function drillDefaults(): StudioState {
  const gates: Record<string, Gates> = {};
  const costs: Record<string, number> = {};
  const basis: Record<string, string> = {};
  const confidence: Record<string, Confidence> = {};
  const overrides: Record<string, number | null> = {};
  for (const l of DRILL_FIXTURE.levers) {
    gates[l.code] = l.gates as Gates;
    costs[l.code] = l.costEurPer1000;
  }
  for (const def of LEVERS) {
    basis[def.code] = def.basis;
    confidence[def.code] = def.confidence;
    overrides[def.code] = null;
  }
  return {
    inputs: inputsFromFixture(),
    params: { ...DRILL_FIXTURE.params } as ModelParams,
    gates,
    costs,
    basis,
    confidence,
    overrides,
  };
}

export const DRILL_DEFAULT = drillDefaults();
