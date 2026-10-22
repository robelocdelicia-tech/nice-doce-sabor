import fs from "fs";
import path from "path";
import os from "os";
import { spawnSync } from "child_process";
import QRCode from "qrcode";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

// Diretórios de Saída
const desktopFolder = "C:\\Users\\Roberto\\Desktop\\Cardapio_Nice_Doce_Sabor";
const projectFolder = path.join(projectRoot, "arquivos_whatsapp_nice");

[desktopFolder, projectFolder].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log("Gerando Kit de Cardápio e QR Code para Nice Doce Sabor...");
console.log("Destino 1 (Área de Trabalho):", desktopFolder);
console.log("Destino 2 (Projeto):", projectFolder);

const menuUrl = "https://nicedocesabor.com.br";
const store = {
  name: "Nice Doce Sabor",
  owner: "Eunice Pereira",
  phone: "(81) 98889-6169",
  whatsapp_raw: "5581988896169",
  instagram: "@nice.doce.sabor",
  city: "Recife - PE",
  pix_key: "81988896169",
  schedule: "Quarta a Segunda das 12h às 19h (Terça Fechado)"
};

// 1. Carrega Logo em Base64 para os documentos serem 100% autônomos
const logoPath = path.join(projectRoot, "public", "logo.jpg");
let logoBase64 = "";
if (fs.existsSync(logoPath)) {
  const logoBuffer = fs.readFileSync(logoPath);
  logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString("base64")}`;
}

// 2. Gera QR Code em Alta Resolução (PNG)
const qrDataUrl = await QRCode.toDataURL(menuUrl, {
  width: 1200,
  margin: 1,
  color: {
    dark: "#4A122E",
    light: "#FFFFFF"
  },
  errorCorrectionLevel: "H"
});

const qrPngBuffer = await QRCode.toBuffer(menuUrl, {
  width: 1200,
  margin: 2,
  color: {
    dark: "#4A122E",
    light: "#FFFFFF"
  },
  errorCorrectionLevel: "H"
});

// Salva o PNG do QR Code puro
fs.writeFileSync(path.join(desktopFolder, "01_QR_Code_Oficial_Nice_Doce_Sabor.png"), qrPngBuffer);
fs.writeFileSync(path.join(projectFolder, "01_QR_Code_Oficial_Nice_Doce_Sabor.png"), qrPngBuffer);
console.log("✓ QR Code Oficial em Alta Resolução gerado (PNG)");

// 3. Monta HTML do Cartão Virtual de WhatsApp (1080x1080 / Quadrado de Luxo)
const cartaoVirtualHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Cartão Virtual WhatsApp - Nice Doce Sabor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #FFF5FA;
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      width: 600px;
      background: linear-gradient(145deg, #FFFFFF, #FFF0F7);
      border: 3px solid #E0489A;
      border-radius: 36px;
      padding: 36px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(91, 31, 58, 0.15);
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: "";
      position: absolute;
      top: -50px;
      right: -50px;
      width: 160px;
      height: 160px;
      background: rgba(224, 72, 154, 0.1);
      border-radius: 50%;
    }
    .logo-container {
      width: 100px;
      height: 100px;
      margin: 0 auto 12px;
      border-radius: 50%;
      border: 3px dashed #E0489A;
      padding: 4px;
      background: white;
      box-shadow: 0 4px 12px rgba(224, 72, 154, 0.2);
    }
    .logo-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }
    h1 {
      font-family: 'Great Vibes', cursive;
      font-size: 44px;
      color: #E0489A;
      line-height: 1.1;
      margin-bottom: 4px;
    }
    .slogan {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #4A122E;
      margin-bottom: 20px;
    }
    .qr-box {
      background: white;
      border: 2px solid #FBCFE8;
      border-radius: 28px;
      padding: 20px;
      display: inline-block;
      box-shadow: 0 10px 25px rgba(0,0,0,0.06);
      margin-bottom: 20px;
    }
    .qr-img {
      width: 240px;
      height: 240px;
      display: block;
    }
    .badge-pill {
      background: linear-gradient(135deg, #E0489A, #BE185D);
      color: white;
      font-weight: 800;
      font-size: 14px;
      padding: 8px 20px;
      border-radius: 999px;
      display: inline-block;
      margin-bottom: 12px;
      box-shadow: 0 4px 10px rgba(224, 72, 154, 0.3);
    }
    .instruction {
      font-size: 14px;
      font-weight: 700;
      color: #4A122E;
      line-height: 1.4;
      margin-bottom: 20px;
    }
    .footer-info {
      border-top: 1px solid #FBCFE8;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 700;
      color: #4A122E;
    }
    .whatsapp-badge {
      color: #E0489A;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-container">
      <img src="${logoBase64 || '/logo.jpg'}" alt="Logo" class="logo-img">
    </div>
    <h1>${store.name}</h1>
    <div class="slogan">Confeitaria Artesanal por ${store.owner}</div>
    
    <div class="badge-pill">Peça pelo Celular 📱✨</div>
    <div class="qr-box">
      <img src="${qrDataUrl}" alt="QR Code" class="qr-img">
    </div>
    
    <div class="instruction">
      Aponte a câmera do seu celular para o QR Code acima<br>
      para ver fotos, sabores e fazer seu pedido online!
    </div>

    <div class="footer-info">
      <div class="whatsapp-badge">💬 WhatsApp: ${store.phone}</div>
      <div>📸 ${store.instagram}</div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(desktopFolder, "02_Cartao_Virtual_WhatsApp_QRCode.html"), cartaoVirtualHtml);
fs.writeFileSync(path.join(projectFolder, "02_Cartao_Virtual_WhatsApp_QRCode.html"), cartaoVirtualHtml);

// 4. Monta HTML do Cardápio Completo A4 (Página 1 e Página 2)
const cardapioCompletoHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Cardápio de Balcão A4 - Nice Doce Sabor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #E5E7EB;
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #1F2937;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      gap: 24px;
    }
    .no-print {
      background: #FFFFFF;
      padding: 16px 24px;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 210mm;
      max-width: 100%;
    }
    .btn-print {
      background: linear-gradient(135deg, #E0489A, #BE185D);
      color: #FFFFFF;
      font-weight: 800;
      border: none;
      padding: 12px 28px;
      border-radius: 999px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(224, 72, 154, 0.3);
    }
    .a4-page {
      width: 210mm;
      height: 297mm;
      min-height: 297mm;
      max-height: 297mm;
      background: #FFFFFF;
      padding: 12mm;
      box-shadow: 0 10px 30px rgba(0,0,0,0.12);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .dashed-border {
      position: absolute;
      inset: 8mm;
      border: 1.5px dashed #FBCFE8;
      border-radius: 16px;
      pointer-events: none;
    }
    .header-p1 {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #FBCFE8;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-disc {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      border: 2px dashed #E0489A;
      padding: 2px;
      background: white;
    }
    .logo-disc img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }
    .brand-title {
      font-family: 'Great Vibes', cursive;
      font-size: 38px;
      color: #E0489A;
      line-height: 1;
    }
    .brand-subtitle {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #4A122E;
      margin-top: 2px;
    }
    .brand-meta {
      font-size: 9.5px;
      color: #6B7280;
      margin-top: 3px;
    }
    .header-qr {
      background: #FFF5FA;
      border: 1px solid #FBCFE8;
      border-radius: 14px;
      padding: 8px 12px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .header-qr img {
      width: 62px;
      height: 62px;
      border-radius: 6px;
    }
    .qr-label {
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #4A122E;
      margin-top: 3px;
    }
    .grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      flex: 1;
    }
    .menu-box {
      background: #FFFDFE;
      border: 1px solid #FCE7F3;
      border-radius: 14px;
      padding: 10px 12px;
      margin-bottom: 12px;
    }
    .menu-box-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #4A122E;
      border-bottom: 1.5px solid #FBCFE8;
      padding-bottom: 4px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge-tag {
      font-size: 8.5px;
      font-weight: 700;
      color: #E0489A;
      background: #FFF0F7;
      padding: 2px 6px;
      border-radius: 6px;
      border: 1px solid #FBCFE8;
    }
    .menu-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 6px;
      margin-bottom: 6px;
      border-bottom: 1px solid #FFF0F7;
    }
    .menu-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .item-name {
      font-size: 11px;
      font-weight: 700;
      color: #111827;
      line-height: 1.2;
    }
    .item-desc {
      font-size: 9px;
      color: #6B7280;
      line-height: 1.2;
      margin-top: 1px;
    }
    .item-price {
      font-size: 11.5px;
      font-weight: 800;
      color: #E0489A;
      white-space: nowrap;
      margin-left: 8px;
    }
    .footer-bar {
      border-top: 2px solid #FBCFE8;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      font-weight: 600;
      color: #4A122E;
    }
    .highlight-kit {
      background: linear-gradient(135deg, #FFF0F7, #FEF3C7);
      border: 1px solid #FBCFE8;
      border-radius: 8px;
      padding: 6px 8px;
      margin-top: 4px;
    }
    @media print {
      body {
        background: #FFFFFF !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .a4-page {
        margin: 0 !important;
        box-shadow: none !important;
        page-break-after: always !important;
        break-after: page !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .a4-page:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <div>
      <h2 style="color: #4A122E; font-size: 16px; font-weight: 800;">Cardápio de Balcão Pronto para Impressão (A4)</h2>
      <p style="font-size: 12px; color: #6B7280;">Página 1 (Doces & Bolos) e Página 2 (Salgados, Kits Festa & Bebidas)</p>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar em PDF (A4)</button>
  </div>

  <!-- PÁGINA 1: DOCES, BOLO NO POTE, FATIAS & CONES -->
  <div class="a4-page">
    <div class="dashed-border"></div>
    <div>
      <div class="header-p1">
        <div class="header-left">
          <div class="logo-disc">
            <img src="${logoBase64 || '/logo.jpg'}" alt="Logo">
          </div>
          <div>
            <div class="brand-title">${store.name}</div>
            <div class="brand-subtitle">Confeitaria Artesanal por ${store.owner}</div>
            <div class="brand-meta">📍 ${store.city} (Retirada no Local) • 🕒 ${store.schedule}</div>
          </div>
        </div>
        <div class="header-qr">
          <img src="${qrDataUrl}" alt="QR Code">
          <div class="qr-label">Peça pelo Celular</div>
        </div>
      </div>

      <div class="grid-2col">
        <!-- Coluna 1: Doces e Cones -->
        <div>
          <div class="menu-box">
            <div class="menu-box-title">
              <span>✨ Doces Artesanais</span>
              <span class="badge-tag">Feito à Mão</span>
            </div>
            <div class="menu-item">
              <div>
                <div class="item-name">Trufas Artesanais Nobres</div>
                <div class="item-desc">Brigadeiro, Beijinho, Uva, Café, Maracujá, Morango, Dois Amores</div>
              </div>
              <div class="item-price">R$ 4,00</div>
            </div>
            <div class="menu-item">
              <div>
                <div class="item-name">Tortinha Doce Individual</div>
                <div class="item-desc">Massa crocante amanteigada com recheio especial</div>
              </div>
              <div class="item-price">R$ 6,00</div>
            </div>
            <div class="menu-item">
              <div>
                <div class="item-name">Brownie Tradicional de Cacau</div>
                <div class="item-desc">Macio por dentro e com casquinha crocante irresistível</div>
              </div>
              <div class="item-price">R$ 5,00</div>
            </div>
            <div class="menu-item">
              <div>
                <div class="item-name">Brownie Recheado Especial</div>
                <div class="item-desc">Recheio nobre de brigadeiro branco e chocolate</div>
              </div>
              <div class="item-price">R$ 8,00</div>
            </div>
            <div class="menu-item">
              <div>
                <div class="item-name">Pudim de Leite Condensado</div>
                <div class="item-desc">Super lisinho e aveludado com calda de caramelo</div>
              </div>
              <div class="item-price">R$ 6,00</div>
            </div>
            <div class="menu-item">
              <div>
                <div class="item-name">Bombom de Uva na Taça</div>
                <div class="item-desc">Brigadeiro branco, uvas verdes frescas e chocolate</div>
              </div>
              <div class="item-price">R$ 13,00</div>
            </div>
            <div class="menu-item">
              <div>
                <div class="item-name">Bombom de Brownie na Taça</div>
                <div class="item-desc">Pedaços de brownie banhados em creme nobre</div>
              </div>
              <div class="item-price">R$ 13,00</div>
            </div>
            <div class="menu-item">
              <div>
                <div class="item-name">Torta Gelada de Abacaxi</div>
                <div class="item-desc">Fatia artesanal refrescante com creme confeiteiro</div>
              </div>
              <div class="item-price">R$ 13,00</div>
            </div>
            <div class="menu-item">
              <div>
                <div class="item-name">Bolo Vulcão de Brigadeiro</div>
                <div class="item-desc">Bolo fofinho com avalanche que escorre ao cortar</div>
              </div>
              <div class="item-price">R$ 17,00</div>
            </div>
          </div>

          <div class="menu-box">
            <div class="menu-box-title">
              <span>🍦 Cones Trufados</span>
              <span class="badge-tag">R$ 8,00</span>
            </div>
            <div class="item-desc" style="margin-bottom: 6px;">Casquinha de sorvete crocante banhada e recheada até a pontinha.</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; font-weight: 700; color: #4A122E;">
              <div style="background: #FFF5FA; padding: 4px 6px; border-radius: 6px;">• Brigadeiro Nobre</div>
              <div style="background: #FFF5FA; padding: 4px 6px; border-radius: 6px;">• Ninho com Nutella</div>
            </div>
          </div>
        </div>

        <!-- Coluna 2: Bolos no Pote e Fatias -->
        <div>
          <div class="menu-box">
            <div class="menu-box-title">
              <span>🍰 Bolo no Pote Artesanal</span>
              <span class="badge-tag">Mais Pedido</span>
            </div>
            <div class="item-desc" style="margin-bottom: 8px;">Camadas generosas de bolo artesanal úmido com cremes nobres.</div>

            <div style="font-size: 9.5px; font-weight: 800; color: #E0489A; margin-bottom: 4px; text-transform: uppercase;">
              SABORES ESPECIAIS — R$ 10,00 CADA
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px; font-size: 9.5px; color: #374151; margin-bottom: 8px;">
              <div>• Prestígio</div>
              <div>• Choconinho c/ Nutella</div>
              <div>• Brigadeiro Intenso</div>
              <div>• Ninho com Nutella</div>
              <div>• Cenoura c/ Chocolate</div>
              <div>• Doce de Leite c/ Beijinho</div>
              <div>• Chocolate c/ Maracujá</div>
              <div>• Limão Refrescante</div>
              <div>• Maracujá Cremoso</div>
            </div>

            <div style="border-top: 1px dashed #FBCFE8; padding-top: 6px;">
              <div style="font-size: 9.5px; font-weight: 800; color: #BE185D; margin-bottom: 3px; text-transform: uppercase;">
                SABORES COM MORANGO — R$ 12,00 CADA
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px; font-size: 9.5px; font-weight: 600; color: #374151;">
                <div>🍓 Ninho com Morango</div>
                <div>🍓 Choconinho c/ Morango</div>
              </div>
            </div>
          </div>

          <div class="menu-box">
            <div class="menu-box-title">
              <span>🎂 Fatias de Bolo de Festa</span>
              <span class="badge-tag">R$ 14,00</span>
            </div>
            <div class="item-desc" style="margin-bottom: 6px;">Fatia farta de bolo com massa fofinha e camadas nobres de recheio.</div>
            <div class="menu-item">
              <div>
                <div class="item-name">• Prestígio com Chocolate</div>
              </div>
              <div class="item-price">R$ 14,00</div>
            </div>
            <div class="menu-item">
              <div>
                <div class="item-name">• Brigadeiro Belga Tradicional</div>
              </div>
              <div class="item-price">R$ 14,00</div>
            </div>
            <div class="menu-item">
              <div>
                <div class="item-name">• Ninho com Geleia de Morango</div>
              </div>
              <div class="item-price">R$ 14,00</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>📞 WhatsApp: <strong>${store.phone}</strong> • 📸 Instagram: <strong>${store.instagram}</strong></div>
      <div>Página 1 de 2 • Doces & Bolos</div>
    </div>
  </div>

  <!-- PÁGINA 2: SALGADOS, KITS FESTA & BEBIDAS -->
  <div class="a4-page">
    <div class="dashed-border"></div>
    <div>
      <div class="header-p1">
        <div class="header-left">
          <div class="logo-disc">
            <img src="${logoBase64 || '/logo.jpg'}" alt="Logo">
          </div>
          <div>
            <div class="brand-title">${store.name}</div>
            <div class="brand-subtitle">Salgados de Festa, Kits & Bebidas</div>
            <div class="brand-meta">📍 ${store.city} • 💬 WhatsApp: ${store.phone}</div>
          </div>
        </div>
        <div class="header-qr">
          <img src="${qrDataUrl}" alt="QR Code">
          <div class="qr-label">Peça Online</div>
        </div>
      </div>

      <div class="grid-2col">
        <!-- Coluna 1: Salgados e Bebidas -->
        <div>
          <div class="menu-box">
            <div class="menu-box-title">
              <span>🥟 Salgados Fritos na Hora</span>
              <span class="badge-tag">Sequinhos</span>
            </div>
            <div class="item-desc" style="margin-bottom: 6px;">Coxinhas, bolinhas de queijo, kibe e risoles fritos na hora.</div>
            <div class="menu-item">
              <div class="item-name">Porção com 15 salgados</div>
              <div class="item-price">R$ 17,00</div>
            </div>
            <div class="menu-item">
              <div class="item-name">Porção com 25 salgados</div>
              <div class="item-price">R$ 27,00</div>
            </div>
            <div class="menu-item">
              <div class="item-name">Porção com 50 salgados</div>
              <div class="item-price">R$ 52,50</div>
            </div>
            <div class="menu-item" style="background: #FFF5FA; padding: 4px; border-radius: 6px;">
              <div class="item-name"><strong>Cento de Salgados (100 unidades)</strong></div>
              <div class="item-price">R$ 95,00</div>
            </div>
            <div style="border-top: 1px dashed #FBCFE8; padding-top: 6px; margin-top: 6px;">
              <div class="menu-item">
                <div class="item-name">Empada de Frango Artesanal</div>
                <div class="item-price">R$ 7,00</div>
              </div>
              <div class="menu-item">
                <div class="item-name">Empada de Charque c/ Requeijão</div>
                <div class="item-price">R$ 10,00</div>
              </div>
              <div class="menu-item">
                <div class="item-name">Empadão de Frango Farto</div>
                <div class="item-price">R$ 13,00</div>
              </div>
              <div class="menu-item">
                <div class="item-name">Salgadinho no Pacote (Queijo / Cebola)</div>
                <div class="item-price">R$ 6,00</div>
              </div>
            </div>
          </div>

          <div class="menu-box">
            <div class="menu-box-title">
              <span>🥤 Bebidas Geladas</span>
              <span class="badge-tag">Refrescante</span>
            </div>
            <div class="menu-item">
              <div>
                <div class="item-name">Sucos Naturais da Polpa (500ml)</div>
                <div class="item-desc">Maracujá, Acerola, Cajá, Caju, Graviola, Manga</div>
              </div>
              <div class="item-price">R$ 6 / R$ 7</div>
            </div>
            <div class="menu-item">
              <div class="item-name">Refrigerante Mini 200ml (Guaraná/Fanta)</div>
              <div class="item-price">R$ 3,50</div>
            </div>
            <div class="menu-item">
              <div class="item-name">Refrigerante Mini 200ml (Coca Normal/Zero)</div>
              <div class="item-price">R$ 4,00</div>
            </div>
            <div class="menu-item">
              <div class="item-name">Refrigerante Lata 350ml (Coca/Antarctica)</div>
              <div class="item-price">R$ 6,00</div>
            </div>
            <div class="menu-item">
              <div class="item-name">Coca-Cola 1,5L Garrafa Família</div>
              <div class="item-price">R$ 10,00</div>
            </div>
            <div class="menu-item">
              <div class="item-name">Água Mineral 500ml Sem Gás</div>
              <div class="item-price">R$ 2,00</div>
            </div>
          </div>
        </div>

        <!-- Coluna 2: Kits Festa e Pagamento -->
        <div>
          <div class="menu-box" style="border: 1.5px solid #E0489A;">
            <div class="menu-box-title">
              <span>🎉 Kits Festa & Combos</span>
              <span class="badge-tag" style="background: #E0489A; color: white;">Festa Pronta</span>
            </div>
            <div class="menu-item">
              <div>
                <div class="item-name">Kit Delícia 2 Pessoas</div>
                <div class="item-desc">Salgados artesanais + docinhos finos</div>
              </div>
              <div class="item-price">R$ 35,00</div>
            </div>
            <div class="menu-item">
              <div>
                <div class="item-name">Combo Festa Individual</div>
                <div class="item-desc">Bolo de 350g + 10 coxinhas + 10 brigadeiros</div>
              </div>
              <div class="item-price">R$ 49,99</div>
            </div>
            <div class="menu-item">
              <div>
                <div class="item-name">Kit Festa Só 1 Bolinho</div>
                <div class="item-desc">1 Bolo Vulcão + 20 doces + 30 salgados</div>
              </div>
              <div class="item-price">R$ 99,99</div>
            </div>
            <div class="menu-item">
              <div>
                <div class="item-name">Kit Surpresa Presente (500g)</div>
                <div class="item-desc">1 Bolo Vulcão 500g + 20 doces + 30 salgados</div>
              </div>
              <div class="item-price">R$ 99,99</div>
            </div>
            <div class="menu-item">
              <div>
                <div class="item-name">Kit Só um Bolinho Grande</div>
                <div class="item-desc">Bolo 1kg decorado + 50 doces + 100 salgados</div>
              </div>
              <div class="item-price">R$ 249,99</div>
            </div>
            <div class="highlight-kit">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="item-name" style="color: #831843;"><strong>Kit Completo (25 pessoas) 🎁</strong></div>
                <div class="item-price">R$ 454,99</div>
              </div>
              <div class="item-desc" style="color: #4A122E; font-weight: 600;">
                2kg de bolo decorado + 100 doces + 150 salgados + <strong>1 vela vulcão grátis!</strong>
              </div>
            </div>
          </div>

          <div class="menu-box" style="background: #FFF5FA; font-size: 10px;">
            <div style="font-weight: 800; color: #4A122E; margin-bottom: 4px;">⏰ Prazos de Encomenda:</div>
            <div style="color: #4B5563; line-height: 1.3; margin-bottom: 8px;">
              Combos individuais com 24h e kits grandes com 48h de antecedência.
            </div>
            <div style="font-weight: 800; color: #4A122E; margin-bottom: 4px;">💳 Formas de Pagamento:</div>
            <div style="color: #4B5563; line-height: 1.3;">
              • <strong>PIX Direto sem taxas:</strong> Chave ${store.pix_key}<br>
              • Dinheiro com troco informado no pedido<br>
              • Cartões de Débito e Crédito na retirada
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>📞 Faça sua Encomenda no WhatsApp: <strong>${store.phone}</strong></div>
      <div>Página 2 de 2 • Salgados & Kits Festa</div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(desktopFolder, "03_Cardapio_Completo_A4.html"), cardapioCompletoHtml);
fs.writeFileSync(path.join(projectFolder, "03_Cardapio_Completo_A4.html"), cardapioCompletoHtml);

// 5. Monta HTML das Plaquinhas de Mesa e Balcão (Folha A4 com 4 Plaquinhas)
const plaquinhasHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Plaquinhas de Mesa & Balcão A4 - Nice Doce Sabor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Plus+Jakarta+Sans:wght@500;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #E5E7EB;
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      gap: 20px;
    }
    .no-print {
      background: white;
      padding: 16px 24px;
      border-radius: 16px;
      width: 210mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .btn-print {
      background: linear-gradient(135deg, #E0489A, #BE185D);
      color: white;
      font-weight: 800;
      border: none;
      padding: 12px 28px;
      border-radius: 999px;
      cursor: pointer;
      font-size: 14px;
    }
    .a4-page {
      width: 210mm;
      height: 297mm;
      min-height: 297mm;
      max-height: 297mm;
      background: white;
      padding: 10mm;
      box-shadow: 0 10px 30px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .page-title {
      border-bottom: 1.5px solid #FBCFE8;
      padding-bottom: 6px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .grid-plaquinhas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      flex: 1;
    }
    .plaquinha-card {
      border: 2px dashed #E0489A;
      border-radius: 24px;
      background: linear-gradient(145deg, #FFFFFF, #FFF5FA);
      padding: 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }
    .scissor-tag {
      position: absolute;
      top: -10px;
      right: 16px;
      background: white;
      border: 1px solid #E0489A;
      padding: 1px 8px;
      border-radius: 999px;
      font-size: 8px;
      font-weight: 800;
      color: #E0489A;
    }
    .plaquinha-logo {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 2px dashed #E0489A;
      padding: 2px;
      background: white;
      margin-bottom: 4px;
    }
    .plaquinha-logo img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }
    .brand-name {
      font-family: 'Great Vibes', cursive;
      font-size: 26px;
      color: #E0489A;
      line-height: 1;
    }
    .brand-sub {
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #4A122E;
    }
    .pill-chamada {
      background: #E0489A;
      color: white;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 3px 12px;
      border-radius: 999px;
      margin: 6px 0;
    }
    .qr-box {
      background: white;
      padding: 8px;
      border-radius: 16px;
      border: 1.5px solid #FBCFE8;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
      margin: 4px 0;
    }
    .qr-box img {
      width: 110px;
      height: 110px;
      display: block;
    }
    .instruction-text {
      font-size: 9px;
      font-weight: 700;
      color: #4A122E;
      line-height: 1.3;
      max-width: 180px;
    }
    .plaquinha-footer {
      width: 100%;
      border-top: 1px solid #FBCFE8;
      padding-top: 6px;
      margin-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      font-weight: 700;
      color: #4A122E;
    }
    @media print {
      body {
        background: white !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .a4-page {
        margin: 0 !important;
        box-shadow: none !important;
        page-break-after: always !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <div>
      <h2 style="color: #4A122E; font-size: 16px; font-weight: 800;">Plaquinhas Recortáveis de Mesa & Balcão (A4)</h2>
      <p style="font-size: 12px; color: #6B7280;">Folha com 4 plaquinhas para displays de mesa ou balcão da loja</p>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir Plaquinhas A4</button>
  </div>

  <div class="a4-page">
    <div class="page-title">
      <div style="font-size: 12px; font-weight: 800; color: #4A122E;">✂️ FOLHA DE CORTE: 4 PLAQUINHAS PARA MESA & BALCÃO</div>
      <div style="font-size: 10px; color: #E0489A; font-weight: 700;">Nice Doce Sabor • Recife-PE</div>
    </div>

    <div class="grid-plaquinhas">
      ${[1, 2, 3, 4]
        .map(
          (i) => `
      <div class="plaquinha-card">
        <div class="scissor-tag">✂️ recorte aqui</div>
        <div class="plaquinha-logo">
          <img src="${logoBase64 || '/logo.jpg'}" alt="Logo">
        </div>
        <div class="brand-name">${store.name}</div>
        <div class="brand-sub">Confeitaria Artesanal</div>

        <div class="pill-chamada">Peça pelo Celular 📱✨</div>

        <div class="qr-box">
          <img src="${qrDataUrl}" alt="QR Code">
        </div>

        <div class="instruction-text">
          Aponte a câmera do seu celular para ver fotos, preços e fazer seu pedido online!
        </div>

        <div class="plaquinha-footer">
          <div>💬 ${store.phone}</div>
          <div>📸 ${store.instagram}</div>
        </div>
      </div>
      `
        )
        .join("")}
    </div>

    <div style="font-size: 9px; color: #9CA3AF; text-align: center; border-top: 1px solid #F3F4F6; padding-top: 6px;">
      Dica: Recorte na linha pontilhada rosa e dobre ao meio em formato 'V' ou coloque nos suportes de acrílico das mesas.
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(desktopFolder, "04_Plaquinhas_de_Mesa_A4.html"), plaquinhasHtml);
fs.writeFileSync(path.join(projectFolder, "04_Plaquinhas_de_Mesa_A4.html"), plaquinhasHtml);

// 6. Converte os arquivos HTML para PDF real vetorizado via Microsoft Edge Headless
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
if (fs.existsSync(edgePath)) {
  console.log("Gerando arquivos PDF de alta resolução com Microsoft Edge...");

  const filesToPdf = [
    {
      html: path.join(desktopFolder, "03_Cardapio_Completo_A4.html"),
      pdfName: "03_Cardapio_Completo_Balcao_A4.pdf"
    },
    {
      html: path.join(desktopFolder, "04_Plaquinhas_de_Mesa_A4.html"),
      pdfName: "04_Plaquinhas_de_Mesa_Balcao_A4.pdf"
    }
  ];

  for (const item of filesToPdf) {
    const tempProfile = path.join(os.tmpdir(), "edge_pdf_" + Date.now() + Math.random().toString(36).substring(2, 6));
    const destDesktopPdf = path.join(desktopFolder, item.pdfName);
    const destProjectPdf = path.join(projectFolder, item.pdfName);

    const res = spawnSync(edgePath, [
      "--headless",
      "--disable-gpu",
      `--user-data-dir=${tempProfile}`,
      "--no-pdf-header-footer",
      `--print-to-pdf=${destDesktopPdf}`,
      item.html
    ], { timeout: 25000 });

    if (fs.existsSync(destDesktopPdf)) {
      fs.copyFileSync(destDesktopPdf, destProjectPdf);
      console.log(`✓ ${item.pdfName} gerado com sucesso!`);
    } else {
      console.warn(`Não foi possível gerar PDF automático para ${item.pdfName}, arquivo HTML pronto.`);
    }

    try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch (e) {}
  }
}

// 7. Mensagem Pronta para o WhatsApp da Eunice
const mensagemWhatsApp = `Olá Eunice! 💕✨
Aqui está o material completo do seu Cardápio Físico e Plaquinhas de Mesa da Nice Doce Sabor!

