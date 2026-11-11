#!/usr/bin/env python3
"""
build_ccc_template.py — generate templates/circularity-cost-curve-template.xlsx

Reproducible generator for the Circularity Cost Curve spreadsheet template
(Phase 2 of the framework). The workbook is macro-free; all calculations are
native Excel formulas over named ranges. The cordless-drill worked example
from the framework documentation (Section 5) is pre-filled as live, and
sheet 09 contains it again as a static answer key with PASS/FAIL checks.

Usage:  python tools/build_ccc_template.py
"""

from __future__ import annotations

import math
from pathlib import Path

from openpyxl import Workbook
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.chart.axis import ChartLines
from openpyxl.comments import Comment
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.properties import PageSetupProperties

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "templates" / "circularity-cost-curve-template.xlsx"

NAVY = "1F3252"
STEEL = "2E5077"
LIGHT = "DCE6F1"
INPUT = "FFF2CC"   # analyst input (yellow)
CALC = "FFFFFF"    # formula cell
TOTAL = "E7EEF7"   # totals / emphasis
NOTE = "F5F5F5"    # notes / answer key
OUTROW = "F2F2F2"  # screened-out lever rows
GREEN = "C6EFCE"
RED = "FFC7CE"

thin = Side(style="thin", color="BFBFBF")
box = Border(left=thin, right=thin, top=thin, bottom=thin)
top_double = Border(top=Side(style="double", color=STEEL))

def title_block(ws, title, subtitle, ncols):
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=ncols)
    c = ws.cell(row=1, column=1, value=title)
    c.font = Font(name="Calibri", bold=True, size=18, color=STEEL)
    c.alignment = Alignment(vertical="center")
    ws.row_dimensions[1].height = 26
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=ncols)
    c = ws.cell(row=2, column=1, value=subtitle)
    c.font = Font(name="Calibri", italic=True, size=9, color="595959")
    c.alignment = Alignment(wrap_text=True, vertical="center")
    ws.row_dimensions[2].height = 30

def header_row(ws, row, col0, headers, widths=None):
    for i, h in enumerate(headers):
        c = ws.cell(row=row, column=col0 + i, value=h)
        c.font = Font(bold=True, size=9, color="FFFFFF", name="Calibri")
        c.fill = PatternFill("solid", fgColor=STEEL)
        c.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
        c.border = box
    ws.row_dimensions[row].height = 30

def section(ws, row, col0, ncols, text):
    ws.merge_cells(start_row=row, start_column=col0, end_row=row, end_column=col0 + ncols - 1)
    c = ws.cell(row=row, column=col0, value=text)
    c.font = Font(bold=True, size=10, color="FFFFFF", name="Calibri")
    c.fill = PatternFill("solid", fgColor=NAVY)
    c.alignment = Alignment(vertical="center")
    ws.row_dimensions[row].height = 20

def set_cell(ws, row, col, value, kind="calc", fmt=None, wrap=False, bold=False, comment=None):
    c = ws.cell(row=row, column=col, value=value)
    c.font = Font(name="Calibri", size=10, bold=bold)
    c.alignment = Alignment(vertical="center", wrap_text=wrap)
    if kind == "input":
        c.fill = PatternFill("solid", fgColor=INPUT)
    elif kind == "note":
        c.fill = PatternFill("solid", fgColor=NOTE)
        c.font = Font(name="Calibri", size=9, italic=True, color="595959")
    elif kind == "total":
        c.fill = PatternFill("solid", fgColor=TOTAL)
        c.border = Border(top=Side(style="double", color=STEEL))
    elif kind == "out":
        c.fill = PatternFill("solid", fgColor=OUTROW)
    if fmt:
        c.number_format = fmt
    if wrap:
        c.alignment = Alignment(wrap_text=True, vertical="center")
    if comment:
        c.comment = Comment(comment, "Circularity team")
    return c

def col_widths(ws, widths):
    for col, w in widths.items():
        ws.column_dimensions[col].width = w

def freeze(ws, cell):
    ws.freeze_panes = cell

def page_setup(ws):
    ws.page_setup.orientation = "landscape"
    ws.page_setup.paperSize = 5  # legal
    ws.page_margins.left = 0.4
    ws.page_margins.right = 0.4
    ws.page_margins.top = 0.35
    ws.page_margins.bottom = 0.35
    ws.page_margins.footer = 0.2
    ws.page_margins.header = 0.2
    ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0

def defined_name(wb, name, ref):
    wb.defined_names[name] = DefinedName(name, attr_text=ref)

Q = "'"  # quote char for sheet refs in formulas
def ref(sheet, cell):
    return f"{Q}{sheet}{Q}!{cell}"

wb = Workbook()
wb.remove(wb["Sheet"])

S_COVER, S_IN, S_FAC, S_SCR, S_QNT, S_CCC, S_SEN, S_DEC, S_CHK, S_TPL = (
    "01 Cover", "02 Inputs", "03 BOM & Factors", "04 Lever Screen",
    "05 Quantification", "06 CCC Output", "07 Sensitivities",
    "08 Decision Summary", "09 Answer Key & Checks", "10 Template (blank)",
)

FORM_SHORT = '#,##0.0;[Red](#,##0.0)'
EUR0 = '€#,##0;[Red](€#,##0)'
EUR1 = '€#,##0.0;[Red](€#,##0.0)'
USD1 = '$#,##0.0;[Red]($#,##0.0)'
PCT0 = '0.0%'
PCT2 = '0.00%'
KG0 = '#,##0" kg"'
KG1 = '#,##0.0" kg"'
R3 = '0.000'
INT0 = '#,##0'
EIN = '€#,##0.00;[Red](€#,##0.00)'
EIN_KG = '€#,##0.00"/kg";[Red](€#,##0.00)"/kg"'
USD_KG = '$#,##0.00"/kg";[Red]($#,##0.00)"/kg"'

# ============================================================ 01 Cover
ws = wb.create_sheet(S_COVER)
page_setup(ws); freeze(ws, "A3")
title_block(ws, "Circularity Cost Curve — Template Workbook",
            "Phase 2 of the Circularity Decision Framework. EUR variant (Variant B) is the default view; Variant A (USD) is included for continuity. All formulas are live; no macros, no external links.", 8)
col_widths(ws, {"A": 30, "B": 46, "C": 46, "D": 46, "E": 46, "F": 40, "G": 40, "H": 40})
section(ws, 4, 1, 3, "What this workbook does")
cover_lines = [
    ("Quantify the circularity opportunity", "for any manufactured product, using the 20-lever taxonomy and the telescoping decomposition VM/US = (VM/TM) × (TM/P) × (P/US)."),
    ("Produce both CCC variants", "Variant A — cost per kg virgin material avoided (USD/kg, classic cost-curve read) and Variant B — same levers re-expressed per 1,000-unit annual cohort (EUR/kg), with kg CO₂e per lever and a cumulative-kg axis."),
    ("Auto-tier the levers", "No-regret (cost < 0), strategic investments (positive cost, ≥ 10 kg), monitor (positive, < 10 kg) — see sheet 08."),
    ("Stay honest", "excluded levers are reported, double counting is flagged, and every total is labelled an upper bound."),
]
r = 6
for t, d in cover_lines:
    set_cell(ws, r, 1, t, kind="note", bold=False)
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=3)
    set_cell(ws, r, 2, d, wrap=True)
    ws.row_dimensions[r].height = 30
    r += 1
section(ws, 12, 1, 3, "How to adapt to your product")
steps = [
    ("1", "1. Save a copy", "File → Save As → your product name. Never overwrite the worked example."),
    ("2", "2. Fill 02 Inputs", "Product, US statement, life/utilization, cohort size, FX, CO₂e factor, price/COGS/overhead, BOM with masses and virgin shares."),
    ("3", "3. Check 03 BOM & factors", "P, TM, VM, the three factors and the VM/US identity residual. The identity check must read PASS."),
    ("4", "4. Screen on 04", "Answer the three gate questions per lever (Y/N) with a reason for every exclusion."),
    ("5", "5. Quantify on 05", "kg formulas are model-driven (parameters at right); Δcost €/1,000 is analyst-estimated — override any kg cell or edit parameters. Record basis and confidence."),
    ("6", "6. Read 06–08", "Sorted CCC charts, cumulative kg avoided, Tier list, totals (upper bound). Sensitivities on 07 show what moves the answer."),
]
r = 14
for n, t, d in steps:
    set_cell(ws, r, 1, t, kind="total", bold=True)
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=3)
    set_cell(ws, r, 2, d, wrap=True)
    ws.row_dimensions[r].height = 30
    r += 1
