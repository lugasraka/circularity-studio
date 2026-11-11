"use client";

import { useMemo, useRef, useState } from "react";
import type * as echarts from "echarts";
import Link from "next/link";
import { ArrowRight, Download, Info, LineChart } from "lucide-react";
import { useStudio } from "@/lib/AppContext";
import { EChart } from "@/components/EChart";
import { MaterialFlow } from "@/components/MaterialFlow";
import { CostWaterfall } from "@/components/CostWaterfall";
import { cumulativeKg } from "@/lib/model";

const SAVE = "#1f9d66";
const COST = "#c4452b";
const NEUTRAL = "#a8a696";
const INK = "#0e1f38";

export default function CurvePage() {
  const { sorted, summary, state, levers } = useStudio();
  const [showCumulative, setShowCumulative] = useState(false);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const displayCurrency = state.inputs.displayCurrency ?? "EUR";
  const fx = state.inputs.fxUsdEur || 1;

  const unit = displayCurrency === "EUR" ? "EUR per kg virgin avoided" : "USD per kg virgin avoided";
  const unitShort = displayCurrency === "EUR" ? "EUR / kg" : "USD / kg";
  const cum = cumulativeKg(sorted);
  const totalKg = cum.length ? cum[cum.length - 1] : 0;

  // segment per lever: [start, end, costPerKg, kg, code, confidence]
  const segments = useMemo(() => {
    let acc = 0;
    return sorted.map((l) => {
      const start = acc;
      acc += l.kg;
      const cost = displayCurrency === "EUR" ? l.eurPerKg ?? 0 : l.usdPerKg ?? 0;
      return { start, end: acc, cost, kg: l.kg, code: l.code, name: l.name, tier: l.tier, eurPerKg: l.eurPerKg, usdPerKg: l.usdPerKg, costEurPer1000: l.costEurPer1000, co2eKg: l.co2eKg, confidence: l.confidence };
    });
  }, [sorted, displayCurrency]);

  const xMax = Math.max(1, Math.ceil(totalKg * 1.02));
  const option = useMemo<echarts.EChartsCoreOption>(
    () => ({
      animationDuration: 450,
      grid: { left: 64, right: showCumulative ? 64 : 20, top: 34, bottom: 58 },
      tooltip: {
        trigger: "item",
        backgroundColor: INK,
        borderWidth: 0,
        textStyle: { color: "#f7f5f0", fontSize: 12 },
        formatter: (p: unknown) => {
          const param = p as { value: [number, number, number, number, string] };
          const v = param.value;
          const lever = segments.find((s) => s.code === v[4]);
          if (!lever) return v[4];
          const eur = lever.eurPerKg;
          const usd = lever.usdPerKg;
          return [
            `<div style="font-weight:700;margin-bottom:4px">${lever.code} — ${lever.name}</div>`,
            `€ ${eur === null ? "n/a" : eur.toFixed(2)} per kg &nbsp;·&nbsp; $ ${usd === null ? "n/a" : usd.toFixed(2)}`,
            `kg avoided / 1,000 units: <b>${lever.kg.toFixed(1)}</b> (cumulative ${v[1].toFixed(1)})`,
            `Δcost: <b>${lever.costEurPer1000 < 0 ? "−" : ""}€${Math.abs(lever.costEurPer1000).toFixed(0)}</b> / 1,000 units`,
            `CO₂e avoided: <b>${lever.co2eKg.toFixed(0)} kg</b> · Tier <b>${lever.tier ?? "—"}</b> · Confidence <b>${lever.confidence}</b>`,
          ].join("<br/>");
        },
      },
      xAxis: {
        type: "value",
        min: 0,
        max: xMax,
        name: "Virgin material avoided — cumulative, kg per 1,000 units",
        nameLocation: "middle",
        nameGap: 32,
        nameTextStyle: { color: "#77808d", fontSize: 11, fontFamily: "Inter, sans-serif" },
        splitLine: { show: false },
        axisLine: { lineStyle: { color: "#c9c5b8" } },
        axisTick: { show: false },
        axisLabel: { color: "#55606e", fontFamily: "Inter, sans-serif" },
      },
      yAxis: [
        {
          type: "value",
          name: unitShort,
          nameTextStyle: { color: "#77808d", fontSize: 11, fontFamily: "Inter, sans-serif" },
          splitLine: { lineStyle: { type: "dashed", color: "#e7e4db" } },
          axisLabel: { color: "#55606e", formatter: "{value}" },
        },
        {
          type: "value",
          name: "kg cumulative",
          min: 0,
          max: xMax,
          show: showCumulative,
          nameTextStyle: { color: "#77808d", fontSize: 11 },
          splitLine: { show: false },
          axisLabel: { color: "#55606e" },
        },
      ],
      series: [
        {
          name: unit,
          type: "custom",
          renderItem: (_params: unknown, api: any) => {
            const start = api.value(0) as number;
            const cost = api.value(2) as number;
            const end = api.value(1) as number;
            const code = api.value(4) as string;
            const seg = segments.find((s: { code: string }) => s.code === code);
            const conf = seg?.confidence ?? "—";
            const yZero = api.coord([start, 0])[1] as number;
            const yCost = api.coord([start, cost])[1] as number;
            const xStart = api.coord([start, 0])[0] as number;
            const xEnd = api.coord([end, 0])[0] as number;
            const gap = 1.25;
            const base = cost < 0 ? SAVE : cost > 0 ? COST : NEUTRAL;
            // Low confidence = hatched / lighter with opacity
            const opacity = conf === "Low" ? 0.45 : conf === "Medium" ? 0.8 : 1;
            return {
              type: "rect",
              clip: true,
              shape: {
                x: xStart + gap / 2,
                y: Math.min(yZero, yCost),
                width: Math.max(0.75, xEnd - xStart - gap),
                height: Math.abs(yZero - yCost),
              },
              style: api.style({
                fill: base,
                opacity,
                stroke: conf === "Low" ? "#0e1f38" : "none",
                lineDash: conf === "Low" ? [3,3] : undefined,
              }),
            };
          },
          encode: { x: [0, 1], y: 2 },
          data: segments.map((s) => [s.start, s.end, s.cost, s.kg, s.code]),
          markLine: {
            silent: true,
            symbol: "none",
            label: { show: false },
            lineStyle: { color: INK, width: 1.6, type: "solid" },
            data: [{ yAxis: 0 }],
          },
        },
        ...(showCumulative
          ? [{
              name: "Cumulative kg avoided",
              type: "line" as const,
              yAxisIndex: 1,
              data: [[0, 0] as [number, number], ...segments.map((s) => [s.end, s.end] as [number, number])],
              smooth: false,
              symbol: "circle",
              symbolSize: 6,
              z: 5,
              lineStyle: { width: 2.5, color: INK },
              itemStyle: { color: "#e3b23c", borderColor: INK, borderWidth: 2 },
            }]
          : []),
      ],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [segments, totalKg, showCumulative, unit, unitShort, displayCurrency],
  );

  const downloadPng = () => {
    const chart = chartRef.current;
    if (!chart) return;
    const url = chart.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#f7f5f0" });
    const a = document.createElement("a");
    a.href = url;
    a.download = `circularity-cost-curve-${displayCurrency.toLowerCase()}.png`;
    a.click();
  };

  const currency = displayCurrency === "EUR" ? "€" : "$";
  const excludedLevers = levers.filter((l) => !l.included).map((l) => l.code);

  if (sorted.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <p className="kicker">Step 5 — The curve</p>
        <h1 className="h-display mt-2 text-3xl font-semibold">Nothing on the curve yet.</h1>
        <div className="card mt-6 max-w-2xl p-10 text-center">
          <p className="font-display text-2xl font-semibold text-ink">No levers are screened in.</p>
          <p className="mt-3 text-sm leading-relaxed text-steel2">
            Every lever has at least one “N” in the gate screening. Switch on the ones that apply —
            the curve, the tiers and the totals will redraw themselves.
          </p>
          <Link href="/levers" className="btn btn-primary mt-6">
            Screen the levers <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Step 5 — The curve</p>
          <h1 className="h-display mt-2 text-3xl font-semibold">Width is the kg avoided.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel2">
            Bar height is cost per kg avoided (negative = the lever pays for itself). Width is kg avoided
            per 1,000 units. Hover any bar for the numbers. Currency: {currency} — change it on Profile.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCumulative((s) => !s)}
            aria-pressed={showCumulative}
            className={`btn ${showCumulative ? "btn-ink" : "btn-ghost"}`}
            title="Overlay a cumulative kg-avoided line on the right-hand axis"
          >
            <LineChart size={15} /> Cumulative
          </button>
          <button className="btn btn-ink" onClick={downloadPng}>
            <Download size={15} /> PNG
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <MaterialFlow />
        <CostWaterfall />
      </div>

      <div className="card mt-6 p-4 sm:p-6">
        <EChart option={option} height={440} instanceRef={chartRef} />
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-steel2">
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#1f9d66] opacity-100" /> High confidence — solid</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#1f9d66] opacity-80" /> Medium — 80%</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm border border-ink bg-[#1f9d66] opacity-45" /> Low — 45% hatched (inspect basis)</span>
          <span className="ml-auto flex gap-2"><span className="text-save">● below zero (saves)</span><span className="text-cost">● above zero (costs)</span></span>
        </div>
      </div>

      {/* ---------- reading the curve ---------- */}
      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <div className="card p-5 lg:col-span-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-steel3">Sorted read — what the board should see</p>
          <table className="table-plain mt-2 w-full">
            <thead>
              <tr><th>#</th><th>Code</th><th>Lever</th><th className="text-right">kg /1,000</th><th className="text-right">{currency} / kg</th><th className="text-right">Δcost {currency}</th><th>Tier</th></tr>
            </thead>
            <tbody>
              {sorted.map((l, i) => (
                <tr key={l.code}>
                  <td className="kpi text-steel4">{i + 1}</td>
                  <td className="kpi font-bold">{l.code}</td>
                  <td>{l.name}</td>
                  <td className="kpi text-right">{l.kg.toFixed(1)}</td>
                  <td className={`kpi text-right ${(l.eurPerKg ?? 0) < 0 ? "text-save" : "text-cost"}`}>{displayCurrency === "EUR" ? l.eurPerKg?.toFixed(2) : l.usdPerKg?.toFixed(2)}</td>
                  <td className="kpi text-right">{l.costEurPer1000 < 0 ? "−" : ""}{currency}{Math.abs((displayCurrency === "EUR" ? l.costEurPer1000 : l.costEurPer1000 / fx)).toLocaleString()}</td>
                  <td><span className={`chip ${l.tier === "T1" ? "chip-save" : l.tier === "T2" ? "chip-amber" : "chip-slate"}`}>{l.tier}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="field-hint mt-2">Σ — kg avoided {summary.includedKg.toFixed(0)} (upper bound) · Δcost {summary.includedCostEur < 0 ? "−" : ""}€{Math.abs(summary.includedCostEur).toLocaleString()} · CO₂e {summary.includedCo2eKg.toFixed(0)} kg</p>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="card border-l-4 border-l-save p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-save">Below zero — paybacks</p>
            <p className="mt-1 text-sm leading-relaxed text-steel2">
              <strong>6b leasing (−€19.7/kg)</strong> and <strong>8a reduce over-production (−€17.4/kg)</strong> are the
              wide green bars on the left — the most material at negative cost. The cheap tail (refurbish, waste
              valorization and reduction, redesign) is Tier 1. Do them first.
            </p>
          </div>
          <div className="card border-l-4 border-l-amber p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber2">Above zero — strategic</p>
            <p className="mt-1 text-sm leading-relaxed text-steel2">
              <strong>7a repair, 7c durability, 7d care</strong> are narrow red bars that still matter — justify with
              lifetime EBIT and the deliberately-excluded revenue overlay, not by pretending they save money.
            </p>
          </div>
          <div className="card p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-steel3">Assumptions baked in</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-[12px] leading-snug text-steel2">
              <li>Cost + EBIT impact only — green premium &amp; market-share growth deliberately excluded</li>
              <li>FX {state.inputs.fxUsdEur} €/$ · CO₂e {state.inputs.co2eFactor} kg CO₂e/kg · per 1,000-unit cohort</li>
              <li>Σ is an <em>upper bound</em>: levers overlap — never sum naively</li>
              <li>Screened out ({excludedLevers.length}): {excludedLevers.join(", ") || "none"} — reasons on the Levers step</li>
            </ul>
            <p className="field-hint mt-2 flex items-start gap-1"><Info size={12} className="mt-0.5 shrink-0" /> The y-axis is unbroken. No bars are clipped.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

