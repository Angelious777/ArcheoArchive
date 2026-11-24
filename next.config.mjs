/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Las fotografías (hasta 8 MB c/u) y un modelo GLB (hasta 50 MB) viajan en
    // server actions; el límite por defecto (1 MB) los rechazaría.
    serverActions: { bodySizeLimit: "64mb" },
  },
  poweredByHeader: false,
};

export default nextConfig;
