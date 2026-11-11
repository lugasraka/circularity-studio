import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lever screen",
  description: "Screen all 20 circularity levers with three gate questions — excluded levers keep recorded reasons.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
