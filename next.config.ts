import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-4ec4f861-d13f-4e08-ae21-fdff3bbea859.space-z.ai",
    "*.space-z.ai",
    "21.0.2.185",
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;