📄 1. Cardápio de Balcão (A4 Frente e Verso):
- Contém todos os seus doces, bolos no pote, fatias, cones, salgados fritos, empadas, empadão, kits festa completos e bebidas com os preços oficiais atualizados.
- Já vem com o seu QR Code no topo para o cliente que estiver no balcão poder ver as fotos no celular.

🏷️ 2. Plaquinhas de Mesa e Balcão (A4):
- Folha com 4 plaquinhas recortáveis com linha pontilhada ✂️.
- Você pode imprimir em papel sulfite comum ou papel couché mais durinho e colocar nos suportes de acrílico das mesinhas ou colar no balcão.
- O cliente só precisa apontar a câmera do celular para o QR Code para abrir o cardápio e fazer o pedido!

📱 3. Imagem do QR Code em Alta Resolução (PNG):
- Pode ser usado para imprimir adesivos, cartões de visita ou postar no status do WhatsApp e no Instagram!

🌐 Link direto do seu Cardápio Digital:
https://nicedocesabor.com.br

Qualquer dúvida ou se quiser ajustar algum preço ou sabor, estou à disposição! Um abraço carinhoso! 💖`;

fs.writeFileSync(path.join(desktopFolder, "05_MENSAGEM_PRONTA_WHATSAPP_PARA_EUNICE.txt"), mensagemWhatsApp, "utf-8");
fs.writeFileSync(path.join(projectFolder, "05_MENSAGEM_PRONTA_WHATSAPP_PARA_EUNICE.txt"), mensagemWhatsApp, "utf-8");

console.log("\n=======================================================");
console.log("KIT COMPLETO GERADO COM SUCESSO!");
console.log("Local 1: C:\\Users\\Roberto\\Desktop\\Cardapio_Nice_Doce_Sabor");
console.log("Local 2: " + projectFolder);
console.log("=======================================================");