section(ws, 22, 1, 3, "Colour conventions")
legend = [(INPUT, "Yellow — analyst input (edit me)"), (CALC, "White — live formula (do not edit)"), (OUTROW, "Grey — lever screened out (excluded from curves)"), (NOTE, "Grey italic — guidance text")]
r = 24
for fill, txt in legend:
    c = ws.cell(row=r, column=1, value="")
    c.fill = PatternFill("solid", fgColor=fill); c.border = box
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=3)
    set_cell(ws, r, 2, txt)
    r += 1
section(ws, 30, 1, 3, "Contents")
toc = [("02 Inputs", "Product profile, economics, BOM grid"), ("03 BOM & Factors", "Live factors: VM/TM, TM/P, P/US, VM/US + identity check"),
       ("04 Lever Screen", "20 levers × 3 gate questions; include/exclude with reasons"), ("05 Quantification", "Hybrid model: formula kg + analyst Δcost; €/kg, $/kg, kg CO₂e"),
       ("06 CCC Output", "Both variants, sorted charts, cumulative kg line"), ("07 Sensitivities", "Low/base/high for return rate, leasing uplift, life-extension, recycled uplift, CO₂e factor, labour cost"),
       ("08 Decision Summary", "Auto-tiered levers; totals; upper-bound caveat"), ("09 Answer Key & Checks", "Drill example vs documentation; PASS/FAIL roll-up"), ("10 Template (blank)", "Printable blank input map for your product")]
r = 32
for nm, d in toc:
    set_cell(ws, r, 1, nm, bold=True, kind="total")
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=3)
    set_cell(ws, r, 2, d, wrap=True)
    r += 1
section(ws, 43, 1, 3, "Doc control")
docrow = [("Version", "1.1 — November 2026"), ("Method reference", "Circularity Decision Framework v1.2, Sections 4–8"), ("Currency", "EUR default (0.92 EUR/USD, illustrative); USD shown for Variant A"), ("Charts", "Variant B bars are uniform width here — native Excel charts cannot vary bar width per category. The web app renders the canonical variable-width CCC (bar width ∝ kg avoided)"), ("Verification", "Sheet 09 checks must all read PASS"), ("Disclaimer", "Values in the pre-filled example are illustrative; replace with your own data before decisions")]
r = 45
for k, v in docrow:
    set_cell(ws, r, 1, k, bold=True, kind="note")
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=3)
    set_cell(ws, r, 2, v, wrap=True)
    r += 1

# ============================================================ 02 Inputs
ws = wb.create_sheet(S_IN)
page_setup(ws); freeze(ws, "A3")
title_block(ws, "02 — Inputs: Product profile", "Yellow = analyst input. White = formula. Fill top to bottom; every downstream sheet recomputes automatically.", 6)
col_widths(ws, {"A": 40, "B": 34, "C": 15, "D": 24, "E": 17, "F": 18})
section(ws, 4, 1, 6, "A — Product & service")
rows = [
    (5, "Product name", "Cordless power drill (illustrative example)", "input", None, None),
    (6, "Useful service (US) statement", "one cordless drill over an 8-year useful life (≈ 800 operating hours)", "input", None, "Define the service, not the object. One sentence, measurable, constant across all levers."),
    (7, "Service life (years)", 8, "input", "0.0", "Useful life over which one drill delivers the US."),
    (8, "Utilization (hours / year)", 100, "input", INT0, "Average annual operating hours per drill."),
    (9, "Cohort size (units per year)", 1000, "input", INT0, "Annual production cohort. Normalises Variant B per 1,000 units."),
    (10, "Base year", 2026, "input", "0", "Cost/price reference year."),
    (11, "FX: EUR per 1 USD", 0.92, "input", "0.00", "Illustrative. Used to derive Variant A (USD/kg) from EUR model."),
    (12, "CO₂e factor (kg CO₂e / kg virgin avoided)", 2.2, "input", "0.0", "Default is a plastics/steel/copper blend; replace with your LCA factor."),
    (13, "Virgin share of material input (fraction of TM)", 0.90, "input", PCT0, "Global default used where a BOM row leaves virgin share blank."),
    (14, "Production scrap rate (fraction of P)", 0.08, "input", PCT0, "Scrap kg = scrap_rate × P. If your process defines scrap relative to input, adjust here (see 03 note)."),
]
for r, lbl, v, kind, fmt, cmt in rows:
    set_cell(ws, r, 1, lbl, wrap=True, bold=True)
    set_cell(ws, r, 2, v, kind=kind, fmt=fmt, comment=cmt)
    ws.row_dimensions[r].height = 22
section(ws, 15, 1, 6, "B — Economics (per unit, excl. VAT)")
erows = [
    (16, "Selling price (ex-factory, €/unit)", 89, EUR0, None),
    (17, "Variable cost (COGS excl. overhead, €/unit)", 42, EUR0, None),
    (18, "Allocated overhead (€/unit)", 22, EUR0, None),
]
for r, lbl, v, fmt, cmt in erows:
    set_cell(ws, r, 1, lbl, wrap=True, bold=True)
    set_cell(ws, r, 2, v, kind="input", fmt=fmt, comment=cmt)
section(ws, 20, 1, 6, "C — Bill of materials (mass & virgin share)")
header_row(ws, 21, 1, ["Component", "Material family", "Mass (kg)", "Virgin share (blank = default)", "Virgin mass (kg)", "Share of product"])
bom = [("Motor & drivetrain", "Copper, steel", 0.35, 0.90), ("Gearbox & chuck", "Steel", 0.18, 0.90), ("Battery pack", "Li-ion cells, casing", 0.30, 0.90), ("Housing & handle", "PA6-GF / ABS", 0.45, 0.90), ("Electronics (PCB, controller)", "Copper, ICs, PCB", 0.12, 0.90)]
BOM_FIRST, BOM_LAST = 22, 28
for i, (comp, fam, mass, vs) in enumerate(bom):
    r = BOM_FIRST + i
    set_cell(ws, r, 1, comp, kind="input", wrap=True); set_cell(ws, r, 2, fam, kind="input", wrap=True)
    set_cell(ws, r, 3, mass, kind="input", fmt="0.00"); set_cell(ws, r, 4, vs, kind="input", fmt=PCT0)
    set_cell(ws, r, 5, f'=IF($A{r}="","",C{r}*IF(D{r}="",virgin_share,D{r}))', fmt="0.000")
    set_cell(ws, r, 6, f'=IF($A{r}="","",C{r}/$C$29)', fmt=PCT0)
for r in range(BOM_FIRST + len(bom), BOM_LAST + 1):
    set_cell(ws, r, 1, "", kind="input"); set_cell(ws, r, 2, "", kind="input")
    set_cell(ws, r, 3, "", kind="input", fmt="0.00"); set_cell(ws, r, 4, "", kind="input", fmt=PCT0)
    set_cell(ws, r, 5, f'=IF($A{r}="","",C{r}*IF(D{r}="",virgin_share,D{r}))', fmt="0.000")
    set_cell(ws, r, 6, f'=IF($A{r}="","",C{r}/$C$29)', fmt=PCT0)
ws.merge_cells(start_row=29, start_column=1, end_row=29, end_column=2)
set_cell(ws, 29, 1, "TOTAL", kind="total", bold=True)
set_cell(ws, 29, 3, f"=SUM(C{BOM_FIRST}:C{BOM_LAST})", kind="total", fmt="0.00", bold=True)
set_cell(ws, 29, 4, "", kind="total")
set_cell(ws, 29, 5, f"=SUM(E{BOM_FIRST}:E{BOM_LAST})", kind="total", fmt="0.000", bold=True)
set_cell(ws, 29, 6, "", kind="total")

# named ranges for 02
for nm, addr in [("service_life_years", "$B$7"), ("utilization_hours_per_year", "$B$8"), ("cohort_size", "$B$9"),
                 ("base_year", "$B$10"), ("fx_usd_eur", "$B$11"), ("co2e_factor", "$B$12"), ("virgin_share", "$B$13"),
                 ("scrap_rate", "$B$14"), ("unit_price", "$B$16"), ("cogs", "$B$17"), ("allocated_overhead", "$B$18")]:
    defined_name(wb, nm, f"'{S_IN}'!{addr}")
defined_name(wb, "bom_mass_range", f"'{S_IN}'!$C${BOM_FIRST}:$C${BOM_LAST}")
defined_name(wb, "bom_virgin_range", f"'{S_IN}'!$E${BOM_FIRST}:$E${BOM_LAST}")

