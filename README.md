# 🧁 Nice Doce Sabor — Cardápio Digital de Luxo & Gestão de Pedidos

Plataforma profissional de cardápio digital, e-commerce e central de pedidos sob medida para a confeitaria artesanal **Nice Doce Sabor** (Eunice Pereira) em Recife-PE.

---

## 🌟 Principais Recursos Implementados

1. **Cardápio Público de Luxo (Mobile-First):**
   - Identidade visual com a paleta oficial extraída da logo: Rosa (`#E0489A`), Vinho (`#5B1F3A`), Dourado Champanhe (`#C9A45C`) e Fundo suave (`#FFF5FA`).
   - Selo **"Aberto agora"** / **"Fechado no momento (Abre quarta às 12h)"** ciente do fechamento na terça-feira.
   - Destaques inspirados no Instagram real: *Feedback 🥰*, *Minha história*, *Gratidão 🙏* e *Formas Pgtos*.
   - Modal de produto com variações de tamanho, adicionais, observações e cálculo de preço em tempo real.
   - Suporte a adicionar o mesmo produto várias vezes com observações e tamanhos distintos.

2. **Checkout & PIX Direto (0% de Taxa):**
   - Padrão **Retirada no local** com entrega desativada por padrão.
   - Na tela final (`/pedido/[id]`), exibe a Chave PIX da loja, QR Code de transferência padrão Banco Central e o botão **"Enviar Comprovante do PIX pelo WhatsApp"**.
   - Abre o WhatsApp oficial (`5581988896169`) com a comanda e o pedido já formatados.

3. **Painel Administrativo da Dona (`/admin`):**
   - **Central de Pedidos ao Vivo:** acompanhamento em tempo real com alerta sonoro.
   - **Disparo 1-Clique WhatsApp para o Cliente:**
     - Botão *"Pronto (Avisar)"*: dispara mensagem personalizada avisando que o pedido está pronto para retirada.
     - Botão *"Saiu Entrega"*: avisa o cliente sobre a saída do pedido.
     - Botão *"Marcar como Pago ✅"*: confirmação manual ao checar o comprovante.
   - **Chave Aberto / Fechado / Automático:** reflete instantaneamente para todos os clientes.
   - **Importador em Massa:** campo para colar textos e preços do Instagram e importar vários itens de uma vez só.
   - **Impressão Térmica (58mm/80mm):** comanda formatada para modo kiosk printing do Google Chrome.
   - **Financeiro Completo:** métricas de faturamento, ticket médio, exportação em CSV e botão de zerar com dupla confirmação (`ZERAR`).

4. **Zero Quebra de Imagens em Hospedagem (Netlify e Vercel):**
   - Configuração de `remotePatterns` no `next.config.mjs` aceitando Supabase Storage e Unsplash.
   - Mecanismo de fallback visual caso alguma imagem externa falhe.

---

## 🚀 Como Executar Localmente

```bash
# 1. Acesse o diretório do projeto
cd C:\Users\Roberto\.gemini\antigravity\scratch\nice-doce-sabor

# 2. Instale as dependências (já instaladas)
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse:
- **Cardápio do Cliente:** [http://localhost:3000](http://localhost:3000)
- **Painel Administrativo:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🌐 Instruções de Deploy (Netlify e Vercel)

### Opção A: Deploy no Vercel (Recomendado para Next.js)
1. Suba este repositório para o seu GitHub.
2. Acesse [vercel.com](https://vercel.com) e clique em **"Add New Project"**.
3. Importe o repositório `nice-doce-sabor`.
4. Em **Environment Variables**, adicione as variáveis do `.env.example` (ou mantenha os padrões para teste).
5. Clique em **Deploy**.

### Opção B: Deploy no Netlify
1. Conecte o repositório no [netlify.com](https://netlify.com).
2. O Netlify detectará automaticamente o framework Next.js.
3. Certifique-se de que o plugin `@netlify/plugin-nextjs` esteja instalado caso utilize imagens dinâmicas ou ative `NEXT_PUBLIC_UNOPTIMIZED_IMAGES=true` no painel de Environment Variables do Netlify para renderização ultrarrápida sem cobrança de otimização de imagens.
