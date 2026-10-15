import type { DayHours, Weekday } from "../types";

/**
 * Plantilla "estudio": demos sin paso de profesional, donde la clienta elige
 * primero la sede. Cada negocio tiene su config en /demos/<slug>.ts.
 */

export type StudioSede = {
  id: string;
  /** Nombre corto que se usa en tarjetas y en el mensaje de WhatsApp, ej. "San Martín 2135". */
  nombre: string;
  /** Ciudad o zona, ej. "San Miguel de Tucumán". */
  zona: string;
  /** Dirección completa para Google Maps. */
  direccion: string;
  horarios: Record<Weekday, DayHours>; // 0 = domingo, null = cerrado
  /** true si el horario todavía no lo confirmó el negocio. */
  horarioAConfirmar?: boolean;
  /** Qué tan llena está la agenda de ejemplo (0 a 1). Sirve para que cada sede se vea distinta. */
  ocupacionEjemplo: number;
};

export type StudioServicio = {
  id: string;
  nombre: string;
  duracionMin: number;
  descripcion?: string;
  /** true mientras el servicio no esté confirmado por el negocio. */
  ejemplo?: boolean;
};

export type StudioCategoria = {
  id: string;
  nombre: string;
  servicios: StudioServicio[];
};

export type StudioExtra = {
  id: string;
  nombre: string;
  duracionMin: number;
  /** Muestra "desde X min": la duración real depende del diseño. */
  desde?: boolean;
  descripcion?: string;
  /** Si está, el extra solo aparece con servicios de estas categorías. */
  soloCategorias?: string[];
  ejemplo?: boolean;
};

export type StudioColores = {
  fondo: string;
  superficie: string;
  borde: string;
  texto: string;
  textoSuave: string;
  acento: string;
  textoSobreAcento: string;
};

export type StudioDemoConfig = {
  slug: string;
  plantilla: "estudio";
  nombre: string;
  /** Subtítulo de la portada. */
  subtitulo: string;
  /** Línea corta debajo del subtítulo. */
  bajada: string;
  /** Dato público y verificable. No inventar reseñas. */
  rating?: { valor: number; resenas: number; fuente: string };
  instagram?: { usuario: string; url: string };
  whatsapp: string; // 549 + área + número
  colores: StudioColores;
  reserva: {
    diasVisibles: number;
    bloqueMin: number;
    /** Minutos mínimos entre ahora y el turno más próximo. */
    anticipacionMin: number;
  };
  sedes: StudioSede[];
  categorias: StudioCategoria[];
  extras: StudioExtra[];
  og: { titulo: string; descripcion: string };
  /** Texto chico al pie, obligatorio en las demos. */
  avisoDemo: string;
};
