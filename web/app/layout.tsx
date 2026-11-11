import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { StudioProvider } from "@/lib/AppContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Circularity Studio — the business case for circularity",
    template: "%s · Circularity Studio",
  },
  description:
    "Quantify circularity levers for any product: the telescoping decomposition VM/US = (VM/TM) × (TM/P) × (P/US), the 20-lever taxonomy, and the Circularity Cost Curve with auto-tiered decisions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full`}>
      <body className="h-full min-h-screen flex flex-col">
        <StudioProvider>
          <SiteHeader />
          <main className="flex-1 w-full">{children}</main>
          <SiteFooter />
        </StudioProvider>
      </body>
    </html>
  );
}