# ============================================================ 03 BOM & Factors
ws = wb.create_sheet(S_FAC)
page_setup(ws); freeze(ws, "A3")
title_block(ws, "03 — BOM & factors (live)", "Computed from 02 Inputs. The identity VM/US ≡ (VM/TM) × (TM/P) × (P/US) must read PASS.", 4)
col_widths(ws, {"A": 52, "B": 18, "C": 16, "D": 62})
section(ws, 4, 1, 4, "Factor decomposition (per drill, then per cohort)")
fac_rows = [
    (5, "P — product mass (kg)", "=SUM(bom_mass_range)", "fmt", "0.000", "1.400", ""),
    (6, "Scrap = scrap_rate × P (kg)", "=scrap_rate*B5", "fmt", "0.000", "0.112", "Convention: scrap relative to product mass. Switch to P/(1−scrap) on 02 note if needed — immaterial here."),
    (7, "TM — total materials (kg)", "=B5+B6", "fmt", "0.000", "1.512", "P + scrap."),
    (8, "VM in finished product (kg)", "=SUM(bom_virgin_range)", "fmt", "0.000", "1.260", "Σ component mass × its virgin share (default 02!B13)."),
    (9, "VM in scrap (kg)", "=virgin_share*B6", "fmt", "0.000", "0.101", ""),
    (10, "VM — total virgin material (kg)", "=B8+B9", "fmt", "0.000", "1.361", ""),
    (11, "Recirculated = TM − VM (kg)", "=B7-B10", "fmt", "0.000", "0.151", ""),
    (12, "Factor 1 — VM / TM", "=B10/B7", "fmt", R3, "0.900", "Lower is better. Group I levers move this."),
    (13, "Factor 2 — TM / P", "=B7/B5", "fmt", R3, "1.080", "Lower is better. Group II levers move this."),
    (14, "Factor 3 — P / US  (kg per drill-year)", "=B5/service_life_years", "fmt", R3, "0.175", "Lower is better. Group III levers move this."),
    (15, "VM / US (kg per unit-year)", "=B10/service_life_years", "fmt", "0.0000", "0.170", "Headline circularity metric."),
    (16, "VM / US × cohort (kg per cohort-year)", f"=B15*cohort_size", "fmt", KG1, "170.3", "Per 1,000 units per year."),
    (17, "EBIT per unit (€)", "=unit_price-cogs-allocated_overhead", "fmt", EUR0, "€25", ""),
    (18, "EBIT per cohort (€)", "=B17*cohort_size", "fmt", EUR0, "€25,000", ""),
    (19, "Identity residual |B15 − B12×B13×B14|", "=ABS(B15-B12*B13*B14)", "fmt", "0.00E+00", "≈ 0", "Telescoping check — must be ~0."),
    (20, "Identity check", '=IF(B19<0.0000001,"PASS","FAIL")', "check", None, "PASS", ""),
    (22, "Cohort virgin material (kg)", "=B10*cohort_size", "fmt", KG0, "1,361", "Denominator for lever shares."),
    (23, "Cohort total materials (kg)", "=B7*cohort_size", "fmt", KG0, "1,512", ""),
]
for r, lbl, formula, kind, fmt, ref, note in fac_rows:
    set_cell(ws, r, 1, lbl, wrap=True, bold=True)
    set_cell(ws, r, 2, formula, fmt=fmt, bold=(r in (19, 20)))
    set_cell(ws, r, 3, ref, kind="note")
    set_cell(ws, r, 4, note, kind="note", wrap=True)
    ws.row_dimensions[r].height = 20
set_cell(ws, 20, 2, '=IF(B19<0.0000001,"PASS","FAIL")')
for nm, addr in [("total_mass", "$B$5"), ("scrap_kg", "$B$6"), ("total_materials", "$B$7"), ("vm_product", "$B$8"),
                 ("vm_scrap", "$B$9"), ("virgin_material", "$B$10"), ("circulated_kg", "$B$11"), ("ratio1", "$B$12"),
                 ("ratio2", "$B$13"), ("ratio3", "$B$14"), ("vm_us_per_year", "$B$15"), ("vm_us_cohort", "$B$16"),
                 ("ebit_unit", "$B$17"), ("ebit_cohort", "$B$18"), ("cohort_vm", "$B$22"), ("cohort_tm", "$B$23")]:
    defined_name(wb, nm, f"'{S_FAC}'!{addr}")
ws.conditional_formatting.add("B20", CellIsRule(operator="equal", formula=['"PASS"'], fill=PatternFill("solid", fgColor=GREEN)))
ws.conditional_formatting.add("B20", CellIsRule(operator="equal", formula=['"FAIL"'], fill=PatternFill("solid", fgColor=RED)))
ws.freeze_panes = "A5"

# ============================================================ 04 Lever Screen
ws = wb.create_sheet(S_SCR)
page_setup(ws); freeze(ws, "A5")
title_block(ws, "04 — Lever screen (applicability gates)", "Answer the three gate questions per lever (Y or N, dropdown). Any N parks the lever — reason required. Screened-out levers are excluded from the curves.", 9)
col_widths(ws, {"A": 7, "B": 30, "C": 17, "D": 34, "E": 12, "F": 13, "G": 12, "H": 12, "I": 58})
header_row(ws, 4, 1, ["Code", "Lever", "Group", "Factor it moves", "Allowed?", "Measurable?", "In scope?", "Included?", "Reason / note"])
LEVERS = [
    ("1a", "Source recyclate", "I — Recirculation", "Factor 1 — VM/TM", "Y", "Y", "Y", "No-regret; default +0.5 pp recycled uplift"),
    ("1b", "Recycle closed loop", "I — Recirculation", "Factor 1 — VM/TM", "Y", "Y", "Y", "Take-back at 25% end-of-life return assumed"),
    ("1c", "Recycling allowance in design", "I — Recirculation", "Factor 1 — VM/TM", "Y", "Y", "Y", "Enabler; modelled as uplift on 1a + 1b kg"),
    ("2a", "Remanufacture internal", "I — Recirculation", "Factor 1 — VM/TM", "Y", "Y", "Y", "In-house line; 30 units/cohort pilot"),
    ("2b", "Remanufacture external", "I — Recirculation", "Factor 1 — VM/TM", "Y", "N", "Y", "No qualified external remanufacturer under current contract"),
    ("3a", "Design for recirculation", "I — Recirculation", "Factor 1 — VM/TM", "Y", "N", "Y", "Folded into 1c / 5a; not quantified separately"),
    ("3b", "Take-back and sell recyclate", "I — Recirculation", "Factor 1 — VM/TM", "N", "Y", "Y", "No take-back channel yet; strategic option if 6b lands"),
    ("4a", "Reduce waste", "II — Efficiency", "Factor 2 — TM/P", "Y", "Y", "Y", "Scrap 8.0% → 6.55% (−1.45 pp)"),
    ("4b", "Valorize waste", "II — Efficiency", "Factor 2 — TM/P", "Y", "Y", "Y", "25% of scrap stream valorized"),
    ("5a", "Redesign product", "II — Efficiency", "Factor 2 — TM/P", "Y", "Y", "Y", "2.7% mass reduction (lightweighting, part consolidation)"),
    ("5b", "Rethink value proposition", "II — Efficiency", "Factor 2 — TM/P", "Y", "Y", "N", "Portfolio decision (drill-as-subscription); shown in §5.7 overlay"),
    ("5c", "Redesign materials", "II — Efficiency", "Factor 2 — TM/P", "N", "Y", "Y", "Housing polymer locked by PA6-GF40 impact spec"),
    ("6a", "Sharing", "III — Business models", "Factor 3 — P/US", "N", "Y", "Y", "No sharing infrastructure in consumer DIY segment"),
    ("6b", "Leasing", "III — Business models", "Factor 3 — P/US", "Y", "Y", "Y", "Target: 1.15× utilization uplift (drills-as-a-service)"),
    ("6c", "Reuse", "III — Business models", "Factor 3 — P/US", "Y", "Y", "Y", "Resale / second-life channel; 1.14% of cohort"),
    ("7a", "Repair", "III — Business models", "Factor 3 — P/US", "Y", "Y", "Y", "Service + spare parts; positive cost, lifetime yield"),
    ("7b", "Refurbish", "III — Business models", "Factor 3 — P/US", "Y", "Y", "Y", "Factory refurb line; 3.9% of cohort displaces new"),
    ("7c", "Durability", "III — Business models", "Factor 3 — P/US", "Y", "Y", "Y", "Cycles/drop/battery life engineering; validated by FMEA"),
    ("7d", "Care", "III — Business models", "Factor 3 — P/US", "Y", "Y", "Y", "Care programme subscription (filters, maintenance)"),
    ("8a", "Reduce over-production", "III — Business models", "Factor 3 — P/US", "Y", "Y", "Y", "Make-to-order planning fix; 68 units/cohort not produced"),
]
SCR_FIRST = 5
for i, (code, lever, group, factor, q1, q2, q3, reason) in enumerate(LEVERS):
    r = SCR_FIRST + i
    included = "Y" if (q1, q2, q3) == ("Y", "Y", "Y") else "N"
    set_cell(ws, r, 1, code, bold=True)
    set_cell(ws, r, 2, lever, wrap=True)
    set_cell(ws, r, 3, group, wrap=True)
    set_cell(ws, r, 4, factor, wrap=True)
    for col, q in ((5, q1), (6, q2), (7, q3)):
        set_cell(ws, r, col, q, kind="input").alignment = Alignment(horizontal="center", vertical="center")
    set_cell(ws, r, 8, f'=IF(COUNTIF(E{r}:G{r},"N")>0,"Out","In")', bold=True).alignment = Alignment(horizontal="center", vertical="center")
    set_cell(ws, r, 9, reason, wrap=True, kind="note" if included == "N" else "calc")
    if included == "N":
        for col in range(1, 10):
            if ws.cell(row=r, column=col).fill.fgColor.rgb != "FFF5F5F5":
                pass
    ws.row_dimensions[r].height = 22
