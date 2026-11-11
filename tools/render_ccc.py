#!/usr/bin/env python3
"""Render the Circularity Cost Curve (Variant B) from fixtures/drill.json.

README asset: docs/assets/ccc-drill-example.png
Bar width = kg of virgin material avoided; height = EUR per kg avoided; negative = saving.
All values are illustrative (worked example from the framework documentation).
"""

import json
from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

REPO = Path(__file__).resolve().parent.parent
FX = json.loads((REPO / "fixtures" / "drill.json").read_text(encoding="utf-8"))
OUT = REPO / "docs" / "assets" / "ccc-drill-example.png"
OUT.parent.mkdir(parents=True, exist_ok=True)

levers = FX["expected"]
codes = FX["expected"]["sortedCodes"]
kg = FX["expected"]["leverKg"]
cost = FX["expected"]["eurPerKg"]
lever_meta = {l["code"]: l for l in FX["levers"]}

ink = "#0E1F38"
steel = "#2E5077"
save = "#1F9D66"
costred = "#C4452B"
mute = "#77808D"
grid = "#E7E4DB"

centers, widths, heights, colors = [], [], [], []
cum = 0.0
for code in codes:
    w = kg[code]
    c = cum + w / 2
    h = cost[code]
    centers.append(c)
    widths.append(w)
    heights.append(h)
    colors.append(save if h < 0 else costred)
    cum += w

cum_line_x = [0.0]
cum_line_y = [0.0]
acc = 0.0
for code in codes:
    acc += kg[code]
    cum_line_x.append(acc)
    cum_line_y.append(acc)

fig, ax = plt.subplots(figsize=(11.6, 4.9), dpi=160)
fig.patch.set_facecolor("#FFFFFF")

ax.bar(centers, heights, width=widths, color=colors, edgecolor="white", linewidth=0.6, zorder=3)
ax.axhline(0, color=ink, linewidth=1.5)
ax.set_ylabel("EUR per kg virgin avoided", color=mute, fontsize=10)
ax.set_xlabel("Virgin material avoided — cumulative, kg per 1,000 units (bar width ∝ kg)", color=mute, fontsize=10)
ax.set_xlim(0, cum * 1.01)
ax.grid(axis="y", linestyle="--", linewidth=0.6, color=grid, zorder=0)
for spine in ["top", "right", "left"]:
    ax.spines[spine].set_visible(False)
ax.tick_params(left=False)
ax.set_ylim(min(heights) * 1.18, max(heights) * 1.18)

ax2 = ax.twinx()
ax2.plot(cum_line_x, cum_line_y, color=ink, linewidth=2.2, marker="o", markersize=4.5,
         markerfacecolor="#E3B23C", markeredgecolor=ink, markeredgewidth=1.4, zorder=4)
ax2.set_ylim(0, cum * 1.12)
ax2.set_ylabel("Cumulative kg avoided", color=mute, fontsize=10)
for spine in ["top", "left", "right"]:
    ax2.spines[spine].set_visible(False)
ax2.tick_params(right=False)

legend = ax.legend(
    handles=[
        mpatches.Patch(color=save, label="Net saving per kg (Tier 1)"),
        mpatches.Patch(color=costred, label="Net cost per kg (Tier 2/3)"),
        plt.Line2D([0], [0], color=ink, marker="o", markerfacecolor="#E3B23C", markeredgecolor=ink, label="Cumulative kg avoided"),
    ],
    loc="upper center", bbox_to_anchor=(0.5, 1.16), ncol=3, frameon=False, fontsize=9,
)
fig.text(0.995, 0.012, "Worked example — cordless drill (illustrative values). Source: fixtures/drill.json",
         ha="right", fontsize=7, color=mute)
fig.subplots_adjust(left=0.075, right=0.925, top=0.86, bottom=0.17)
plt.savefig(OUT, facecolor="white")
print(f"written {OUT}  ({OUT.stat().st_size/1024:.0f} KB, total {cum:.0f} kg)")
