import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bill of materials",
  description: "Component masses and virgin shares — the raw input to the factor decomposition.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
