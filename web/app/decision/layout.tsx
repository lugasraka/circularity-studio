import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Decision tiers",
  description: "Tier 1 implement now, Tier 2 invest deliberately, Tier 3 monitor — with exports.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
