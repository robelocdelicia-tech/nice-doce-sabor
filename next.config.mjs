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
    // Garante que mesmo que o host não tenha otimizador de imagem nativo ativado, a imagem carrega perfeitamente
    unoptimized: process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES === 'true',
  },
};

export default nextConfig;
