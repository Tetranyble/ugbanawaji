import type { NextConfig } from "next";
import path from "node:path";

const standalone = process.env.NEXT_OUTPUT === "standalone";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  output: standalone ? "standalone" : undefined,
  images: standalone ? { unoptimized: true } : undefined,
  outputFileTracingExcludes: standalone
    ? { "/*": ["node_modules/sharp/**/*", "node_modules/@img/**/*"] }
    : undefined,
  poweredByHeader: false,
  compress: true,
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(process.cwd(), "src"),
    };
    return config;
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
