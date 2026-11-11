"use client";

import { useStudio } from "@/lib/AppContext";

export function MaterialFlow() {
  const { factors: f } = useStudio();

  const total = f.tm || 1;
  const virginPct = f.tm > 0 ? (f.vm / f.tm) * 100 : 0;
  const circulatedPct = 100 - virginPct;
  const scrapPct = f.tm > 0 ? (f.scrap / f.tm) * 100 : 0;
  const productPct = 100 - scrapPct;

  return (
    <div className="card p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-steel3">Material flow — where the virgin goes</p>
      <div className="mt-4 space-y-4 text-[12.5px]">
        <div>
          <div className="mb-1 flex justify-between"><span className="font-semibold">Total material input (TM) {f.tm.toFixed(2)} kg</span><span className="kpi text-steel4">100%</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-mist flex">
            <div style={{ width: `${virginPct}%` }} className="h-full bg-steel" title={`Virgin ${virginPct.toFixed(0)}%`} />
            <div style={{ width: `${circulatedPct}%` }} className="h-full bg-save" title={`Circulated ${circulatedPct.toFixed(0)}%`} />
          </div>
          <div className="mt-1 flex gap-4 text-[11px] text-steel2">
            <span><span className="inline-block h-2 w-2 rounded-sm bg-steel mr-1" />Virgin {f.vm.toFixed(2)} kg · {virginPct.toFixed(1)}% (Factor 1 = {f.ratio1.toFixed(2)})</span>
            <span><span className="inline-block h-2 w-2 rounded-sm bg-save mr-1" />Circulated {f.circulated.toFixed(2)} kg</span>
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between"><span className="font-semibold">Product + scrap split</span><span className="text-steel4 text-[11px]">Factor 2 = {f.ratio2.toFixed(2)}</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-mist flex">
            <div style={{ width: `${productPct}%` }} className="h-full bg-steel2" />
            <div style={{ width: `${scrapPct}%` }} className="h-full bg-amber2" />
          </div>
          <div className="mt-1 flex gap-4 text-[11px] text-steel2">
            <span>Product P {f.mass.toFixed(2)} kg · {productPct.toFixed(0)}%</span>
            <span>Scrap {f.scrap.toFixed(2)} kg · {scrapPct.toFixed(0)}% — levers 4a/4b target this</span>
          </div>
        </div>

        <div className="rounded-xl bg-paper p-3 text-[12px] text-steel2">
          <strong>Headline:</strong> VM/US = {f.vmUsPerYear.toFixed(3)} kg per unit-year. P/US = {f.ratio3.toFixed(3)} kg/yr. Small wins multiply: 20% off each factor = −48.8%.
        </div>
      </div>
    </div>
  );
}
