import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Method & caveats" };

const FACTORS = [
  {
    factor: "Factor 1",
    ratio: "VM / TM",
    drill: "0.90",
    name: "Materials recirculation",
    moves: "Group I · Recycling (1a–1c) · Remanufacturing (2a–2b) · Recirculation design (3a–3b)",
    means: "virgin share of total material input",
  },
  {
    factor: "Factor 2",
    ratio: "TM / P",
    drill: "1.08",
    name: "Materials efficiency",
    moves: "Group II · Waste (4a–4b) · Design & specs (5a–5c)",
    means: "total materials processed per product shipped",
  },
  {
    factor: "Factor 3",
    ratio: "P / US",
    drill: "0.175",
    name: "Circular business models",
    moves: "Group III · Utilization (6a–6c) · Lifetime (7a–7d) · Over-production (8a)",
    means: "product mass per unit-year of service",
  },
];

const PIPELINE = [
  ["01", "Product profile"], ["02", "Define US"], ["03", "Compute factors"],
  ["04", "Screen 20 levers"], ["05", "Quantify"], ["06", "Plot the curve"], ["07", "Tier & decide"],
];

export default function MethodPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="kicker">Method &amp; caveats</p>
      <h1 className="h-display mt-2 text-4xl font-semibold">How the framework thinks</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-steel2">
        One decomposition, one curve, three tiers. The full written method lives in
        <a
          href="https://github.com/lugasraka/circularity-studio/blob/main/docs/circularity-decision-framework.md"
          target="_blank"
          rel="noreferrer"
          className="mx-1 text-steel2 underline underline-offset-2 hover:text-ink"
        >
          docs/circularity-decision-framework.md
        </a>
        — read it when someone challenges a number.
      </p>

      {/* ============ the identity ============ */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">The one identity</h2>
        <div className="mt-4 grid items-stretch gap-3 md:grid-cols-[minmax(0,5fr)_auto_minmax(0,7fr)]">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-ink px-6 py-8 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber">Headline metric</p>
            <p className="kpi mt-3 font-display text-4xl font-semibold text-paper">VM / US</p>
            <p className="mt-2 text-[12px] leading-snug text-paper/65">virgin materials per unit<br />of useful service</p>
            <p className="kpi mt-4 rounded-lg bg-steel px-3 py-1.5 text-[11px] font-semibold text-amber">drill example: 0.170 kg per drill-year</p>
          </div>

          <div className="flex items-center justify-center" aria-hidden>
            <svg width="56" height="40" viewBox="0 0 56 40" fill="none" className="rotate-90 md:rotate-0">
              <path d="M4 20h44m0 0l-8-8m8 8l-8 8" stroke="#1f3252" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            {FACTORS.map((f) => (
              <div key={f.factor} className="flex items-center gap-3 rounded-2xl border border-mist bg-white p-3 shadow-sm">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-steel text-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-paper/70">{f.factor}</span>
                  <span className="kpi mt-0.5 text-[11px] font-bold text-amber">{f.ratio}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-tight">{f.name}<span className="kpi ml-2 text-[11px] text-steel4">{f.drill}</span></p>
                  <p className="mt-0.5 text-[11px] leading-snug text-steel2">{f.means}</p>
                  <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-steel4">{f.moves}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-steel2">
          The factors multiply. 20% off each leaves −48.8%. Splitting the headline into three
          multiplicative parts is what keeps the analysis honest: no lever can hide inside a
          single number.
        </p>
      </section>

      {/* ============ the run ============ */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">One afternoon per product</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {PIPELINE.map(([n, t], i) => (
            <span key={n} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-mist bg-white py-1.5 pl-1.5 pr-3 text-[12px] font-semibold shadow-sm">
                <span className="kpi flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-amber">{n}</span>
                {t}
              </span>
              {i < PIPELINE.length - 1 && <ArrowRight size={13} className="text-steel4" aria-hidden />}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[12.5px] text-steel2">Steps 1–3 take half a day with the BOM in hand. Steps 4–6 are the real work. Step 7 is where the value lands.</p>
      </section>

      {/* ============ Variant A vs B ============ */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">Two ways to read the same curve</h2>
        <div className="card mt-4 overflow-x-auto">
          <table className="table-plain w-full min-w-[560px]">
            <thead><tr><th></th><th>Variant A — faithful</th><th>Variant B — board-ready</th></tr></thead>
            <tbody>
              <tr><td>Currency</td><td>USD / kg</td><td>EUR / kg (2026)</td></tr>
              <tr><td>Normalization</td><td>per functional unit</td><td>per 1,000-unit cohort</td></tr>
              <tr><td>Chart</td><td>bars sorted ascending, width = kg</td><td>bar width ∝ kg on cumulative-kg axis; labeled axes</td></tr>
              <tr><td>CO₂e</td><td>not shown</td><td>column per lever (default 2.2 kg CO₂e/kg)</td></tr>
              <tr><td>Best for</td><td>internal screens, fast read-outs</td><td>boards, diligence, external sharing</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[12.5px] text-steel2">Default to B. Use A only as an early workshop screen.</p>
      </section>

      {/* ============ tiers ============ */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">Reading the tiers</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {[
            ["Tier 1 — No-regret", "Cost < 0", "Implement now. These self-fund.", "chip-save"],
            ["Tier 2 — Strategic", "Cost ≥ 0, bar ≥ 10 kg", "Invest deliberately; justify with lifetime EBIT.", "chip-amber"],
            ["Tier 3 — Monitor", "Cost ≥ 0, bar < 10 kg", "Pilot cheaply; revisit at next price review.", "chip-slate"],
          ].map(([t, cond, how, chip]) => (
            <div key={t as string} className="card p-4">
              <p className="font-semibold">{t}</p>
              <p className="kpi mt-1 text-[11px] font-bold uppercase tracking-widest text-steel3">{cond}</p>
              <p className="mt-2 text-[12.5px] leading-snug text-steel2">{how}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[12.5px] text-steel2">Order: Tier 1 first (they pay you back), Tier 2 second, monitoring always.</p>
      </section>

      {/* ============ hard limits ============ */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">What the method won&apos;t claim</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-steel2">
          <li><strong>Σ is an upper bound.</strong> Levers overlap; never sum them naively. Build packages instead.</li>
          <li><strong>No revenue upside.</strong> Green premium and market-share growth are excluded from the base curve on purpose.</li>
          <li><strong>No false precision.</strong> Every Δcost carries a basis and a confidence flag. Check the sheet-07 sensitivity before a board sees it.</li>
          <li><strong>No silent omissions.</strong> Screened-out levers keep recorded reasons.</li>
          <li><strong>Not a certification.</strong> Public claims and filings need a full LCA or product carbon footprint (ISO 14040/44, ISO 14067) alongside.</li>
        </ul>
        <Link href="/decision" className="btn btn-ink mt-6">Go to the decision page <ArrowRight size={15} /></Link>
      </section>
    </div>
  );
}
