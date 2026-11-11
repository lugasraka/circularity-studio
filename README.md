# Circularity Studio

A reusable decision framework for circularity levers on products — and a web app that applies it end to end.

The method decomposes any product into virgin material per unit of service: `VM/US = (VM/TM) × (TM/P) × (P/US)`. Each factor maps to one family of levers (20 sub-levers across recirculation, materials efficiency, and circular business models). The app quantifies each applicable lever and plots a Circularity Cost Curve: cost per kg of virgin material avoided, width = kg avoided, sorted ascending. Everything computes live in the browser.

All quantitative values in this repo are illustrative, based on a cordless-drill worked example. Replace them with your own data before making decisions.

## What's here

- `docs/circularity-decision-framework.md` — the written method (identity, 20-lever taxonomy, CCC variants, worked example)
- `web/` — Circularity Studio, a Next.js web app (static export, no backend)
- `templates/circularity-cost-curve-template.xlsx` — the same method as a spreadsheet template
- `tools/` — Python generators for the fixture and the spreadsheet
- `fixtures/drill.json` — the worked example as a golden fixture (parity tests)

## Quick start

```sh
cd web
npm install
npm run dev    # http://localhost:3000
npm test       # parity tests against fixtures/drill.json
npm run build  # static export to web/out/
```

## Regenerating artifacts

```sh
python tools/export_drill_fixture.py   # fixtures/drill.json + web/lib/fixtures/drill.json
python tools/build_ccc_template.py     # templates/circularity-cost-curve-template.xlsx
```