SC_TOT = SCR_FIRST + len(LEVERS)
set_cell(ws, SC_TOT, 1, "Σ", kind="total", bold=True)
ws.merge_cells(start_row=SC_TOT, start_column=2, end_row=SC_TOT, end_column=7)
set_cell(ws, SC_TOT, 2, "Levers screened in / 20", kind="total", bold=True)
set_cell(ws, SC_TOT, 8, f'=COUNTIF(H{SCR_FIRST}:H{SC_TOT-1},"In")', kind="total", fmt="0", bold=True).alignment = Alignment(horizontal="center")
yadn = DataValidation(type="list", formula1='"Y,N"', allow_blank=False, showDropDown=False)
yadn.showInputMessage = True
ws.add_data_validation(yadn)
yadn.add(f"E{SCR_FIRST}:G{SC_TOT-1}")

# ============================================================ 05 Quantification
ws = wb.create_sheet(S_QNT)
page_setup(ws); freeze(ws, "A5")
title_block(ws, "05 — Lever quantification (hybrid)", "kg avoided is model-driven from the parameters at right (edit them, or override per row). Δcost €/1,000 is analyst-estimated (yellow). Screened-out levers compute but are excluded everywhere.", 19)
col_widths(ws, {"A": 7, "B": 30, "C": 16, "D": 11, "E": 15, "F": 14, "G": 15, "H": 15, "I": 15, "J": 15, "K": 15, "L": 15, "M": 44, "N": 11, "O": 3, "P": 28, "Q": 12, "R": 52})
header_row(ws, 4, 1, ["Code", "Lever", "Group", "Included?", "kg avoided\n(model)", "kg avoided\n(override)", "kg avoided\n(used)", "Δcost €\n/ 1,000 units", "Cost\n(€/kg)", "Cost\n($/kg)", "kg CO₂e\navoided", "Share of\ncohort virgin", "Basis / source note", "Conf."])
PARAMS = [
    ("P4", "Model parameter", "Value", "Note"),
]
section(ws, 4, 16, 3, "Model parameters (edit with care)")
params = [
    (5, "scrap_pp", 0.0145, "scrap_pp", "4a — scrap cut vs baseline, 8.0% → 6.55% (fraction of TM)", PCT2),
    (6, "recycled_uplift", 0.005, "recycled_uplift", "1a — +0.5 pp recycled share of material input", PCT2),
    (7, "return_rate", 0.25, "return_rate", "1b — end-of-life return rate, per cohort", PCT0),
    (8, "closed_loop_yield", 0.026, "closed_loop_yield", "1b — displaced virgin share per returned unit", PCT2),
    (9, "recyc_design_uplift", 0.75, "recyc_design_uplift", "1c — uplift on 1a + 1b kg from design-for-recycling", PCT0),
    (10, "reman_units", 30, "reman_units", "2a — units remanufactured per cohort", INT0),
    (11, "reman_yield", 0.14, "reman_yield", "2a — net virgin avoided per remanufactured unit (fraction of P)", PCT0),
    (12, "valorized_share", 0.25, "valorized_share", "4b — fraction of scrap stream valorized", PCT0),
    (13, "mass_reduction", 0.027, "mass_reduction", "5a — product mass reduction", PCT0),
    (14, "leasing_uplift", 1.148, "leasing_uplift", "6b — utilization multiplier under leasing (≈1.15)", "0.000"),
    (15, "reuse_share", 0.0114, "reuse_share", "6c — share of cohort resold / reused", PCT2),
    (16, "refurb_share", 0.039, "refurb_share", "7b — share of cohort refurbished, displacing new", PCT0),
    (17, "life_ext_repair", 0.017, "life_ext_repair", "7a — share of cohort demand avoided via repair life extension", PCT2),
    (18, "life_ext_durability", 0.013, "life_ext_durability", "7c — durability life extension", PCT2),
    (19, "life_ext_care", 0.010, "life_ext_care", "7d — care programme life extension", PCT2),
    (20, "unsold_units", 68, "unsold_units", "8a — units not produced per cohort (make-to-order)", INT0),
]
for r, lbl, v, nm, note, fmt in params:
    set_cell(ws, r, 16, lbl, kind="note", bold=True)
    set_cell(ws, r, 17, v, kind="input", fmt=fmt)
    set_cell(ws, r, 18, note, kind="note", wrap=True)
    defined_name(wb, nm, f"'{S_QNT}'!$Q${r}")
    ws.row_dimensions[r].height = 20

# main table: rows 5..24, same order as LEVERS
MODEL_KG = [
    "=recycled_uplift*total_materials*cohort_size",   # 1a
    "=return_rate*closed_loop_yield*total_mass*cohort_size",  # 1b
    "=recyc_design_uplift*(E5+E6)",                    # 1c
    "=reman_units*reman_yield*total_mass",             # 2a
    "=0",                                              # 2b
    "=0",                                              # 3a
    "=0",                                              # 3b
    "=scrap_pp*total_materials*cohort_size",           # 4a
    "=valorized_share*scrap_kg*cohort_size",           # 4b
    "=mass_reduction*total_mass*cohort_size",          # 5a
    "=0",                                              # 5b
    "=0",                                              # 5c
    "=0",                                              # 6a
    "=total_mass*(leasing_uplift-1)/leasing_uplift*cohort_size",  # 6b
    "=reuse_share*total_mass*cohort_size",             # 6c
    "=life_ext_repair*total_mass*cohort_size",         # 7a
    "=refurb_share*total_mass*cohort_size",            # 7b
    "=life_ext_durability*total_mass*cohort_size",     # 7c
    "=life_ext_care*total_mass*cohort_size",           # 7d
    "=unsold_units*total_mass",                        # 8a
]
COST_DEFAULT = [-3, -6, -9, 4, 0, 0, 0, -47, -85, -80, 0, 0, 0, -3560, -31, 336, -172, 374, 471, -1661]
BASIS = [
    "Recycled content uplift; cost ≈ neutral vs virgin at +0.5 pp",
    "25% return × 2.6% displaced share per returned unit; net of reverse logistics",
    "Enabler: 75% uplift on 1a+1b kg (design-for-recycling capture)",
    "30 remanufactured units × 14% net virgin displacement",
    "No external remanufacturer under current contract — override if adopted",
    "Folded into 1c / 5a — not quantified separately",
    "No take-back channel — strategic option post-6b",
    "Scrap −1.45 pp (8.0% → 6.55%); avoids disposal + material cost",
    "25% of scrap stream sold as feedstock",
    "2.7% mass reduction (lightweighting, part consolidation)",
    "Portfolio decision; not quantified here (see §5.7 overlay)",
    "Housing polymer locked by impact spec (PA6-GF40)",
    "No sharing infrastructure in this segment",
    "Leasing displaces units via 1.15× utilization; includes EBIT effect",
    "Resale / second-life; 1.14% of cohort",
    "Repair life extension — demand avoided ≈ 1.7% of cohort",
    "Refurbish 3.9% of cohort, displacing new units",
    "Durability life extension ≈ 1.3% of cohort; FMEA-validated",
    "Care programme life extension ≈ 1.0% of cohort",
    "Make-to-order planning fix; 68 unsold units/cohort not produced",
]
CONF = ["High", "Medium", "High", "Medium", "—", "—", "—", "High", "High", "High", "—", "—", "—", "Medium", "Medium", "Medium", "Medium", "Low", "Low", "High"]
SCR_RANGE = f"'{S_SCR}'!$A$5:$H$24"
Q_FIRST = 5
for i, lev in enumerate(LEVERS):
    r = Q_FIRST + i
    code, lever, group = lev[0], lev[1], lev[2]
    set_cell(ws, r, 1, code, bold=True)
    set_cell(ws, r, 2, lever, wrap=True)
    set_cell(ws, r, 3, group, wrap=True)
    set_cell(ws, r, 4, f'=VLOOKUP($A{r},{SCR_RANGE},8,FALSE)', bold=True).alignment = Alignment(horizontal="center", vertical="center")
    set_cell(ws, r, 5, MODEL_KG[i], fmt="0.0")
    set_cell(ws, r, 6, "", kind="input", fmt="0.0", comment="Leave blank to use the model. Fill to override kg avoided for this lever.")
    set_cell(ws, r, 7, f'=IF(F{r}="",E{r},F{r})', fmt="0.0", bold=True)
    set_cell(ws, r, 8, COST_DEFAULT[i], kind="input", fmt=EUR0, comment="Δcost € per 1,000 units, incl. EBIT effect. Negative = net saving.")
    set_cell(ws, r, 9, f'=IF(G{r}=0,"",H{r}/G{r})', fmt=EIN_KG)
    set_cell(ws, r, 10, f'=IF(I{r}="","",I{r}/fx_usd_eur)', fmt=USD_KG)
    set_cell(ws, r, 11, f'=G{r}*co2e_factor', fmt="0.0")
    set_cell(ws, r, 12, f'=IF(cohort_vm=0,"",G{r}/cohort_vm)', fmt=PCT0)
    set_cell(ws, r, 13, BASIS[i], kind="note", wrap=True)
    set_cell(ws, r, 14, CONF[i], kind="input").alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[r].height = 22
