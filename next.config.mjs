/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tell Next.js to never bundle these — they're loaded directly from
  // node_modules at runtime by Node's resolver. Required for libraries
  // that use Node-only APIs (fs, native bindings, dynamic requires).
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer", "snowflake-sdk"],
    // Force-include these in every serverless function bundle so Vercel's
    // file tracer doesn't accidentally strip them out (snowflake-sdk uses
    // dynamic requires the tracer can't follow on its own).
    outputFileTracingIncludes: {
      "/api/**/*": [
        "node_modules/snowflake-sdk/**/*",
      ],
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        "@react-pdf/renderer",
        "snowflake-sdk",
      ];
    }
    return config;
  },
};

export default nextConfig;
