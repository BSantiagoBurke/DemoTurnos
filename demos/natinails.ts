import type { StudioDemoConfig, StudioSede } from "@/lib/studio/types";

/**
 * Demo para Nati Nails 2.0 (@natinails2.0).
 * Horario tomado de Google Maps para la sede San Martín. Marcos Paz y Heller usan el mismo
 * horario hasta que Nati lo confirme. Servicios y duraciones son de ejemplo (`ejemplo: true`).
 */

const HORARIO_SAN_MARTIN: StudioSede["horarios"] = {
  0: null,
  1: { open: "08:00", close: "21:30" },
  2: { open: "08:00", close: "21:30" },
  3: { open: "08:00", close: "21:30" },
  4: { open: "08:00", close: "20:30" },
  5: { open: "08:00", close: "21:30" },
  6: { open: "08:00", close: "15:00" },
};

export const natinails: StudioDemoConfig = {
  slug: "natinails",
  plantilla: "estudio",
  nombre: "Nati Nails 2.0",
  subtitulo: "Reservá tu turno online",
  bajada: "Expertas en nail art · 3 sedes en San Miguel de Tucumán y Yerba Buena",
  rating: { valor: 4.9, resenas: 72, fuente: "Google Maps" },
  instagram: { usuario: "natinails2.0", url: "https://www.instagram.com/natinails2.0/" },
  whatsapp: "5493812209727",
  adminPin: "1234",
  colores: {
    fondo: "#0e0e0f",
    superficie: "#19191b",
    borde: "#2c2c30",
    texto: "#f3efea",
    textoSuave: "#a9a39c",
    acento: "#e8335a",
    textoSobreAcento: "#ffffff",
  },
  reserva: { diasVisibles: 14, bloqueMin: 30, anticipacionMin: 60 },
  sedes: [
    {
      id: "san-martin",
      nombre: "San Martín 2135",
      zona: "San Miguel de Tucumán",
      direccion: "San Martín 2135, San Miguel de Tucumán, Tucumán",
      horarios: HORARIO_SAN_MARTIN,
      ocupacionEjemplo: 0.3,
    },
    {
      id: "marcos-paz",
      nombre: "Marcos Paz 717",
      zona: "San Miguel de Tucumán",
      direccion: "Marcos Paz 717, San Miguel de Tucumán, Tucumán",
      horarios: HORARIO_SAN_MARTIN,
      horarioAConfirmar: true,
      notaHorario: "Mientras tanto usamos el de San Martín.",
      ocupacionEjemplo: 0.22,
    },
    {
      id: "heller",
      nombre: "Heller 175",
      zona: "Yerba Buena",
      direccion: "Heller 175, Yerba Buena, Tucumán",
      horarios: HORARIO_SAN_MARTIN,
      horarioAConfirmar: true,
      notaHorario: "Mientras tanto usamos el de San Martín.",
      ocupacionEjemplo: 0.15,
    },
  ],
  categorias: [
    {
      id: "manos",
      nombre: "Manos",
      servicios: [
        { id: "semi-manos", nombre: "Esmaltado semipermanente", duracionMin: 60, ejemplo: true },
        { id: "kapping", nombre: "Kapping en gel", duracionMin: 75, ejemplo: true },
        { id: "esculpidas", nombre: "Esculpidas", duracionMin: 120, ejemplo: true },
        { id: "service-esculpidas", nombre: "Service de esculpidas", duracionMin: 90, ejemplo: true },
      ],
    },
    {
      id: "pies",
      nombre: "Pies",
      servicios: [{ id: "semi-pies", nombre: "Esmaltado semipermanente en pies", duracionMin: 60, ejemplo: true }],
    },
  ],
  extras: [
    {
      id: "nail-art",
      nombre: "Nail art",
      duracionMin: 15,
      desde: true,
      descripcion: "El tiempo final depende del diseño.",
      ejemplo: true,
    },
    {
      id: "french",
      nombre: "French",
      duracionMin: 15,
      soloCategorias: ["manos"],
      ejemplo: true,
    },
    { id: "retiro", nombre: "Retiro de material", duracionMin: 20, ejemplo: true },
  ],
  og: {
    titulo: "Nati Nails 2.0 · Reservá tu turno",
    descripcion: "Elegí sede, servicio y horario en 1 minuto",
  },
  avisoDemo: "Muestra creada por Bee Code para Nati Nails 2.0. Las reservas de esta página no son reales.",
  marca: { tipo: "nn", etiqueta: "Nati Nails | Artist", rayo: true },
  textos: {
    duenio: "Nati",
    pasosPortada: ["Elegí tu sede", "Elegí servicio y extras", "Elegí día y horario"],
    ayudaTelefono: "Con código de área, sin 0 ni 15 (igual los aceptamos).",
    comoLlega: "Así le llega este turno al estudio, ordenado por sede.",
    panelBajada: "Turnos de las 3 sedes en un solo lugar.",
    libreParaOtra: "El horario queda libre para otra clienta.",
  },
};
