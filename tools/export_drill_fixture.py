#!/usr/bin/env python3
"""Export the cordless-drill worked example as a golden fixture (fixtures/drill.json).

The web app (web/src/lib/model.ts) re-derives everything from `inputs` + `params`
+ `gates`; the values in `expected` are the acceptance targets (parity tests).
Regenerate after any change to the model:  python tools/export_drill_fixture.py
"""

import json
import math
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "fixtures" / "drill.json"

BOM = [
    ("Motor & drivetrain", "Copper, steel", 0.35, 0.90),
    ("Gearbox & chuck", "Steel", 0.18, 0.90),
    ("Battery pack", "Li-ion cells, casing", 0.30, 0.90),
    ("Housing & handle", "PA6-GF / ABS", 0.45, 0.90),
    ("Electronics (PCB, controller)", "Copper, ICs, PCB", 0.12, 0.90),
]

VIRGIN_SHARE = 0.90
SCRAP_RATE = 0.08
SERVICE_LIFE = 8
UTILIZATION = 100
COHORT = 1000
FX = 0.92          # EUR per 1 USD
CO2E = 2.2         # kg CO2e per kg virgin avoided
PRICE, COGS, OVERHEAD = 89, 42, 22

# 20 levers: code, name, group, factor, gates (q1,q2,q3), cost EUR/1000 (analyst)
LEVERS = [
    ("1a", "Source recyclate", "I — Materials recirculation", "VM / TM", ("Y", "Y", "Y"), -3),
    ("1b", "Recycle closed loop", "I — Materials recirculation", "VM / TM", ("Y", "Y", "Y"), -6),
    ("1c", "Recycling allowance in design", "I — Materials recirculation", "VM / TM", ("Y", "Y", "Y"), -9),
    ("2a", "Remanufacture internal", "I — Materials recirculation", "VM / TM", ("Y", "Y", "Y"), 4),
    ("2b", "Remanufacture external", "I — Materials recirculation", "VM / TM", ("Y", "N", "Y"), 0),
    ("3a", "Design for recirculation", "I — Materials recirculation", "VM / TM", ("Y", "N", "Y"), 0),
    ("3b", "Take-back and sell recyclate", "I — Materials recirculation", "VM / TM", ("N", "Y", "Y"), 0),
    ("4a", "Reduce waste", "II — Materials efficiency", "TM / P", ("Y", "Y", "Y"), -47),
    ("4b", "Valorize waste", "II — Materials efficiency", "TM / P", ("Y", "Y", "Y"), -85),
    ("5a", "Redesign product", "II — Materials efficiency", "TM / P", ("Y", "Y", "Y"), -80),
    ("5b", "Rethink value proposition", "II — Materials efficiency", "TM / P", ("Y", "Y", "N"), 0),
    ("5c", "Redesign materials", "II — Materials efficiency", "TM / P", ("N", "Y", "Y"), 0),
    ("6a", "Sharing", "III — Circular business models", "P / US", ("N", "Y", "Y"), 0),
    ("6b", "Leasing", "III — Circular business models", "P / US", ("Y", "Y", "Y"), -3560),
    ("6c", "Reuse", "III — Circular business models", "P / US", ("Y", "Y", "Y"), -31),
    ("7a", "Repair", "III — Circular business models", "P / US", ("Y", "Y", "Y"), 336),
    ("7b", "Refurbish", "III — Circular business models", "P / US", ("Y", "Y", "Y"), -172),
    ("7c", "Durability", "III — Circular business models", "P / US", ("Y", "Y", "Y"), 374),
    ("7d", "Care", "III — Circular business models", "P / US", ("Y", "Y", "Y"), 471),
    ("8a", "Reduce over-production", "III — Circular business models", "P / US", ("Y", "Y", "Y"), -1661),
]

PARAMS = dict(
    scrap_pp=0.0145, recycled_uplift=0.005, return_rate=0.25, closed_loop_yield=0.026,
    recyc_design_uplift=0.75, reman_units=30, reman_yield=0.14, valorized_share=0.25,
    mass_reduction=0.027, leasing_uplift=1.148, reuse_share=0.0114, refurb_share=0.039,
    life_ext_repair=0.017, life_ext_durability=0.013, life_ext_care=0.010, unsold_units=68,
)

# ---- derived quantities (mirror of the spreadsheet formulas)
mass = sum(b[2] for b in BOM)
scrap = SCRAP_RATE * mass
tm = mass + scrap
vm_product = sum(b[2] * (b[3] if b[3] is not None else VIRGIN_SHARE) for b in BOM)
vm = vm_product + VIRGIN_SHARE * scrap
circulated = tm - vm
ratio1, ratio2, ratio3 = vm / tm, tm / mass, mass / SERVICE_LIFE
vm_us_per_year = vm / SERVICE_LIFE
vm_us_cohort = vm_us_per_year * COHORT
cohort_vm = vm * COHORT
ebit_unit = PRICE - COGS - OVERHEAD
ebit_cohort = ebit_unit * COHORT

