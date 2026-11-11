import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Circularity Cost Curve",
  description: "All included levers sorted by cost per kg of virgin material avoided; bar width = kg avoided.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
