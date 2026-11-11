import drill from "./fixtures/drill.json";
import chair from "./fixtures/chair.json";
import { LEVERS } from "./levers";
import type { Confidence, Gates, ModelParams, ProductInputs, StudioState } from "./types";

export const DRILL_FIXTURE = drill;
export const CHAIR_FIXTURE = chair;

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
    displayCurrency: "EUR",
    bom: f.inputs.bom.map((c) => ({
      component: c.component,
      family: c.family,
      massKg: c.massKg,
      virginShare: c.virginShare,
    })),
  };
}

function makeDefaults(fixture: typeof drill): StudioState {
  const gates: Record<string, Gates> = {};
  const costs: Record<string, number> = {};
  const basis: Record<string, string> = {};
  const confidence: Record<string, Confidence> = {};
  const overrides: Record<string, number | null> = {};
  for (const l of fixture.levers) {
    gates[l.code] = l.gates as Gates;
    costs[l.code] = l.costEurPer1000;
  }
  for (const def of LEVERS) {
    basis[def.code] = def.basis;
    confidence[def.code] = def.confidence;
    overrides[def.code] = null;
  }
  const inputs: ProductInputs = {
    productName: fixture.inputs.productName,
    usStatement: fixture.inputs.usStatement,
    serviceLifeYears: fixture.inputs.serviceLifeYears,
    utilizationHoursPerYear: fixture.inputs.utilizationHoursPerYear,
    cohortSize: fixture.inputs.cohortSize,
    baseYear: fixture.inputs.baseYear,
    fxUsdEur: fixture.inputs.fxUsdEur,
    co2eFactor: fixture.inputs.co2eFactor,
    virginShare: fixture.inputs.virginShare,
    scrapRate: fixture.inputs.scrapRate,
    unitPrice: fixture.inputs.unitPrice,
    cogs: fixture.inputs.cogs,
    allocatedOverhead: fixture.inputs.allocatedOverhead,
    displayCurrency: "EUR",
    bom: fixture.inputs.bom.map((c) => ({ component: c.component, family: c.family, massKg: c.massKg, virginShare: c.virginShare })),
  };
  return {
    inputs,
    params: { ...fixture.params } as ModelParams,
    gates,
    costs,
    basis,
    confidence,
    overrides,
  };
}

export function drillDefaults(): StudioState { return makeDefaults(DRILL_FIXTURE); }
export function chairDefaults(): StudioState { return makeDefaults(CHAIR_FIXTURE as typeof drill); }

export const DRILL_DEFAULT = drillDefaults();
export const CHAIR_DEFAULT = chairDefaults();
