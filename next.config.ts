import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Refuerzo del noindex a nivel de headers para cualquier respuesta.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
