import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { StudioProvider } from "@/lib/AppContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SummaryBar } from "@/components/SummaryBar";
import { SiteFooter } from "@/components/SiteFooter";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://circularity-studio.vercel.app"),
  title: {
    default: "Circularity Studio — the business case for circularity",
    template: "%s · Circularity Studio",
  },
  description:
    "Quantify circularity levers for any product: the telescoping decomposition VM/US = (VM/TM) × (TM/P) × (P/US), the 20-lever taxonomy, and the Circularity Cost Curve with auto-tiered decisions.",
  openGraph: {
    type: "website",
    siteName: "Circularity Studio",
    url: "/",
    title: "Circularity Studio — the business case for circularity",
    description:
      "One identity decomposes any product into virgin material per unit of service. Twenty levers move it. One cost curve ranks them.",
    images: [{ url: "/brand/og-image.jpg", width: 1200, height: 630, alt: "Circularity Studio — The business case for circularity" }],
    locale: "en_IE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Circularity Studio — the business case for circularity",
    description:
      "One identity decomposes any product into virgin material per unit of service. Twenty levers move it. One cost curve ranks them.",
    images: ["/brand/og-image.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full`}>
      <body className="h-full min-h-screen flex flex-col">
        <StudioProvider>
          <SiteHeader />
          <SummaryBar />
          <main className="flex-1 w-full">{children}</main>
          <SiteFooter />
        </StudioProvider>
      </body>
    </html>
  );
}
