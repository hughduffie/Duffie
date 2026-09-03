/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Klaviyo adapter is a workspace TypeScript package; Next compiles it
  // rather than requiring a prebuilt dist during development.
  transpilePackages: ['@crm-canvas/klaviyo'],
};

export default nextConfig;
