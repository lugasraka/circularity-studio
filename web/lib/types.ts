export type Confidence = "High" | "Medium" | "Low" | "—";

export type Currency = "EUR" | "USD";

export interface BomComponent {
  component: string;
  family: string;
  massKg: number;
  virginShare: number | null; // null = use global virgin share
}

export interface ProductInputs {
  productName: string;
  usStatement: string;
  serviceLifeYears: number;
  utilizationHoursPerYear: number;
  cohortSize: number;
  baseYear: number;
  fxUsdEur: number;
  co2eFactor: number;
  virginShare: number;
  scrapRate: number;
  unitPrice: number;
  cogs: number;
  allocatedOverhead: number;
  bom: BomComponent[];
  displayCurrency?: Currency;
}

/** Same keys as fixtures/drill.json params */
export interface ModelParams {
  scrap_pp: number;
  recycled_uplift: number;
  return_rate: number;
  closed_loop_yield: number;
  recyc_design_uplift: number;
  reman_units: number;
  reman_yield: number;
  valorized_share: number;
  mass_reduction: number;
  leasing_uplift: number;
  reuse_share: number;
  refurb_share: number;
  life_ext_repair: number;
  life_ext_durability: number;
  life_ext_care: number;
  unsold_units: number;
}

/** Y = true, N = false. Order: Allowed? / Measurable? / In scope? */
export type Gates = [boolean, boolean, boolean];

export interface StudioState {
  inputs: ProductInputs;
  params: ModelParams;
  gates: Record<string, Gates>;
  costs: Record<string, number>;
  overrides: Record<string, number | null>;
  basis: Record<string, string>;
  confidence: Record<string, Confidence>;
}

export interface Factors {
  mass: number;
  scrap: number;
  tm: number;
  vmProduct: number;
  vmScrap: number;
  vm: number;
  circulated: number;
  ratio1: number;
  ratio2: number;
  ratio3: number;
  vmUsPerYear: number;
  vmUsCohort: number;
  cohortVm: number;
  cohortTm: number;
  ebitUnit: number;
  ebitCohort: number;
  identityResidual: number;
}

export type Tier = "T1" | "T2" | "T3" | null;

export interface LeverComputation {
  code: string;
  name: string;
  group: string;
  factor: string;
  included: boolean;
  gates: Gates;
  reason: string;
  modelKg: number;
  overrideKg: number | null;
  kg: number;
  costEurPer1000: number;
  eurPerKg: number | null;
  usdPerKg: number | null;
  co2eKg: number;
  shareOfCohortVirgin: number;
  tier: Tier;
  basis: string;
  confidence: Confidence;
}

export interface Summary {
  includedKg: number;
  includedCostEur: number;
  includedCo2eKg: number;
  includedCount: number;
  excludedCount: number;
  tier1Kg: number;
  tier1SavingsEur: number;
  tier2CostsEur: number;
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
}
