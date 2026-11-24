import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // CSV-Importe mit vielen Zeilen werden per Server Action übertragen
    serverActions: { bodySizeLimit: "20mb" },
  },
};

export default nextConfig;
