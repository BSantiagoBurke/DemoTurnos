/** Link wa.me con texto armado. `phone` en formato internacional sin "+". */
export function buildWhatsAppLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export type BookingMessageInput = {
  customerName: string;
  servicio: string;
  profesional: string;
  sede: string;
  fecha: string; // ya formateada
  hora: string;
};

export function buildBookingMessage(input: BookingMessageInput): string {
  return [
    `¡Hola! Soy ${input.customerName}. Acabo de reservar un turno por la web:`,
    "",
    `• Servicio: ${input.servicio}`,
    `• Profesional: ${input.profesional}`,
    `• Día: ${input.fecha} a las ${input.hora}`,
    `• Sede: ${input.sede}`,
    "",
    "¡Gracias!",
  ].join("\n");
}