Q_TOT = Q_FIRST + len(LEVERS) + 1
set_cell(ws, Q_TOT, 1, "Σ", kind="total", bold=True)
ws.merge_cells(start_row=Q_TOT, start_column=2, end_row=Q_TOT, end_column=6)
set_cell(ws, Q_TOT, 2, "Included totals (upper bound — non-additive, see framework §8.1)", kind="total", bold=True, wrap=True)
set_cell(ws, Q_TOT, 7, f'=SUMPRODUCT(($D$5:$D$24="In")*$G$5:$G$24)', kind="total", fmt=KG0, bold=True)
set_cell(ws, Q_TOT, 8, f'=SUMPRODUCT(($D$5:$D$24="In")*$H$5:$H$24)', kind="total", fmt=EUR0, bold=True)
set_cell(ws, Q_TOT, 9, "", kind="total"); set_cell(ws, Q_TOT, 10, "", kind="total")
set_cell(ws, Q_TOT, 11, f'=SUMPRODUCT(($D$5:$D$24="In")*$K$5:$K$24)', kind="total", fmt=KG0, bold=True)
set_cell(ws, Q_TOT, 12, "", kind="total"); set_cell(ws, Q_TOT, 13, "", kind="total"); set_cell(ws, Q_TOT, 14, "", kind="total")
ws.freeze_panes = "A5"
from openpyxl.formatting.rule import FormulaRule
ws.conditional_formatting.add("A5:N24", FormulaRule(formula=['$D5="Out"'], fill=PatternFill("solid", fgColor=OUTROW)))
cfv = DataValidation(type="list", formula1='"High,Medium,Low"', allow_blank=True, showDropDown=False)
ws.add_data_validation(cfv)
cfv.add("N5:N24")

# ============================================================ 06 CCC Output
ws = wb.create_sheet(S_CCC)
page_setup(ws); freeze(ws, "A5")
title_block(ws, "06 — Circularity Cost Curve", "Sorted ascending by EUR per kg virgin avoided (Variant B default; Variant A in USD). Screened-out levers are omitted from charts and totals. Bar width = kg avoided per 1,000 units.", 16)
col_widths(ws, {"A": 5, "B": 8, "C": 26, "D": 17, "E": 15, "F": 15, "G": 17, "H": 15, "I": 14, "J": 12, "K": 12, "L": 12, "M": 3, "N": 10, "O": 18})
set_cell(ws, 3, 1, "Levers in:", bold=True); set_cell(ws, 3, 2, f"=COUNTIF('{S_QNT}'!$D$5:$D$24,\"In\")", bold=True, fmt="0").alignment = Alignment(horizontal="center")
set_cell(ws, 3, 3, "Σ kg avoided:", bold=True); set_cell(ws, 3, 4, "=SUM($E$5:$E$24)", fmt=KG0, bold=True)
set_cell(ws, 3, 5, "Σ Δcost:", bold=True); set_cell(ws, 3, 6, "=SUM($H$5:$H$24)", fmt=EUR0, bold=True)
set_cell(ws, 3, 7, "Σ CO₂e:", bold=True); set_cell(ws, 3, 8, "=SUM($I$5:$I$24)", fmt=KG0, bold=True)
header_row(ws, 4, 1, ["#", "Code", "Lever", "€ / kg", "kg avoided\n/ 1,000", "Cumulative\nkg", "$ / kg", "Δcost €\n/ 1,000", "kg CO₂e\navoided"])
CCC_FIRST = 5
for r in range(CCC_FIRST, CCC_FIRST + 20):
    k = r - CCC_FIRST + 1
    src = Q_FIRST + (r - CCC_FIRST)
    ws.cell(row=r, column=1, value=k).font = Font(bold=True, name="Calibri")
    ws.cell(row=r, column=1).alignment = Alignment(horizontal="center")
    set_cell(ws, r, 2, f'=IF($A{r}>$B$3,"",INDEX(\'{S_QNT}\'!$A$5:$A$24,MATCH($A{r},$N$5:$N$24,0)))', bold=True).alignment = Alignment(horizontal="center")
    set_cell(ws, r, 3, f'=IF($B{r}="","",INDEX(\'{S_QNT}\'!$B$5:$B$24,MATCH($A{r},$N$5:$N$24,0)))', wrap=True)
    set_cell(ws, r, 4, f'=IF($B{r}="","",INDEX(\'{S_QNT}\'!$I$5:$I$24,MATCH($A{r},$N$5:$N$24,0)))', fmt=EIN_KG)
    set_cell(ws, r, 5, f'=IF($B{r}="","",INDEX(\'{S_QNT}\'!$G$5:$G$24,MATCH($A{r},$N$5:$N$24,0)))', fmt="0.0")
    set_cell(ws, r, 6, f'=IF($B{r}="","",SUM($E$5:E{r}))', fmt="0.0")
    set_cell(ws, r, 7, f'=IF($B{r}="","",INDEX(\'{S_QNT}\'!$J$5:$J$24,MATCH($A{r},$N$5:$N$24,0)))', fmt=USD_KG)
    set_cell(ws, r, 8, f'=IF($B{r}="","",INDEX(\'{S_QNT}\'!$H$5:$H$24,MATCH($A{r},$N$5:$N$24,0)))', fmt=EUR0)
    set_cell(ws, r, 9, f'=IF($B{r}="","",INDEX(\'{S_QNT}\'!$K$5:$K$24,MATCH($A{r},$N$5:$N$24,0)))', fmt="0.0")
    set_cell(ws, r, 10, f'=IF($B{r}="",NA(),D{r})', fmt="0.00")   # chart series: EUR
    set_cell(ws, r, 11, f'=IF($B{r}="",NA(),F{r})', fmt="0.0")   # chart series: cumulative kg
    set_cell(ws, r, 12, f'=IF($B{r}="",NA(),G{r})', fmt="0.00")  # chart series: USD
    set_cell(ws, r, 14, f'=RANK(O{r},$O$5:$O$24,1)', fmt="0").alignment = Alignment(horizontal="center")
    set_cell(ws, r, 15, f"=IF('{S_QNT}'!$D{src}=\"In\",'{S_QNT}'!$I{src}+ROW()*0.000000001,1E+99)", fmt="0.000000")
    ws.row_dimensions[r].height = 18
CCC_TOT = CCC_FIRST + 20
set_cell(ws, CCC_TOT, 1, "Σ", kind="total", bold=True)
ws.merge_cells(start_row=CCC_TOT, start_column=2, end_row=CCC_TOT, end_column=4)
set_cell(ws, CCC_TOT, 2, "Included totals — upper bound (§8.1)", kind="total", bold=True, wrap=True)
set_cell(ws, CCC_TOT, 5, f'=SUM($E$5:$E$24)', kind="total", fmt=KG0, bold=True)
set_cell(ws, CCC_TOT, 6, "", kind="total")
set_cell(ws, CCC_TOT, 7, "", kind="total")
set_cell(ws, CCC_TOT, 8, f'=SUM($H$5:$H$24)', kind="total", fmt=EUR0, bold=True)
set_cell(ws, CCC_TOT, 9, f'=SUM($I$5:$I$24)', kind="total", fmt=KG0, bold=True)
defined_name(wb, "incl_count", f"'{S_CCC}'!$B$3")

# chart helper headers (visible, small)
set_cell(ws, 4, 10, "EUR/kg (B)", kind="note")
set_cell(ws, 4, 11, "Cum. kg", kind="note")
set_cell(ws, 4, 12, "USD/kg (A)", kind="note")

