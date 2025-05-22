import { fileURLToPath } from "url";
import { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import bundleAnalyzer from "@next/bundle-analyzer";
// import nextMDX from "@next/mdx";
import createJiti from "jiti";

// import createNextIntlPlugin from "next-intl/plugin";

// import remarkGfm from "remark-gfm";

createJiti(fileURLToPath(import.meta.url))("./src/env");

// const withNextIntl = createNextIntlPlugin();

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: true,
});

// const withMDX = nextMDX({
//   extension: /\.mdx?$/,
//   options: {
//     // remarkPlugins: [remarkGfm],
//   },
// });

const config: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      { hostname: "api.microlink.io" },
      { hostname: "avatar.vercel.sh" },
    ],
  },
  transpilePackages: [
    "@t3-oss/env-nextjs",
    "@t3-oss/env-core",
    "@fulltemplate/api-internal",
    "@fulltemplate/auth",
    "@fulltemplate/bot",
    "@fulltemplate/common",
    "@fulltemplate/db",
    "@fulltemplate/event",
    "@fulltemplate/helpers",
    "@fulltemplate/kafka",
    "@fulltemplate/logger",
    "@fulltemplate/mail",
    "@fulltemplate/notify",
    "@fulltemplate/socket",
    "@fulltemplate/uploadthing",
    "@fulltemplate/validators",
  ],
  logging: {
    fetches: {
      fullUrl: false,
      hmrRefreshes: false,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // ppr: true,
    // dynamicIO: true,
    typedRoutes: true,
    authInterrupts: true,
    // reactCompiler: true,
    // mdxRs: true,
  },
  // headers: async () => {
  //   return [
  //     {
  //       source: "/(.*)",
  //       headers: [
  //         {
  //           key: "X-Content-Type-Options",
  //           value: "nosniff",
  //         },
  //         {
  //           key: "X-Frame-Options",
  //           value: "DENY",
  //         },
  //         {
  //           key: "Referrer-Policy",
  //           value: "strict-origin-when-cross-origin",
  //         },
  //       ],
  //     },
  //     {
  //       source: "/sw.js",
  //       headers: [
  //         {
  //           key: "Content-Type",
  //           value: "application/javascript; charset=utf-8",
  //         },
  //         {
  //           key: "Cache-Control",
  //           value: "no-cache, no-store, must-revalidate",
  //         },
  //         {
  //           key: "Content-Security-Policy",
  //           value: "default-src 'self'; script-src 'self'",
  //         },
  //       ],
  //     },
  //   ];
  // },
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       fs: false,
  //       tls: false,
  //       net: false,
  //     };
  //   }
  //   return config;
  // },
};

// @ts-ignore
// const baseConfig = withNextIntl(withMDX(config));
// const baseConfig = withNextIntl(config);
const baseConfig = config;

// https://nextjs.org/docs/pages/api-reference/config/next-config-js#phase
const nextConfig: NextConfig = (phase: string) => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    // @ts-ignore
    return withBundleAnalyzer(baseConfig);
  }
  return baseConfig;
};

export default nextConfig;
