"use client";

import { useStudio } from "@/lib/AppContext";
import { LEVER_GROUPS } from "@/lib/levers";

const GATE_LABELS = ["Allowed?", "Measurable?", "In scope?"] as const;

export default function LeversPage() {
  const { state, levers, setGate } = useStudio();
  const inc = levers.filter((l) => l.included).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Step 3 — Screen the levers</p>
          <h1 className="h-display mt-2 text-3xl font-semibold">Twenty levers, three gate questions.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel2">
            Any N parks the lever. Record the reason; it stays with the file.
          </p>
        </div>
        <div className="card flex items-center gap-4 px-5 py-3">
          <p className="kpi font-display text-4xl font-semibold text-steel2">{inc}<span className="text-lg text-steel4">/20</span></p>
          <p className="text-[11px] font-semibold uppercase leading-tight tracking-widest text-steel3">Screened<br />in</p>
        </div>
        {inc === 0 && (
          <p className="text-[11px] font-semibold text-cost">All 20 levers are parked — flip a gate back to Y to redraw the curve.</p>
        )}
      </div>

      <div className="mt-8 space-y-8">
        {LEVER_GROUPS.map((group) => {
          const inGroup = levers.filter((l) => l.group === group);
          return (
            <section key={group}>
              <h2 className="flex items-center gap-3 font-display text-xl font-semibold text-steel">
                <span className="inline-block h-5 w-1.5 rounded-full bg-amber" aria-hidden />
                {group}
              </h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {inGroup.map((l) => {
                  const gates = state.gates[l.code] ?? [true, true, true];
                  const included = l.included;
                  return (
                    <div
                      key={l.code}
                      className={`card flex flex-col p-4 transition-opacity ${included ? "" : "opacity-60"}`}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-semibold">
                          <span className="kpi mr-2 inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-steel px-1.5 text-[11px] font-bold text-amber">{l.code}</span>
                          {l.name}
                        </p>
                        <span className={`chip ${included ? "chip-save" : "chip-slate"}`}>{included ? "In" : "Out"}</span>
                      </div>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-steel4">Moves {l.factor}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {GATE_LABELS.map((label, gi) => {
                          const val = gates[gi];
                          return (
                            <button
                              key={gi}
                              onClick={() => setGate(l.code, gi as 0 | 1 | 2, !val)}
                              aria-pressed={val}
                              className={`rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
                                val
                                  ? "border-save/40 bg-savebg text-save"
                                  : "border-cost/40 bg-costbg text-cost"
                              }`}
                            >
                              {label} <span className="kpi">{val ? "Y" : "N"}</span>
                            </button>
                          );
                        })}
                      </div>
                      {!included && l.reason && (
                        <p className="mt-3 border-t border-mist pt-2 text-[11.5px] leading-snug text-steel2">
                          <span className="font-semibold text-cost">Parked:</span> {l.reason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
