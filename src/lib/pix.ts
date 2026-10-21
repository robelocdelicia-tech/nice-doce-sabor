// =========================================================================
// GERADOR DE PAYLOAD PIX (BR CODE ESTÁTICO / DINÂMICO 0% TAXA - BACEN)
// Gera a linha "Copia e Cola" e prepara o código para renderização de QR Code
// =========================================================================

interface PixParams {
  key: string;
  name: string;
  city: string;
  amount?: number;
  txid?: string;
}

function normalizeText(text: string, maxLength: number): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .slice(0, maxLength);
}

function formatEmv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function calculateCrc16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function generatePixCopiaECola({
  key,
  name,
  city,
  amount,
  txid = "***",
}: PixParams): string {
  const cleanKey = key.trim();
  const cleanName = normalizeText(name || "Nice Doce Sabor", 25);
  const cleanCity = normalizeText(city || "Recife", 15);
  const cleanTxid = normalizeText(txid, 25) || "***";

  // 00 - Payload Format Indicator
  let payload = formatEmv("00", "01");

  // 26 - Merchant Account Information (GUI: br.gov.bcb.pix + Chave)
  const gui = formatEmv("00", "br.gov.bcb.pix");
  const keyField = formatEmv("01", cleanKey);
  payload += formatEmv("26", `${gui}${keyField}`);

  // 52 - Merchant Category Code
  payload += formatEmv("52", "0000");

  // 53 - Transaction Currency (986 = Real Brasileiro)
  payload += formatEmv("53", "986");

  // 54 - Transaction Amount (se informado)
  if (amount && amount > 0) {
    const formattedAmount = amount.toFixed(2);
    payload += formatEmv("54", formattedAmount);
  }

  // 58 - Country Code
  payload += formatEmv("58", "BR");

  // 59 - Merchant Name
  payload += formatEmv("59", cleanName);

  // 60 - Merchant City
  payload += formatEmv("60", cleanCity);

  // 62 - Additional Data Field Template (TxID)
  const txidField = formatEmv("05", cleanTxid);
  payload += formatEmv("62", txidField);

  // 63 - CRC16 (Calculado sobre o payload + '6304')
  payload += "6304";
  const crc = calculateCrc16(payload);

  return `${payload}${crc}`;
}
