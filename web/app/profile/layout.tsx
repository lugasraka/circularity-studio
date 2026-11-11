import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product profile",
  description: "Define the product and its useful service; the three factors recompute live.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
