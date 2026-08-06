/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  // Include seeded SQLite DB in the Vercel serverless bundle
  outputFileTracingIncludes: {
    "/*": ["./prisma/dev.db"],
  },
};

export default nextConfig;
