"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Heart, Sparkles, MessageSquareHeart, CreditCard, X } from "lucide-react";
import { DEFAULT_TESTIMONIALS } from "@/lib/constants";

interface StoryItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: {
    type: "testimonials" | "history" | "payment" | "gratitude";
    title: string;
    description: string[];
  };
}

export function TestimonialsStories() {
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);

  const stories: StoryItem[] = [
    {
      id: "feedback",
      title: "Feedback 🥰",
      subtitle: "Avaliações",
      icon: <MessageSquareHeart className="w-5 h-5 text-nice-pink" />,
      content: {
        type: "testimonials",
        title: "O que dizem nossos clientes",
        description: [
          "Carinho e qualidade aprovados por centenas de clientes em Recife!",
        ],
      },
    },
    {
      id: "historia",
      title: "Minha história",
      subtitle: "Eunice",
      icon: <Heart className="w-5 h-5 text-nice-pink fill-nice-pink/20" />,
      content: {
        type: "history",
        title: "A história da Nice Doce Sabor",
        description: [
          "A Nice Doce Sabor nasceu do sonho e da paixão de Eunice Pereira pela alta confeitaria artesanal.",
          "Cada bolo, doce e salgado é produzido à mão, priorizando ingredientes frescos e nobres, para que cada celebração em família seja inesquecível.",
        ],
      },
    },
    {
      id: "gratidao",
      title: "Gratidão 🙏",
      subtitle: "A Deus",
      icon: <Sparkles className="w-5 h-5 text-nice-gold" />,
      content: {
        type: "gratitude",
        title: "Gratidão a Deus por tudo",
        description: [
          "Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos. (Provérbios 16:3)",
          "Agradecemos a cada cliente e amigo que faz parte desse sonho adoçando vidas em Recife!",
        ],
      },
    },
    {
      id: "pagamento",
      title: "Formas Pgtos",
      subtitle: "Praticidade",
      icon: <CreditCard className="w-5 h-5 text-nice-wine" />,
      content: {
        type: "payment",
        title: "Facilidade e Segurança",
        description: [
          "Aceitamos PIX direto sem taxas (envio do comprovante com 1 toque no WhatsApp).",
          "Dinheiro com troco informado no pedido.",
          "Cartões de débito e crédito na retirada.",
        ],
      },
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-3">
      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
        {stories.map((story) => (
          <button
            key={story.id}
            onClick={() => setActiveStory(story)}
            className="flex flex-col items-center flex-shrink-0 group focus:outline-none"
          >
            <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-nice-pink via-nice-gold to-pink-300 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-1 shadow-sm">
                <div className="w-full h-full rounded-full bg-nice-pink-light/50 flex items-center justify-center">
                  {story.icon}
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-nice-wine mt-1.5 truncate max-w-[76px] text-center">
              {story.title}
            </span>
          </button>
        ))}
      </div>

      {/* Modal de Exibição do Destaque / Story */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border-2 border-pink-100 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveStory(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-nice-wine rounded-full hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-nice-pink-light rounded-full text-nice-pink">
                {activeStory.icon}
              </div>
              <div>
                <h3 className="font-bold text-nice-wine text-lg">
                  {activeStory.content.title}
                </h3>
                <p className="text-xs text-nice-pink font-medium">
                  Nice Doce Sabor • Recife-PE
                </p>
              </div>
            </div>

            {activeStory.content.type === "testimonials" ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {DEFAULT_TESTIMONIALS.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl bg-nice-pink-light/40 border border-pink-100"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-nice-wine">
                        {t.customer_name}
                      </span>
                      <span className="text-xs text-nice-gold">{"★".repeat(t.rating)}</span>
                    </div>
                    <p className="text-xs text-gray-700 italic">"{t.message}"</p>
                    <span className="inline-block mt-1 text-[10px] text-nice-pink font-medium">
                      #{t.tag}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                {activeStory.content.description.map((p, idx) => (
                  <p key={idx} className="bg-nice-blush p-3 rounded-2xl border border-pink-50">
                    {p}
                  </p>
                ))}
              </div>
            )}

            <div className="mt-6 pt-3 border-t border-pink-100 flex justify-end">
              <button
                onClick={() => setActiveStory(null)}
                className="px-5 py-2 rounded-full bg-nice-pink hover:bg-nice-pink-hover text-white text-xs font-semibold shadow-sm transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