chart_b = BarChart()
chart_b.type = "col"
chart_b.style = 10
chart_b.title = "Variant B — cost per kg virgin avoided (EUR/kg, sorted)"
chart_b.y_axis.title = "EUR per kg virgin avoided"
chart_b.x_axis.title = "Lever (sorted ascending)"
chart_b.gapWidth = 60
data = Reference(ws, min_col=10, min_row=4, max_row=CCC_FIRST + 19)
cats = Reference(ws, min_col=2, min_row=CCC_FIRST, max_row=CCC_FIRST + 19)
chart_b.add_data(data, titles_from_data=True)
chart_b.set_categories(cats)
chart_b.series[0].graphicalProperties.solidFill = STEEL
chart_b.width = 16.5
chart_b.height = 8.5
chart_b.legend = None
ws.add_chart(chart_b, "M3")

chart_a = BarChart()
chart_a.type = "col"
chart_a.style = 10
chart_a.title = "Variant A — cost per kg virgin avoided (USD/kg, sorted)"
chart_a.y_axis.title = "USD per kg virgin avoided"
chart_a.x_axis.title = "Lever (sorted ascending)"
chart_a.gapWidth = 60
data = Reference(ws, min_col=12, min_row=4, max_row=CCC_FIRST + 19)
chart_a.add_data(data, titles_from_data=True)
chart_a.set_categories(cats)
chart_a.series[0].graphicalProperties.solidFill = NAVY
chart_a.width = 16.5
chart_a.height = 8.5
chart_a.legend = None
ws.add_chart(chart_a, "M22")

line = LineChart()
line.style = 12
line.title = "Variant B — cumulative kg virgin avoided (upper bound)"
line.y_axis.title = "kg virgin avoided (cumulative)"
line.x_axis.title = "Lever (sorted ascending)"
ldata = Reference(ws, min_col=11, min_row=4, max_row=CCC_FIRST + 19)
line.add_data(ldata, titles_from_data=True)
line.set_categories(cats)
line.series[0].graphicalProperties.line.solidFill = NAVY
line.series[0].graphicalProperties.line.width = 28000
line.series[0].smooth = False
line.width = 16.5
line.height = 8.5
line.legend = None
ws.add_chart(line, "M41")

# ============================================================ 07 Sensitivities
ws = wb.create_sheet(S_SEN)
page_setup(ws); freeze(ws, "A5")
title_block(ws, "07 — Sensitivities (low / base / high)", "One knob at a time, recomputed with live formulas against the base model. Lever €/kg held fixed in scenario Δ€; kg re-derived where formula-driven.", 10)
col_widths(ws, {"A": 46, "B": 11, "C": 11, "D": 11, "E": 15, "F": 15, "G": 15, "H": 15, "I": 15, "J": 15, "K": 60})
header_row(ws, 4, 1, ["Knob", "Low", "Base", "High", "kg (low)", "kg (base)", "kg (high)", "Δ€ (low)", "Δ€ (base)", "Δ€ (high)"])
sum_in = f"SUMPRODUCT(('{S_QNT}'!$D$5:$D$24=\"In\")*'{S_QNT}'!"
sen_rows = [
    (5, "Return rate — lever 1b", 0.15, 0.25, 0.40, PCT0,
     lambda c: f"={c}*closed_loop_yield*total_mass*cohort_size", "'05 Quantification'!$I$6"),
    (6, "Leasing utilization uplift — lever 6b", 1.05, 1.148, 1.30, "0.000",
     lambda c: f"=total_mass*({c}-1)/{c}*cohort_size", "'05 Quantification'!$I$18"),
    (7, "Life-extension multiplier — levers 7a+7c+7d (kg)", 0.75, 1.00, 1.25, "0.00",
     lambda c: f"=(life_ext_repair+life_ext_durability+life_ext_care)*{c}*total_mass*cohort_size", None),
    (8, "Recycled content uplift — lever 1a", 0.0035, 0.005, 0.0065, PCT2,
     lambda c: f"={c}*total_materials*cohort_size", "'05 Quantification'!$I$5"),
]
for r, lbl, lo, base, hi, fmt, kgf, costref in sen_rows:
    set_cell(ws, r, 1, lbl, wrap=True, bold=True)
    set_cell(ws, r, 2, lo, kind="input", fmt=fmt)
    set_cell(ws, r, 3, base, kind="input", fmt=fmt)
    set_cell(ws, r, 4, hi, kind="input", fmt=fmt)
    for col, c in ((5, "B"), (6, "C"), (7, "D")):
        set_cell(ws, r, col, kgf(f"{c}{r}"), fmt="0.0")
    if costref:
        for col, c in ((8, "E"), (9, "F"), (10, "G")):
            set_cell(ws, r, col, f"={c}{r}*{costref}", fmt=EUR0)
    else:  # life-extension pack: scale the actual positive-lever costs
        for col, c in ((8, "B"), (9, "C"), (10, "D")):
            set_cell(ws, r, col, f"={c}{r}*('{S_QNT}'!$H$20+'{S_QNT}'!$H$22+'{S_QNT}'!$H$23)", fmt=EUR0)
    ws.row_dimensions[r].height = 24
# row 9 — CO₂e factor
r = 9
set_cell(ws, r, 1, "CO₂e factor — scales all included kg CO₂e", wrap=True, bold=True)
set_cell(ws, r, 2, 1.5, kind="input", fmt="0.0"); set_cell(ws, r, 3, 2.2, kind="input", fmt="0.0"); set_cell(ws, r, 4, 3.0, kind="input", fmt="0.0")
for col, c in ((5, "B"), (6, "C"), (7, "D")):
    set_cell(ws, r, col, f'={c}{r}*SUMPRODUCT((\'{S_QNT}\'!$D$5:$D$24="In")*\'{S_QNT}\'!$G$5:$G$24)', fmt="0.0")
for col in (8, 9, 10):
    set_cell(ws, r, col, "n/a", kind="note").alignment = Alignment(horizontal="center")
ws.row_dimensions[r].height = 24
# row 10 — labour multiplier on positive-cost levers
r = 10
set_cell(ws, r, 1, "Labour / service cost multiplier — 7a+7c+7d Δcost", wrap=True, bold=True)
set_cell(ws, r, 2, 0.75, kind="input", fmt="0.00"); set_cell(ws, r, 3, 1.00, kind="input", fmt="0.00"); set_cell(ws, r, 4, 1.25, kind="input", fmt="0.00")
base_kg = f"=(life_ext_repair+life_ext_durability+life_ext_care)*total_mass*cohort_size"
for col in (5, 6, 7):
    set_cell(ws, r, col, base_kg, fmt="0.0")
for col, c in ((8, "B"), (9, "C"), (10, "D")):
    set_cell(ws, r, col, f"={c}{r}*('{S_QNT}'!$H$20+'{S_QNT}'!$H$22+'{S_QNT}'!$H$23)", fmt=EUR0)
ws.row_dimensions[r].height = 24
section(ws, 12, 1, 10, "How to read this")
takeaways = [
    "The answer is most sensitive to two knobs: 6b leasing uplift and 1b return rate. If either moves ±25%, the business case for Group III shifts materially — revisit before committing.",
    "CO₂e totals scale 1:1 with the emission factor; ±30% on the factor moves Σ CO₂e by the same ±30% — always state the factor you used.",
    "Positive-cost levers (7a/7c/7d) are labour-cost exposed; ±25% on service wages changes their Tier classification only at the margin (they stay Tier 2).",
    "This sheet is a sensitivity readout, not a Monte Carlo. For decision-grade distributions, run a scenario sweep in the Phase 3 Python model.",
]
r = 13
for t in takeaways:
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=10)
    set_cell(ws, r, 1, "• " + t, kind="note", wrap=True)
    ws.row_dimensions[r].height = 28
    r += 1

