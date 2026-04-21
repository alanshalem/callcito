//#region Currency code → natural word
// TTS (11labs) lee "ARS" letra por letra. Usar "pesos" → lectura natural.
const CURRENCY_WORD: Record<string, string> = {
  ARS: "pesos",
  BRL: "reales",
  CLP: "pesos chilenos",
  COP: "pesos colombianos",
  MXN: "pesos mexicanos",
  PEN: "soles",
  UYU: "pesos uruguayos",
  USD: "dólares",
};

export function currencyWord(code: string): string {
  return CURRENCY_WORD[code] ?? code.toLowerCase();
}
//#endregion