def lever_kg(code: str) -> float:
    kg = {
        "1a": PARAMS["recycled_uplift"] * tm * COHORT,
        "1b": PARAMS["return_rate"] * PARAMS["closed_loop_yield"] * mass * COHORT,
        "1c": PARAMS["recyc_design_uplift"] * (PARAMS["recycled_uplift"] * tm * COHORT
                                              + PARAMS["return_rate"] * PARAMS["closed_loop_yield"] * mass * COHORT),
        "2a": PARAMS["reman_units"] * PARAMS["reman_yield"] * mass,
        "2b": 0.0, "3a": 0.0, "3b": 0.0, "5b": 0.0, "5c": 0.0, "6a": 0.0,
        "4a": PARAMS["scrap_pp"] * tm * COHORT,
        "4b": PARAMS["valorized_share"] * scrap * COHORT,
        "5a": PARAMS["mass_reduction"] * mass * COHORT,
        "6b": mass * (PARAMS["leasing_uplift"] - 1) / PARAMS["leasing_uplift"] * COHORT,
        "6c": PARAMS["reuse_share"] * mass * COHORT,
        "7a": PARAMS["life_ext_repair"] * mass * COHORT,
        "7b": PARAMS["refurb_share"] * mass * COHORT,
        "7c": PARAMS["life_ext_durability"] * mass * COHORT,
        "7d": PARAMS["life_ext_care"] * mass * COHORT,
        "8a": PARAMS["unsold_units"] * mass,
    }
    return kg[code]

levers = []
for code, name, group, factor, gates, cost in LEVERS:
    included = all(g == "Y" for g in gates)
    kg = lever_kg(code)
    eur_per_kg = cost / kg if kg else None
    usd_per_kg = eur_per_kg / FX if eur_per_kg is not None else None
    co2e = kg * CO2E
    tier = None if not included else ("T1" if cost < 0 else ("T2" if kg >= 10 else "T3"))
    levers.append({
        "code": code, "name": name, "group": group, "factor": factor,
        "gates": list(gates), "included": included, "kg": kg, "costEurPer1000": cost,
        "eurPerKg": eur_per_kg, "usdPerKg": usd_per_kg, "co2eKg": co2e,
        "shareOfCohortVirgin": kg / cohort_vm if cohort_vm else 0.0, "tier": tier,
    })

inc = [l for l in levers if l["included"]]
cost_i = lambda l: l["eurPerKg"]
sorted_codes = [l["code"] for l in sorted(inc, key=lambda l: (l["eurPerKg"] if l["eurPerKg"] is not None else 1e99))]
sums = {
    "includedKg": sum(l["kg"] for l in inc),
    "includedCostEur": sum(l["costEurPer1000"] for l in inc),
    "includedCo2eKg": sum(l["co2eKg"] for l in inc),
    "tier1Kg": sum(l["kg"] for l in inc if l["tier"] == "T1"),
    "tier1SavingsEur": sum(l["costEurPer1000"] for l in inc if l["tier"] == "T1"),
    "tier2CostsEur": sum(l["costEurPer1000"] for l in inc if l["tier"] == "T2"),
    "tier1Count": sum(1 for l in inc if l["tier"] == "T1"),
    "tier2Count": sum(1 for l in inc if l["tier"] == "T2"),
    "tier3Count": sum(1 for l in inc if l["tier"] == "T3"),
    "excludedCount": len(levers) - len(inc),
}

fixture = {
    "meta": {"product": "Cordless power drill (illustrative worked example)", "version": 1,
             "generatedBy": "tools/export_drill_fixture.py", "units": "per 1,000-unit cohort per year"},
    "inputs": {
        "productName": "Cordless power drill (illustrative example)",
        "usStatement": "one cordless drill over an 8-year useful life (≈ 800 operating hours)",
        "serviceLifeYears": SERVICE_LIFE, "utilizationHoursPerYear": UTILIZATION,
        "cohortSize": COHORT, "baseYear": 2026, "fxUsdEur": FX, "co2eFactor": CO2E,
        "virginShare": VIRGIN_SHARE, "scrapRate": SCRAP_RATE,
        "unitPrice": PRICE, "cogs": COGS, "allocatedOverhead": OVERHEAD,
        "bom": [{"component": c, "family": f, "massKg": m, "virginShare": v} for c, f, m, v in BOM],
    },
    "params": PARAMS,
    "levers": [
        {
            "code": l["code"],
            "gates": [g == "Y" for g in l["gates"]],
            "included": l["included"],
            "costEurPer1000": l["costEurPer1000"],
        }
        for l in levers
    ],
    "expected": {
        "massKg": mass, "scrapKg": scrap, "totalMaterialsKg": tm,
        "vmProductKg": vm_product, "vmScrapKg": VIRGIN_SHARE * scrap, "virginMaterialKg": vm,
        "circulatedKg": circulated,
        "ratio1": ratio1, "ratio2": ratio2, "ratio3": ratio3,
        "vmUsPerYear": vm_us_per_year, "vmUsCohort": vm_us_cohort, "cohortVm": cohort_vm,
        "ebitUnit": ebit_unit, "ebitCohort": ebit_cohort,
        "leverKg": {l["code"]: l["kg"] for l in levers},
        "eurPerKg": {l["code"]: l["eurPerKg"] for l in levers},
        "usdPerKg": {l["code"]: l["usdPerKg"] for l in levers},
        "co2eKg": {l["code"]: l["co2eKg"] for l in levers},
        "tier": {l["code"]: l["tier"] for l in levers},
        "sums": sums, "sortedCodes": sorted_codes,
    },
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(fixture, indent=2, ensure_ascii=False), encoding="utf-8")
web_out = REPO / "web" / "lib" / "fixtures" / "drill.json"
web_out.parent.mkdir(parents=True, exist_ok=True)
web_out.write_text(OUT.read_text(encoding="utf-8"), encoding="utf-8")
print(f"written {OUT}")
print(f"written {web_out}")
print(f"mass={mass:.4f} tm={tm:.4f} vm={vm:.4f} r1={ratio1:.4f} r2={ratio2:.4f} vm_us={vm_us_per_year:.4f}")
print(f"included={len(inc)}  kg_sum={sums['includedKg']:.3f}  cost_sum={sums['includedCostEur']:,.0f}  co2e_sum={sums['includedCo2eKg']:,.0f}")
print(f"sorted: {' -> '.join(sorted_codes)}")
