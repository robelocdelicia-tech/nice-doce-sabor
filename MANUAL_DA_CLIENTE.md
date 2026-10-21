# 🧁 Manual Prático da Confeitaria — Nice Doce Sabor
**Proprietária:** Eunice Pereira  
**WhatsApp da Loja:** (81) 98889-6169 (`5581988896169`)  
**E-mail de Acesso ao Admin:** `nicedocesabor@gmail.com`  
**Cidade:** Recife - PE  

---

## 1. Visão Geral do Cardápio Digital (Lado do Cliente)

O novo sistema substitui o link antigo com uma experiência visual de confeitaria de luxo:

1. **Acesso Fácil:** O cliente clica no link na bio do Instagram (`@nice.doce.sabor`) ou recebe no WhatsApp.
2. **Organização por Seções no Topo:**
   - Categorias visíveis e clicáveis: **Doces**, **Bolo no pote**, **Fatias**, **Cones trufados**, **Salgados**, **Kits Festa** e **Bebidas**.
   - Todos os sabores e preços estão abertos na tela com botões `− [qtd] +` para adicionar múltiplos sabores no mesmo pedido.
3. **Banners de Anúncios e Promoções:**
   - Carrossel no topo destacando novidades, kits promocionais e encomendas.
4. **Modo Claro & Modo Escuro "Luxo":**
   - No topo do cardápio há o botão **"Modo Luxo ✨"** que alterna entre o fundo rosa claro suave e o tema noturno nobre (vinho profundo + dourado champanhe).
5. **Finalização do Pedido:**
   - O cliente informa nome e WhatsApp.
   - Escolhe **Retirada no Local (Grátis)** ou **Entrega (Delivery)** caso ativado.
   - Escolhe a data e horário desejados para encomenda.
6. **Pagamento PIX Direto (Zero Taxas de Cartão):**
   - Na tela final, o cliente visualiza a chave PIX, clica em **"Copiar Chave PIX"** e toca no botão para **"Enviar Comprovante pelo WhatsApp"**, que já abre a conversa no WhatsApp da loja com o número do pedido e o valor.

---

## 2. Acesso ao Painel da Dona (Administrativo)

- **Endereço:** Acesse `http://localhost:3000/admin` (ou seu domínio próprio com `/admin` no final).
- **E-mail Autorizado:** `nicedocesabor@gmail.com`
- **Primeiro Acesso:** Na primeira vez que entrar, o sistema solicita o cadastro de uma Senha Mestra. Guarde essa senha com você.

---

## 3. Impressão Automática & Alerta Sonoro de Pedidos

O sistema já vem programado para trabalhar como uma central de delivery:

1. **Alerta Sonoro:** Assim que um cliente finaliza um pedido, toca um sino sonoro alegre de confeitaria para alertar quem estiver na cozinha ou no balcão.
2. **Impressão Automática:** Se o botão **"Impressão Auto: LIGADA ✅"** estiver ativo no topo, a comanda térmica (modelo 58mm ou 80mm) é enviada automaticamente para impressão sem você precisar procurar o pedido.
3. **Botão "Testar Cupom":** No topo do painel, clique em "Testar Cupom" a qualquer momento para verificar o alinhamento da sua impressora térmica.
4. **Impressão 100% Silenciosa (Sem janelinha de confirmação):**
   - No computador do balcão, crie um atalho do Google Chrome.
   - Clique com botão direito no atalho > **Propriedades**.
   - No campo **Destino**, dê um espaço e cole: `--kiosk --kiosk-printing http://localhost:3000/admin`
   - Pronto! O Chrome abrirá em tela cheia e imprimirá direto na bobina térmica em menos de 1 segundo!

---

## 4. Gerenciamento das Abas do Painel

### 4.1 Central de Pedidos (Aba "Pedidos")
- Visualize todos os pedidos recebidos, com data, hora, itens e sabores escolhidos.
- **Botão "Conferir Comprovante e Marcar como Pago ✅":** Dá baixa no pagamento do pedido.
- **Botão "Pronto (Avisar)":** Com 1 clique, abre o WhatsApp do cliente com uma mensagem carinhosa avisando que a encomenda está pronta para retirada!
- **Botão "Saiu Entrega":** Avisa o cliente no WhatsApp que o motoboy acabou de sair.
- **Botão "Editar Pedido":** Permite ajustar valores, observações e dados do cliente.
- **Botão "Reimprimir":** Emite uma nova via da comanda térmica.

### 4.2 Catálogo & Fotos (Aba "Produtos & Importador")
- **Novo Produto:** Clique no botão rosa "+ Novo Produto".
- **Foto do Celular ou Computador:** O botão **"📸 Escolher Foto"** abre a câmera ou a galeria do celular (ou os arquivos do PC). O sistema comprime a foto automaticamente em alta resolução leve para o cardápio carregar instantaneamente nos celulares dos clientes.
- **Edição de Preços e Sabores:** Clique no ícone de lápis de qualquer produto para alterar preço base, adicionar novos sabores com preços individuais ou trocar a foto.

### 4.3 Banners & Promoções (Aba "Banners & Promoções")
- Crie ou edite anúncios que passam no carrossel do cardápio público.
- Escolha o título (ex.: *"Kit Festa em Promoção"*), o texto de destaque, a foto e o botão de ação rápida.
- Ative ou desative qualquer banner com uma simples chave.

### 4.4 Bairros & Fretes (Aba "Bairros & Fretes")
- **Situação Atual da Loja:** A entrega começa **Desativada** porque a loja opera com Retirada no Local.
- **Quando tiver Entregador:** Basta clicar no botão **"Entrega Ativada ✅"**.
- **Cadastro de Bairros:** Cadastre os bairros atendidos em Recife com a taxa de frete correspondente (ex.: *Boa Viagem - R$ 12,00*, *Madalena - R$ 10,00*). Há também um botão que carrega sugestões prontas de bairros de Recife com 1 clique!

### 4.5 Financeiro & Relatórios (Aba "Financeiro & Relatórios")
- Acompanhe o Faturamento Total, Quantidade de Pedidos, Ticket Médio e Cancelamentos.
- **Exportação CSV:** Baixe uma planilha completa em Excel/CSV de todos os pedidos para controle contábil.
- **Zerar Financeiro (Segurança Total):** Permite reiniciar o histórico com dupla confirmação (exige digitar a palavra "ZERAR" e baixa um backup antes de limpar).

### 4.6 Configurações da Loja (Aba "Configurações da Loja")
- Altere o Nome da Confeitaria, WhatsApp Oficial, Instagram, Cidade e Endereço de Retirada.
- Altere a sua Chave PIX e nome do titular a qualquer momento. Todas as telas dos clientes e do checkout sincronizam instantaneamente!
