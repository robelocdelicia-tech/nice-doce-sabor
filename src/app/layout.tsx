import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://nicedocesabor.com.br"),
  title: "Nice Doce Sabor | Confeitaria Artesanal em Recife-PE",
  description:
    "Cardápio digital exclusivo de doces, bolos decorados e salgados artesanais por Eunice Pereira. Faça seu pedido online com carinho e qualidade.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "Nice Doce Sabor | Cardápio Digital & Encomendas",
    description: "Doces e salgados artesanais de alta confeitaria em Recife-PE por Eunice Pereira.",
    url: "https://nicedocesabor.com.br",
    siteName: "Nice Doce Sabor",
    images: [
      {
        url: "/logo.jpg",
        width: 800,
        height: 800,
        alt: "Logo Nice Doce Sabor",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#E0489A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen flex flex-col selection:bg-nice-pink selection:text-white">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
