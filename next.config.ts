import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Dominios permitidos para <Image src>. Unsplash para el xlsx de muestra,
  // uploadthing/cloudflare para uploads propios cuando se agreguen.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
