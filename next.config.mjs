/** @type {import('next').NextConfig} */
const nextConfig = {
   typescript: {
      ignoreBuildErrors: true,
   },
   experimental: {
      missingSuspenseWithCSRBailout: false,
      serverComponentsExternalPackages: ["sequelize", "@sequelize/core"],
   },
   headers: () => [
      {
         source: "/api/:path*",
         headers: [
            {
               key: "Cache-Control",
               value: "no-store",
            },
         ],
      },
   ],
   images: {
      remotePatterns: [
         {
            protocol: "https",
            hostname: "images.pexels.com",
            port: "",
            pathname: "/photos/**",
         },
         {
            protocol: "https",
            hostname: "imagelabumbucket.s3.ap-southeast-2.amazonaws.com",
            port: "",
            pathname: "/**",
         },
      ],
      formats: ["image/webp", "image/avif"],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      minimumCacheTTL: 60,
   },
};

export default nextConfig;
