import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Lock module resolution to fit-match dir (fixes tailwindcss resolve from parent)
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
