# 🚀 Guia Definitivo de Publicação: Supabase + Netlify
**Projeto:** Nice Doce Sabor — Cardápio Digital & Sistema de Encomendas  
**Destino:** Produção (Venda para Cliente Real)  

---

## 📋 Sumário dos Passos
1. [Criar Banco no Supabase & Rodar o Script SQL](#passo-1-supabase)
2. [Subir o Repositório no GitHub](#passo-2-github)
3. [Conectar e Publicar na Netlify](#passo-3-netlify)
4. [Configurar Domínio Próprio e SSL](#passo-4-domínio-próprio)
5. [Checklist Final de Entrega para a Cliente](#passo-5-checklist-final)

---

## Passo 1: Supabase (Banco de Dados em 2 Minutos)

1. Acesse [https://supabase.com](https://supabase.com) e crie uma conta gratuita (ou faça login com GitHub).
2. Clique no botão **"New Project"**.
3. Preencha os dados:
   - **Name:** `nice-doce-sabor` (ou o nome que preferir)
   - **Database Password:** Defina uma senha forte e anote.
   - **Region:** Escolha `South America (São Paulo)` para menor latência no Brasil.
   - Clique em **"Create new project"** e aguarde cerca de 1 minuto até a inicialização.
4. No menu lateral esquerdo do Supabase, clique em **SQL Editor** (ícone de terminal `>_`).
5. Clique em **"New Query"**.
6. Abra o arquivo `supabase/schema.sql` deste projeto, copie todo o conteúdo e cole no SQL Editor.
7. Clique no botão verde **"Run"** (no canto inferior direito).
   - *Pronto! Todas as 9 tabelas, as regras de segurança (RLS), o catálogo inicial com trufas, bolos, salgados e os bairros de Recife foram criados!*
8. No menu lateral esquerdo, vá em **Project Settings** (ícone de engrenagem) > **API**.
9. Guarde os seguintes valores:
   - **Project URL:** Exemplo: `https://xyzproject.supabase.co`
   - **anon / public key:** Chave longa que começa com `eyJhbGciOi...`

---

## Passo 2: GitHub (Subir o Código)

O repositório local já está 100% inicializado e commitado no branch `main`! Para enviar ao seu GitHub:

1. Acesse [https://github.com/new](https://github.com/new) e crie um novo repositório (ex.: `nice-doce-sabor`).
   - Deixe desmarcada a opção de inicializar com README (o projeto já tem tudo pronto).
2. No seu computador, abra o terminal na pasta do projeto e rode:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/nice-doce-sabor.git
   git branch -M main
   git push -u origin main
   ```

---

## Passo 3: Netlify (Deploy com 1 Clique)

1. Acesse [https://www.netlify.com](https://www.netlify.com) e faça login.
2. No painel principal, clique no botão **"Add new site"** > **"Import an existing project"**.
3. Selecione **GitHub** e autorize o acesso ao seu repositório `nice-doce-sabor`.
4. As configurações de build serão preenchidas automaticamente pelo arquivo `netlify.toml` do projeto:
   - **Base directory:** (deixe vazio)
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. Clique na seção **"Environment variables"** (ou configure logo após em *Site configuration > Environment variables*):
   Adicione as variáveis copiadas do Supabase no Passo 1:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://seu-projeto.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sua-anon-key-aqui`
   - `VITE_SUPABASE_URL` = `https://seu-projeto.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sua-anon-key-aqui`
6. Clique no botão **"Deploy nice-doce-sabor"**.
7. O Netlify fará o download das dependências, executará a compilação de produção e colocará seu site no ar em cerca de 1 a 2 minutos com uma URL rápida terminada em `.netlify.app`!

---

## Passo 4: Domínio Próprio (Ex.: `nicedocesabor.com.br`)

Para entregar um produto profissional de luxo à cliente:

1. No painel do site na Netlify, vá em **Domain management** > **Add a domain**.
2. Digite o domínio comprado pela cliente (ex.: `nicedocesabor.com.br` no Registro.br).
3. Siga as instruções do painel para configurar o DNS:
   - **Entrada A:** Apontando para o IP da Netlify (`75.2.60.5`)
   - **Entrada CNAME (www):** Apontando para `seu-site.netlify.app`
4. A Netlify ativa o certificado **SSL HTTPS (cadeado verde)** gratuitamente em poucos minutos via Let's Encrypt!

---

## Passo 5: Checklist Final de Entrega para a Eunice

Antes de entregar as chaves para a dona da confeitaria:

- [ ] **Teste no Celular:** Acesse o link no smartphone e verifique a rolagem das categorias e fotos.
- [ ] **Modo Luxo:** Toque no botão "Modo Luxo ✨" no topo e teste a transição noturna.
- [ ] **Pedido de Teste:** Adicione uma trufa, bolo no pote e kit festa. Finalize informando nome e WhatsApp.
- [ ] **WhatsApp:** Verifique se o botão "Finalizar Pedido" abre a conversa no WhatsApp correto: `5581988896169`.
- [ ] **Acesso ao Painel Admin:** Acesse `/admin` com `nicedocesabor@gmail.com`. Defina a senha mestra no primeiro acesso.
- [ ] **Entrega do Manual:** Entregue o arquivo `MANUAL_DA_CLIENTE.md` impresso ou em PDF para a dona Eunice Pereira.