# ============================================================ 08 Decision Summary
ws = wb.create_sheet(S_DEC)
page_setup(ws); freeze(ws, "A5")
title_block(ws, "08 — Decision summary (auto-tiered)", "Levers in CCC order (ascending cost). Tier rules: cost < 0 → Tier 1 No-regret; ≥ 0 with kg ≥ 10 → Tier 2 Strategic; else Tier 3 Monitor.", 6)
col_widths(ws, {"A": 8, "B": 30, "C": 17, "D": 15, "E": 34, "F": 50})
header_row(ws, 4, 1, ["Code", "Lever", "€ / kg", "kg / 1,000", "Tier", "How to act"])
HOW = {
    "Tier 1": "Implement now — self-funding; report captured saving next quarter",
    "Tier 2": "Invest to improve — justify with lifetime EBIT + §5.7 overlay; bundle into refresh launch",
    "Tier 3": "Pilot or monitor — revisit at next cost review; track recyclate/labour price moves",
}
CCC = f"'{S_CCC}'"
for i in range(20):
    r = 5 + i
    src = 5 + i
    set_cell(ws, r, 1, f'=IF({CCC}!$B{src}="","",{CCC}!$B{src})', bold=True).alignment = Alignment(horizontal="center")
    set_cell(ws, r, 2, f'=IF($A{r}="","",{CCC}!$C{src})', wrap=True)
    set_cell(ws, r, 3, f'=IF($A{r}="","",{CCC}!$D{src})', fmt=EIN_KG)
    set_cell(ws, r, 4, f'=IF($A{r}="","",{CCC}!$E{src})', fmt="0.0")
    set_cell(ws, r, 5, f'=IF($A{r}="","",IF({CCC}!$D{src}<0,"Tier 1 — No-regret",IF({CCC}!$E{src}>=10,"Tier 2 — Strategic","Tier 3 — Monitor")))', wrap=True)
    set_cell(ws, r, 6, f'=IF($A{r}="","",IF({CCC}!$D{src}<0,"{HOW["Tier 1"]}",IF({CCC}!$E{src}>=10,"{HOW["Tier 2"]}","{HOW["Tier 3"]}")))', wrap=True, kind="note")
    ws.row_dimensions[r].height = 22
from openpyxl.formatting.rule import FormulaRule as _FR, CellIsRule as _CIR
rng = "E5:E24"
ws.conditional_formatting.add(rng, _FR(formula=['LEFT($E5,6)="Tier 1"'], fill=PatternFill("solid", fgColor=GREEN)))
ws.conditional_formatting.add(rng, _FR(formula=['LEFT($E5,6)="Tier 2"'], fill=PatternFill("solid", fgColor=INPUT)))
ws.conditional_formatting.add(rng, _FR(formula=['LEFT($E5,6)="Tier 3"'], fill=PatternFill("solid", fgColor=OUTROW)))
r = 26
section(ws, r, 1, 6, "Totals & mix (included levers; upper bound)")
QNT = f"'{S_QNT}'"
tin = f'SUMPRODUCT(({QNT}!$D$5:$D$24="In")*'
tot_rows = [
    (27, "Σ Δcost — all included levers (€/yr)", f"={tin}{QNT}!$H$5:$H$24)", EUR0),
    (28, "   of which Tier 1 savings (negative Δcost)", f"=SUMPRODUCT(({QNT}!$D$5:$D$24=\"In\")*({QNT}!$H$5:$H$24<0)*{QNT}!$H$5:$H$24)", EUR0),
    (29, "   of which Tier 2 / 3 costs", f"=SUMPRODUCT(({QNT}!$D$5:$D$24=\"In\")*({QNT}!$H$5:$H$24>=0)*{QNT}!$H$5:$H$24)", EUR0),
    (30, "Σ kg virgin avoided (upper bound)", f"={tin}{QNT}!$G$5:$G$24)", KG0),
    (31, "Σ kg CO₂e avoided", f"={tin}{QNT}!$K$5:$K$24)", KG0),
    (32, "Tier 1 count", f'=COUNTIF($E$5:$E$24,"Tier 1*")', "0"),
    (33, "Tier 2 count", f'=COUNTIF($E$5:$E$24,"Tier 2*")', "0"),
    (34, "Tier 3 count", f'=COUNTIF($E$5:$E$24,"Tier 3*")', "0"),
]
for rr, lbl, formula, fmt in tot_rows:
    ws.merge_cells(start_row=rr, start_column=1, end_row=rr, end_column=4)
    set_cell(ws, rr, 1, lbl, wrap=True, bold=True)
    set_cell(ws, rr, 5, formula, fmt=fmt, bold=True, kind="total")
    ws.merge_cells(start_row=rr, start_column=5, end_row=rr, end_column=6)
    ws.row_dimensions[rr].height = 20
ws.merge_cells(start_row=36, start_column=1, end_row=37, end_column=6)
set_cell(ws, 36, 1, "Caveat: levers overlap (durability reduces returns; leasing reshapes 8a). Σ totals are an upper bound, not a plan. For portfolio decisions, build mutually exclusive packages (e.g., 'Leasing programme' = 6b + 7b + 7d + 1b) and quantify at package level — see framework §8.1.", kind="note", wrap=True)
ws.row_dimensions[36].height = 30

# ============================================================ 09 Answer Key & Checks
ws = wb.create_sheet(S_CHK)
page_setup(ws); freeze(ws, "A5")
title_block(ws, "09 — Worked example: answer key & checks", "The framework documentation (§5, cordless drill, illustrative) reproduced as live references. Every row must read PASS. If someone edits inputs on 02/04/05, checks reveal it.", 6)
col_widths(ws, {"A": 46, "B": 20, "C": 18, "D": 12, "E": 12, "F": 58})
header_row(ws, 4, 1, ["Check", "Doc (§5, illustrative)", "Live (workbook)", "Tolerance", "Status", "Note"])
FAC = f"'{S_FAC}'"
CCC6 = f"'{S_CCC}'"
checks = [
    (5, "Product mass P (kg)", 1.400, f"={FAC}!$B$5", 0.002, KG1, ""),
    (6, "Scrap (kg)", 0.112, f"={FAC}!$B$6", 0.002, KG1, ""),
    (7, "Total materials TM (kg)", 1.512, f"={FAC}!$B$7", 0.002, KG1, ""),
    (8, "Virgin material VM (kg)", 1.361, f"={FAC}!$B$10", 0.01, KG1, ""),
    (9, "Factor 1 — VM/TM", 0.900, f"={FAC}!$B$12", 0.005, R3, ""),
    (10, "Factor 2 — TM/P", 1.080, f"={FAC}!$B$13", 0.005, R3, ""),
    (11, "Factor 3 — P/US", 0.175, f"={FAC}!$B$14", 0.005, R3, "P per drill-year (1.4 / 8)"),
    (12, "VM / US (kg per unit-year)", 0.170, f"={FAC}!$B$15", 0.002, "0.0000", ""),
    (13, "VM / US × cohort (kg)", 170.1, f"={FAC}!$B$16", 2.0, KG1, ""),
    (14, "EBIT per unit (€)", 25, f"={FAC}!$B$17", 0.5, EUR0, ""),
    (15, "Identity residual → 0", 0.0, f"={FAC}!$B$19", 1e-6, "0.00E+00", "Telescoping: VM/US = (VM/TM)×(TM/P)×(P/US)"),
    (16, "Σ kg virgin avoided — included", 525, f"={CCC6}!$E$25", 1.5, KG0, "MD prints 525 (model: ≈525)"),
    (17, "Σ Δcost — included (€)", -4468, f"={CCC6}!$H$25", 12, EUR0, "MD prints −4,468"),
    (18, "Σ kg CO₂e — included", 1156, f"={CCC6}!$I$25", 8, KG0, "kg × 2.2 factor"),
]
for r, lbl, doc, live, tol, fmt, note in checks:
    set_cell(ws, r, 1, lbl, wrap=True, bold=True)
    set_cell(ws, r, 2, doc, fmt=fmt, kind="note")
    set_cell(ws, r, 3, live, fmt=fmt)
    set_cell(ws, r, 4, tol, fmt="0.000" if tol < 1 else "0.0", kind="note")
    set_cell(ws, r, 5, f'=IF(ABS(C{r}-B{r})<D{r},"PASS","FAIL")', bold=True).alignment = Alignment(horizontal="center", vertical="center")
    set_cell(ws, r, 6, note, kind="note", wrap=True)
    ws.row_dimensions[r].height = 20
# sorted-ascending pair check (hardcoded pairs for the 14-lever drill example)
r = 19
set_cell(ws, r, 1, "Display order sorted ascending (€/kg)", wrap=True, bold=True)
set_cell(ws, r, 2, "Yes", kind="note", fmt=None)
pair_terms = ",".join(f'{CCC6}!$D{a}<={CCC6}!$D{a+1}' for a in range(5, 19))
set_cell(ws, r, 3, f'=IF(AND({pair_terms}),"sorted","unsorted")', fmt=None)
set_cell(ws, r, 4, "n/a", kind="note").alignment = Alignment(horizontal="center")
set_cell(ws, r, 5, f'=IF(C{r}="sorted","PASS","FAIL")', bold=True).alignment = Alignment(horizontal="center", vertical="center")
set_cell(ws, r, 6, "Blank cells compare equal — holds with excluded levers trailing. Hardcoded to the drill example's 14 included levers.", kind="note", wrap=True)
CHK_LAST = 19
ws.merge_cells(start_row=21, start_column=1, end_row=21, end_column=4)
set_cell(ws, 21, 1, "OVERALL", kind="total", bold=True)
set_cell(ws, 21, 5, f'=IF(COUNTIF($E$5:$E${CHK_LAST},"FAIL")=0,"ALL PASS","FAIL PRESENT")', kind="total", bold=True).alignment = Alignment(horizontal="center")
ws.merge_cells(start_row=21, start_column=5, end_row=21, end_column=6)
from openpyxl.formatting.rule import CellIsRule as _CIR2
for rng in (f"E5:E{CHK_LAST}", "E21"):
    ws.conditional_formatting.add(rng, _CIR2(operator="equal", formula=['"PASS"'], fill=PatternFill("solid", fgColor=GREEN)))
    ws.conditional_formatting.add(rng, _CIR2(operator="equal", formula=['"ALL PASS"'], fill=PatternFill("solid", fgColor=GREEN)))
    ws.conditional_formatting.add(rng, _CIR2(operator="equal", formula=['"FAIL"'], fill=PatternFill("solid", fgColor=RED)))
    ws.conditional_formatting.add(rng, _CIR2(operator="equal", formula=['"FAIL PRESENT"'], fill=PatternFill("solid", fgColor=RED)))
