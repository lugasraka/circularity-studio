import type { ProductInputs } from "./types";

export interface ValidationError { field: string; message: string; }

export function validateInputs(inp: ProductInputs): ValidationError[] {
  const errs: ValidationError[] = [];
  if (!inp.productName.trim()) errs.push({ field: "productName", message: "Product name is required" });
  if (!inp.usStatement.trim()) errs.push({ field: "usStatement", message: "US statement is required — e.g. 'one drill over 8 years'" });
  if (inp.serviceLifeYears <= 0) errs.push({ field: "serviceLifeYears", message: "Service life must be > 0 years" });
  if (inp.cohortSize < 1) errs.push({ field: "cohortSize", message: "Cohort size must be ≥ 1 unit/year" });
  if (inp.virginShare < 0 || inp.virginShare > 1) errs.push({ field: "virginShare", message: "Virgin share must be 0–1" });
  if (inp.scrapRate < 0 || inp.scrapRate > 1) errs.push({ field: "scrapRate", message: "Scrap rate must be 0–1" });
  if (inp.fxUsdEur <= 0) errs.push({ field: "fxUsdEur", message: "FX must be > 0" });
  if (inp.utilizationHoursPerYear < 0) errs.push({ field: "utilizationHoursPerYear", message: "Utilization cannot be negative" });
  if (inp.bom.length === 0) errs.push({ field: "bom", message: "Add at least one BOM component" });
  inp.bom.forEach((r, i) => {
    if (r.massKg < 0) errs.push({ field: `bom[${i}].massKg`, message: `Component ${i+1} mass cannot be negative` });
    if (r.virginShare !== null && (r.virginShare < 0 || r.virginShare > 1)) errs.push({ field: `bom[${i}].virginShare`, message: `Component ${i+1} virgin share must be 0–1` });
  });
  const totalMass = inp.bom.reduce((a, r) => a + (r.massKg || 0), 0);
  if (totalMass === 0 && inp.bom.length > 0) errs.push({ field: "bom", message: "Total BOM mass is 0 kg — add masses" });
  return errs;
}
