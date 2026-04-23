/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Desabilita lint e typecheck no build para economizar memória em planos grátis
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
