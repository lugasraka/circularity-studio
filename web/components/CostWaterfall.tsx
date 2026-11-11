"use client";

import { useMemo, useRef } from "react";
import type * as echarts from "echarts";
import { EChart } from "./EChart";
import { useStudio } from "@/lib/AppContext";

export function CostWaterfall() {
  const { sorted, summary } = useStudio();
  const ref = useRef<echarts.ECharts | null>(null);

  const option = useMemo<echarts.EChartsCoreOption>(() => {
    let acc = 0;
    const cats: string[] = ["Start 0"];
    const base: number[] = [0];
    const delta: number[] = [0];
    const colors: string[] = [];
    const cum: number[] = [0];

    sorted.forEach((l) => {
      cats.push(l.code);
      const start = acc;
      acc += l.costEurPer1000;
      const end = acc;
      base.push(Math.min(start, end));
      delta.push(Math.abs(end - start));
      colors.push(l.costEurPer1000 < 0 ? "#1f9d66" : "#c4452b");
      cum.push(end);
    });
    cats.push("Net");
    base.push(Math.min(0, acc));
    delta.push(Math.abs(acc));
    cum.push(acc);

    return {
      tooltip: {
        trigger: "axis",
        formatter: (p: unknown) => {
          const arr = p as Array<{ name: string; dataIndex: number; value: number }>;
          if (!arr?.length) return "";
          const idx = arr[0]?.dataIndex;
          const name = cats[idx];
          if (name === "Start 0") return "Starting point €0";
          if (name === "Net") return `Net Δcost <b>€${summary.includedCostEur.toLocaleString()}</b> · ${summary.includedKg.toFixed(0)} kg avoided`;
          const l = sorted.find((x) => x.code === name);
          if (!l) return name;
          return `${l.code} ${l.name}<br/>Δcost <b>€${l.costEurPer1000.toLocaleString()}</b> · ${l.kg.toFixed(1)} kg<br/>Cumulative <b>€${cum[idx].toLocaleString()}</b>`;
        },
      } as echarts.EChartsCoreOption["tooltip"],
      xAxis: { type: "category", data: cats, axisLabel: { fontSize: 10, rotate: 45, interval: 0 } },
      yAxis: { type: "value", name: "Cumulative € / 1,000", axisLabel: { formatter: (v: number) => v.toLocaleString() } },
      grid: { left: 62, right: 16, top: 36, bottom: 78 },
      series: [
        {
          type: "bar",
          stack: "wf",
          silent: true,
          itemStyle: { color: "transparent", borderColor: "transparent" },
          emphasis: { disabled: true },
          data: base,
        },
        {
          name: "Waterfall",
          type: "bar",
          stack: "wf",
          data: delta,
          itemStyle: {
            borderWidth: 0,
            color: (p: unknown) => {
              const idx = (p as { dataIndex: number }).dataIndex;
              if (idx === 0 || idx === cats.length - 1) return "#0e1f38";
              return colors[idx - 1] ?? "#55606e";
            },
          },
          label: {
            show: true,
            position: "top",
            fontSize: 9,
            color: "#55606e",
            formatter: (p: unknown) => {
              const idx = (p as { dataIndex: number }).dataIndex;
              if (idx === 0) return "";
              if (idx === cats.length - 1) return `€${acc.toLocaleString()}`;
              const l = sorted[idx - 1];
              return l ? `€${Math.abs(l.costEurPer1000).toLocaleString()}` : "";
            },
          },
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: { color: "#0e1f38", width: 1, type: "solid" },
            label: { show: false },
            data: [{ yAxis: 0 }],
          },
        },
      ],
    } as echarts.EChartsCoreOption;
  }, [sorted, summary]);

  return (
    <div className="card p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-steel3">€ waterfall — how savings stack to net</p>
      <p className="mt-1 text-[11px] text-steel2">Ordered by €/kg (cheapest saving first). Green below zero = savings that fund the red investments.</p>
      <div className="mt-3"><EChart option={option} height={300} instanceRef={ref} /></div>
      <p className="mt-2 text-[11px] text-steel4">Math check: Σ Δcost = {summary.includedCostEur.toLocaleString()} €/1,000 · {summary.includedKg.toFixed(0)} kg avoided</p>
    </div>
  );
}
