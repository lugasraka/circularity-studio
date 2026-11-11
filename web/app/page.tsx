import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CircleDot, Sigma, Layers3, Route } from "lucide-react";

export const metadata = {
  title: "Circularity Studio — the business case for circularity",
};

export default function HomePage() {
  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="relative overflow-hidden bg-ink text-[#f7f5f0]">
        <Image
          src="/brand/hero-loop.webp"
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-right"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(101deg, rgba(14,31,56,0.96) 0%, rgba(14,31,56,0.88) 34%, rgba(14,31,56,0.38) 68%, rgba(14,31,56,0.12) 100%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex min-h-[78vh] flex-col justify-center py-16">
            <p className="kicker !text-amber">Circularity Studio</p>
            <h1 className="h-display mt-4 max-w-3xl text-5xl font-semibold leading-[1.02] text-[#f7f5f0] sm:text-6xl">
              The business case
              <br />
              for circularity.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-snug text-white/85">
              One identity decomposes any product into virgin material per unit of service.
              Twenty levers move it. One cost curve ranks them. Know which circularity
              investments pay for themselves — and which are strategic bets.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/profile" className="btn btn-primary">
                Analyze your product <ArrowRight size={16} strokeWidth={2.4} />
              </Link>
              <Link href="/curve" className="btn border border-white/25 text-white hover:bg-white/10">
                See the worked example
              </Link>
            </div>
            <p className="mt-8 max-w-md text-[11px] leading-relaxed text-white/55">
              Preloaded with the cordless-drill worked example (illustrative values). Change
              the numbers on any page — everything recomputes live.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- worked-example stats ---------- */}
      <section className="border-b border-mist bg-steel text-paper">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden px-4 sm:px-6 md:grid-cols-4">
          {[
            ["525 kg", "virgin material redirected per 1,000 units (upper bound)"],
            ["38.5%", "of cohort virgin addressable across the 14 levers that apply"],
            ["−€4,469", "net saving per cohort per year, before revenue upside"],
            ["0.170 kg", "virgin per drill-year — the metric the whole model drives"],
          ].map(([v, d]) => (
            <div key={v as string} className="px-2 py-6 sm:px-6">
              <p className="kpi font-display text-2xl font-semibold text-amber">{v}</p>
              <p className="mt-1 text-[11.5px] leading-snug text-paper/65">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- the identity ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <p className="kicker">The method in one line</p>
        <div className="mt-4 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="h-display text-3xl font-semibold sm:text-4xl">
              VM/US = (VM/TM) × (TM/P) × (P/US)
            </h2>
            <p className="mt-4 leading-relaxed text-steel2">
              Virgin materials per unit of useful service decomposes into three factors.
              They multiply: 20% off each leaves −48.8% overall. Each factor maps to one
              family of levers.
            </p>
            <Link href="/method" className="btn btn-ghost mt-6">
              Read the method <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-7">
            {[
              {
                icon: <CircleDot size={18} />,
                factor: "Factor 1",
                name: "Materials recirculation",
                ratio: "VM / TM",
                drill: "0.90",
                blurb: "How much of what you buy is virgin. Moved by recyclate, closed loop, remanufacture, take-back.",
                levers: "Levers 1a–3b",
              },
              {
                icon: <Sigma size={18} />,
                factor: "Factor 2",
                name: "Materials efficiency",
                ratio: "TM / P",
                drill: "1.08",
                blurb: "How much scrap and over-spec sits between input and product. Moved by waste, valorization, redesign.",
                levers: "Levers 4a–5c",
              },
              {
                icon: <Route size={18} />,
                factor: "Factor 3",
                name: "Circular business models",
                ratio: "P / US",
                drill: "0.175",
                blurb: "How much product you need per year of service. Moved by leasing, reuse, lifetime, over-production.",
                levers: "Levers 6a–8a",
              },
            ].map((f) => (
              <div key={f.name} className="card flex flex-col p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-steel text-amber">
                    {f.icon}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-steel3">{f.factor}</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold leading-snug">{f.name}</h3>
                <p className="kpi mt-2 text-sm font-semibold text-steel2">{f.ratio}</p>
                <p className="kpi mt-0.5 text-3xl font-semibold text-ink">{f.drill}<span className="ml-1 text-xs font-normal text-steel4">drill example</span></p>
                <p className="mt-3 flex-1 text-[12.5px] leading-relaxed text-steel2">{f.blurb}</p>
                <p className="mt-4 border-t border-mist pt-3 text-[10.5px] font-semibold uppercase tracking-widest text-steel4">{f.levers}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="border-t border-mist bg-[#efece5]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="kicker">Six steps, one afternoon</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {[
              ["1", "Define the service", "US = one drill over its 8-year life — never “one drill”."],
              ["2", "BOM & masses", "Component masses + virgin shares → the three factors, live."],
              ["3", "Screen 20 levers", "Three gate questions each; excluded levers keep a recorded reason."],
              ["4", "Quantify", "kg avoided is model-driven; Δcost € is analyst input — override freely."],
              ["5", "Read the curve", "All levers sorted by €/kg; bars = kg avoided; savings below zero."],
              ["6", "Decide", "Tier 1 implement · Tier 2 invest-to-improve · Tier 3 monitor."],
            ].map(([n, t, d]) => (
              <div key={n as string} className="card p-4">
                <p className="kpi font-display text-2xl font-semibold text-amber2">{n}</p>
                <p className="mt-2 text-[13px] font-semibold">{t}</p>
                <p className="mt-1 text-[11.5px] leading-snug text-steel2">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Layers3 size={16} className="text-steel3" />
            <p className="max-w-3xl text-xs leading-relaxed text-steel2">
              The base curve excludes revenue upside (green premium, share growth). You add it
              deliberately, as an overlay, when you decide. Not before.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
