import type { StudioDemoConfig, StudioSede } from "@/lib/studio/types";

/**
 * Demo para Jesús Estilistas Contemporáneos (@jesus_estilistas).
 * Datos públicos: dirección y rating de Google Maps, horario de la bio de Instagram.
 * Estilistas y servicios a confirmar: estilistas genéricos y servicios de ejemplo (`ejemplo: true`).
 * La dirección va sin el piso ("1D" en Google Maps) hasta confirmarlo.
 */

const HORARIO: StudioSede["horarios"] = {
  0: null,
  1: { open: "13:00", close: "21:00" },
  2: { open: "13:00", close: "21:00" },
  3: { open: "13:00", close: "21:00" },
  4: { open: "13:00", close: "21:00" },
  5: { open: "13:00", close: "21:00" },
  6: { open: "09:00", close: "18:00" },
};

export const jesus: StudioDemoConfig = {
  slug: "jesusestilistas",
  plantilla: "estudio",
  nombre: "Jesús Estilistas",
  subtitulo: "Reservá tu turno online",
  bajada: "Estudio de peluquería en el centro de Tucumán",
  rating: { valor: 4.7, resenas: 261, fuente: "Google Maps" },
  instagram: { usuario: "jesus_estilistas", url: "https://www.instagram.com/jesus_estilistas/" },
  // Hoy tienen dos WhatsApp (381 454-5856 y 381 232-1552) y el DM de Instagram.
  // La demo no muestra "Avisar por WhatsApp": la idea es que todo quede en la agenda.
  whatsapp: "5493814545856",
  avisoWhatsApp: false,
  adminPin: "1234",
  colores: {
    fondo: "#0b0a09",
    superficie: "#171513",
    borde: "#2e2925",
    texto: "#f2ece4",
    textoSuave: "#a89d92",
    acento: "#c8743a",
    textoSobreAcento: "#0b0a09",
  },
  reserva: { diasVisibles: 14, bloqueMin: 30, anticipacionMin: 60 },
  sedes: [
    {
      id: "centro",
      nombre: "Salta 78",
      zona: "San Miguel de Tucumán",
      direccion: "Salta 78, San Miguel de Tucumán, Tucumán",
      horarios: HORARIO,
      ocupacionEjemplo: 0.3,
    },
  ],
  profesionales: [
    { id: "estilista-1", nombre: "Estilista 1", ocupacionEjemplo: 0.32 },
    { id: "estilista-2", nombre: "Estilista 2", ocupacionEjemplo: 0.25 },
    { id: "estilista-3", nombre: "Estilista 3", ocupacionEjemplo: 0.18 },
  ],
  categorias: [
    {
      id: "corte",
      nombre: "Corte",
      servicios: [
        { id: "corte-dama", nombre: "Corte dama", duracionMin: 45, ejemplo: true },
        { id: "corte-caballero", nombre: "Corte caballero", duracionMin: 30, ejemplo: true },
        { id: "brushing", nombre: "Lavado y brushing", duracionMin: 45, ejemplo: true },
      ],
    },
    {
      id: "color",
      nombre: "Color",
      servicios: [
        { id: "color-raiz", nombre: "Color raíz", duracionMin: 90, ejemplo: true },
        { id: "color-completo", nombre: "Color completo", duracionMin: 120, requiereConsulta: true, ejemplo: true },
        { id: "balayage", nombre: "Mechas / balayage", duracionMin: 180, requiereConsulta: true, ejemplo: true },
      ],
    },
    {
      id: "tratamientos",
      nombre: "Tratamientos",
      servicios: [
        { id: "alisado", nombre: "Alisado permanente", duracionMin: 180, requiereConsulta: true, ejemplo: true },
        { id: "hidratacion", nombre: "Tratamiento de hidratación", duracionMin: 45, ejemplo: true },
      ],
    },
  ],
  extras: [],
  og: {
    titulo: "Jesús Estilistas · Reservá tu turno",
    descripcion: "Elegí servicio, estilista y horario en 1 minuto",
  },
  avisoDemo: "Muestra creada por Bee Code para Jesús Estilistas. Las reservas de esta página no son reales.",
  marca: { tipo: "wordmark", texto: "JESÚS", etiqueta: "Estilistas contemporáneos" },
  textos: {
    duenio: "Jesús",
    pasosPortada: ["Elegí el servicio", "Elegí estilista", "Elegí día y horario"],
    ayudaTelefono: "Con código de área, ej. 381 555-1234",
    comoLlega: "Así le llega este turno al estudio: en una sola agenda, ordenada por estilista.",
    panelBajada: "Los turnos de todo el equipo en una sola agenda.",
    libreParaOtra: "El horario queda libre para otra reserva.",
    notaConsulta: "La duración final se confirma después de ver tu pelo",
    canalesPrevios: "Lo que antes llegaba por dos WhatsApp y el DM de Instagram, ahora está en un solo lugar.",
  },
};
