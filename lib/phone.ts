/**
 * Validación y normalización de teléfonos argentinos.
 * Acepta formatos comunes: "381 123-4567", "0381 15 123 4567", "+54 9 381 1234567".
 * Devuelve el número en formato internacional para WhatsApp: 549 + área + abonado.
 */
export function normalizeArgentinePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("54")) {
    digits = digits.slice(2);
    if (digits.startsWith("9")) digits = digits.slice(1);
  }
  if (digits.startsWith("0")) digits = digits.slice(1);

  // Quitar el "15" de celular que va después del código de área (2 a 4 dígitos).
  if (digits.length === 12) {
    for (const areaLen of [2, 3, 4]) {
      if (digits.slice(areaLen, areaLen + 2) === "15") {
        digits = digits.slice(0, areaLen) + digits.slice(areaLen + 2);
        break;
      }
    }
  }

  if (digits.length !== 10 || digits.startsWith("0")) return null;
  return `549${digits}`;
}

export function isValidArgentinePhone(input: string): boolean {
  return normalizeArgentinePhone(input) !== null;
}

/** "5493811234567" a "381 123-4567" (asume código de área de 3 dígitos para mostrar). */
export function formatArgentinePhone(normalized: string): string {
  const national = normalized.replace(/^549/, "");
  if (national.length !== 10) return normalized;
  return `${national.slice(0, 3)} ${national.slice(3, 6)}-${national.slice(6)}`;
}
