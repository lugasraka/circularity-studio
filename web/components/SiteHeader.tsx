"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useStudio } from "@/lib/AppContext";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/profile", label: "1 Profile" },
  { href: "/bom", label: "2 BOM" },
  { href: "/levers", label: "3 Levers" },
  { href: "/quantify", label: "4 Quantify" },
  { href: "/curve", label: "5 Curve" },
  { href: "/decision", label: "6 Decision" },
  { href: "/method", label: "Method" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { resetToDrillExample, touched } = useStudio();

  return (
    <header className="sticky top-0 z-40 border-b border-mist bg-paper/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/brand/logo-mark.png"
              alt="Circularity Studio"
              width={30}
              height={30}
              className="rounded-md"
              priority
            />
            <span className="leading-tight">
              <span className="block font-display text-[15px] font-semibold tracking-tight text-ink">
                Circularity Studio
              </span>
              <span className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-steel3 sm:block">
                The business case for circularity
              </span>
            </span>
          </Link>

          <nav className="no-print ml-auto flex items-center gap-1 overflow-x-auto">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                    active
                      ? "bg-ink text-paper"
                      : "text-steel2 hover:bg-mist hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {touched && (
              <button
                onClick={resetToDrillExample}
                title="Discard your edits and reload the cordless-drill worked example"
                className="ml-1 whitespace-nowrap rounded-full border border-amber2/60 px-3 py-1.5 text-[12.5px] font-semibold text-amber2 hover:bg-amber hover:text-ink"
              >
                Reset example
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
