import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // static export for the demo build; `npm run dev` is unaffected
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
