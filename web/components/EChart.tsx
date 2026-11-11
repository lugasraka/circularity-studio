"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import * as echarts from "echarts";

/** Minimal echarts-react wrapper (no extra dependency). */
export function EChart({
  option,
  height = 420,
  instanceRef,
}: {
  option: echarts.EChartsCoreOption;
  height?: number;
  instanceRef?: MutableRefObject<echarts.ECharts | null>;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    const chart = echarts.init(el, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    if (instanceRef) instanceRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (instanceRef) instanceRef.current = null;
      chart.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  return <div ref={divRef} className="w-full" style={{ height }} role="img" aria-label="Circularity Cost Curve" />;
}
