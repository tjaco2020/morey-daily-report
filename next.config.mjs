/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tell Next.js to never bundle these — they're loaded directly from
  // node_modules at runtime by Node's resolver. Required for libraries
  // that use Node-only APIs (fs, native bindings, dynamic requires).
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer", "snowflake-sdk"],
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
