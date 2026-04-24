/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração padrão para Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
