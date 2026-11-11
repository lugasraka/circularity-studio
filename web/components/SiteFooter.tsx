import Link from "next/link";
import { Code2 } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-steel/20 bg-ink text-paper/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-paper">Circularity Studio</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-paper/60">
              A general-purpose decision framework: decompose any product into virgin
              materials per unit of service, quantify the 20 circularity levers, and rank
              them by cost per kg of virgin material avoided.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
            <Link href="/method" className="hover:text-amber">Method &amp; caveats</Link>
            <Link href="/curve" className="hover:text-amber">The curve</Link>
            <Link href="/decision" className="hover:text-amber">Decision tiers</Link>
            <a
              href="https://github.com/lugasraka/circularity-studio"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-amber"
            >
              <Code2 size={13} strokeWidth={2} /> Source
            </a>
            <span className="text-paper/40">Illustrative values — verify with your own data</span>
          </div>
        </div>
        <p className="mt-6 border-t border-white/10 pt-4 text-[11px] text-paper/40">
          Built on the Circularity Decision Framework (docs/circularity-decision-framework.md).
          Base curve = cost + EBIT impact only; revenue upside is deliberately excluded.
        </p>
      </div>
    </footer>
  );
}
