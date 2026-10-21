/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Permite carregamento seguro de imagens do Supabase, Unsplash e placeholders sem quebrar no Netlify ou Vercel
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
    // Garante que no Netlify, Vercel e no celular todas as fotos carreguem direto sem falha ou delay de proxy
    unoptimized: true,
  },
};

export default nextConfig;