ws.freeze_panes = "A5"

# ============================================================ 10 Template (blank)
ws = wb.create_sheet(S_TPL)
page_setup(ws); freeze(ws, "A5")
title_block(ws, "10 — Blank input map (start your own product)", "Printable / fillable map of every input the workbook consumes. Zero formulas — copy values into 02–06 after Save-As. Keep the drill example workbook for reference.", 5)
col_widths(ws, {"A": 26, "B": 44, "C": 30, "D": 30, "E": 40})
section(ws, 4, 1, 5, "How to adapt (in order)")
adapters = [
    "1. File → Save As: '<YourProduct>-circularity.xlsx'. Never edit the drill original.",
    "2. Fill section A–B of 02 (product, US statement, economics).",
    "3. Fill the BOM grid (rows 22–28): component, family, mass, virgin share (blank = default from 02!B13).",
    "4. Check 03 — identity residual must read PASS; factors make sense (Factor 1 < 1, Factor 2 > 1).",
    "5. On 04, answer Y/N for every lever; every N needs a reason (audit trail).",
    "6. On 05, override kg only with evidence; record basis note + confidence for any override; Δcost € is analyst input — always fill.",
    "7. Read 06–08; screenshot the Variant B chart; escalate Tier 1 for sign-off, Tier 2 for options study.",
    "8. Before sharing externally: all 09 checks PASS; assumptions register re-stated in your own doc; illustrative values replaced with measured data.",
]
r = 5
for t in adapters:
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=5)
    set_cell(ws, r, 1, t, kind="note", wrap=True)
    ws.row_dimensions[r].height = 22
    r += 1
r += 1
section(ws, r, 1, 5, "Blank input map — target cell | field | example | your value")
header_row(ws, r + 1, 1, ["Target cell", "Field", "Unit / example", "Your value", ""])
row_i = r + 2
plan = [
    ("'02 Inputs'!B5", "Product name", "e.g., 'Cordless drill'"),
    ("'02 Inputs'!B6", "Useful service (US) statement", "one <product> over <life>, ≈ <hours>"),
    ("'02 Inputs'!B7", "Service life", "years"),
    ("'02 Inputs'!B8", "Utilization", "hours/year"),
    ("'02 Inputs'!B9", "Cohort size", "units/year (1,000 typical)"),
    ("'02 Inputs'!B10", "Base year", "e.g., 2026"),
    ("'02 Inputs'!B11", "FX: EUR per 1 USD", "0.92 illustrative"),
    ("'02 Inputs'!B12", "CO₂e factor", "kg CO₂e per kg virgin avoided (2.2 default)"),
    ("'02 Inputs'!B13", "Virgin share of material input", "fraction of TM (0.90)"),
    ("'02 Inputs'!B14", "Production scrap rate", "fraction of P (0.08)"),
    ("'02 Inputs'!B16", "Selling price ex-factory", "€/unit"),
    ("'02 Inputs'!B17", "Variable cost (COGS)", "€/unit"),
    ("'02 Inputs'!B18", "Allocated overhead", "€/unit"),
    ("'02 Inputs'!C22:C28", "BOM masses", "kg per component"),
    ("'02 Inputs'!D22:D28", "BOM virgin shares", "blank = default; e.g., housing 50% PCR → 0.50"),
] + [(f"'04 Lever Screen'!E{x}:G{x}", f"Gates — {lev[0]} {lev[1]}", "Y/N × 3 (any N → out)") for x, lev in zip(range(5, 25), LEVERS)] \
  + [(f"'05 Quantification'!H{x}", f"Δcost €/1,000 — {lev[0]} {lev[1]}", "negative = saving") for x, lev in zip(range(5, 25), LEVERS)] \
  + [(f"'05 Quantification'!F{x}", f"kg override — {lev[0]} (optional)", "blank = use model") for x, lev in zip(range(5, 25), LEVERS)] \
  + [(f"'05 Quantification'!Q{x}", f"Parameter {p[0]}", p[4]) for x, p in zip(range(5, 21), params)]
for target, field, example in plan:
    set_cell(ws, row_i, 1, target, kind="note", bold=True)
    set_cell(ws, row_i, 2, field, wrap=True)
    set_cell(ws, row_i, 3, example, kind="note", wrap=True)
    set_cell(ws, row_i, 4, "", kind="input")
    row_i += 1
    ws.row_dimensions[row_i - 1].height = 18
r = row_i + 1
section(ws, r, 1, 5, "Acceptance before external sharing")
accept = [
    "Sheet 03 identity residual < 1e-7 and shows PASS.",
    "Sheet 09: every check PASS (with your data, tolerances re-set).",
    "Every lever marked 'Out' has a recorded reason; screened-out count reviewed by a second person.",
    "Δcost basis notes filled for all included levers; no grey/empty notes.",
    "Σ totals carry the 'upper bound — non-additive' caveat in any external material.",
    "Currency, FX and base year stated; CO₂e factor sourced; illustrative labels removed.",
]
r += 1
for t in accept:
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=5)
    set_cell(ws, r, 1, "☐ " + t, kind="note", wrap=True)
    ws.row_dimensions[r].height = 20
    r += 1

# ============================================================ save + self-check
OUT.parent.mkdir(parents=True, exist_ok=True)
wb.save(OUT)
print(f"Saved: {OUT}")

# ---------- mirror math cross-check (Python-side recomputation)
p = 1.40
scrap = 0.08 * p
tm = p + scrap
vm_prod = sum(m * vs for _, _, m, vs in [(c, f, m, v) for c, f, m, v in bom])
vm = vm_prod + 0.9 * scrap
ratio1, ratio2, ratio3 = vm / tm, tm / p, 1 / 8
vm_us, cohort_kg = vm / 8, vm / 8 * 1000
print(f"P={p:.3f} scrap={scrap:.4f} TM={tm:.4f} VM={vm:.4f} r1={ratio1:.3f} r2={ratio2:.3f} VM/US={vm_us:.4f} cohort={cohort_kg:.1f}")
OUT_LEVERS = {"2b", "3a", "3b", "5b", "5c", "6a"}
E = [0.005 * tm * 1000, 0.25 * 0.026 * p * 1000, 0.75 * (0.005 * tm * 1000 + 0.25 * 0.026 * p * 1000),
     30 * 0.14 * p, 0, 0, 0, 0.0145 * tm * 1000, 0.25 * scrap * 1000, 0.027 * p * 1000, 0, 0, 0,
     p * (1.148 - 1) / 1.148 * 1000, 0.0114 * p * 1000, 0.017 * p * 1000, 0.039 * p * 1000,
     0.013 * p * 1000, 0.010 * p * 1000, 68 * p]
codes = [l[0] for l in LEVERS]
kg_sum = sum(k for c, k in zip(codes, E) if c not in OUT_LEVERS)
cost_sum = sum(cost for c, cost in zip(codes, COST_DEFAULT) if c not in OUT_LEVERS)
co2_sum = kg_sum * 2.2
print(f"included levers={sum(1 for c in codes if c not in OUT_LEVERS)}")
print(f"kg_sum={kg_sum:.1f}   dCost_sum={cost_sum:,.0f} EUR   CO2e_sum={co2_sum:,.0f}")
for lbl, got, exp, tol in [("kg_sum", kg_sum, 525, 1.5), ("dCost_sum", cost_sum, -4468, 12), ("CO2e_sum", co2_sum, 1156, 8),
                            ("r1", ratio1, 0.900, 0.005), ("VM/US", vm_us, 0.1701, 0.002)]:
    status = "PASS" if abs(got - exp) < tol else "FAIL"
    print(f"{status}  {lbl}: model={got:.3f}  doc={exp}")
print("named ranges defined:", len(wb.defined_names))
