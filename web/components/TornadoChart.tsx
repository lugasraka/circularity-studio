"use client";

import { useMemo, useRef } from "react";
import type * as echarts from "echarts";
import { EChart } from "./EChart";
import { useStudio } from "@/lib/AppContext";
import { computeTornado } from "@/lib/sensitivity";

export function TornadoChart() {
  const { state } = useStudio();
  const ref = useRef<echarts.ECharts | null>(null);
  const items = useMemo(()=> computeTornado(state).slice(0,8), [state]);

  const option = useMemo<echarts.EChartsCoreOption>(()=> {
    const labels = items.map(i=>`${i.label} (${i.lever})`).reverse();
    const low = items.map(i=>i.lowKg).reverse();
    const high = items.map(i=>i.highKg).reverse();
    const base = items[0]?.baseKg ?? 0;
    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }},
      grid: { left: 150, right: 40, top: 20, bottom: 40 },
      xAxis: { type: "value", name: "Σ kg avoided / 1,000 (upper bound)", nameLocation: "middle", nameGap: 28 },
      yAxis: { type: "category", data: labels, axisLabel: { fontSize: 11 } },
      series: [
        {
          name: "Low (−20%)",
          type: "bar",
          stack: "t",
          data: items.map(i=>0).reverse(),
          silent: true,
        },
        {
          name: "",
          type: "bar",
          stack: "t",
          itemStyle: { color: "transparent" },
          data: low.map((v,i)=> v - (high[i]===undefined?0:0)),
          silent: true,
          tooltip: { show: false },
        },
        {
          name: "Range",
          type: "bar",
          itemStyle: { color: "#1f3252", borderRadius: [3,3,3,3] },
          data: items.map(i=> i.highKg - i.lowKg).reverse(),
          label: { show: true, position: "right", fontSize: 10, formatter: "{c} kg range" },
        },
      ],
      markLine: {
        silent: true,
        symbol: "none",
        lineStyle: { color: "#e3b23c", width: 2, type: "solid" },
        label: { formatter: `base {c}` },
        data: [{ xAxis: base }],
      },
    } as echarts.EChartsCoreOption;
  }, [items, state]);

  // Simpler fallback: if ECharts config gets complex, render HTML table instead
  // Keep both: chart on top, table below for print/accessibility
  return (
    <div className="card p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-steel3">Sensitivity — what moves the result</p>
      <p className="mt-1 text-[11px] text-steel2">Tornado: ±20% on each of 16 model parameters, sorted by kg range. Only top 8 shown. Base = {items[0]?.baseKg.toFixed(0) ?? "—"} kg.</p>
      <div className="mt-3"><EChart option={option} height={300} instanceRef={ref} /></div>
      <table className="table-plain mt-3 w-full text-[11px]">
        <thead><tr><th>Parameter</th><th className="text-right">Low kg</th><th className="text-right">High kg</th><th className="text-right">Range</th></tr></thead>
        <tbody>{items.map(i=>(
          <tr key={i.key}><td>{i.label} <span className="text-steel4">({i.lever})</span></td><td className="kpi text-right">{i.lowKg.toFixed(0)}</td><td className="kpi text-right">{i.highKg.toFixed(0)}</td><td className="kpi text-right font-semibold">{i.deltaKg.toFixed(0)}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}
