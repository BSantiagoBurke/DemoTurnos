import type { DayHours, Weekday } from "../types";

/**
 * Plantilla "estudio". Cada negocio tiene su config en /demos/<slug>.ts.
 * Pasos opcionales según la config: sede (si hay más de una), extras (si hay) y
 * profesional (si hay profesionales; cada uno con su propia agenda).
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
  /** Aviso que se muestra si el horario está a confirmar, ej. "Mientras tanto usamos el de San Martín." */
  notaHorario?: string;
  /** Qué tan llena está la agenda de ejemplo (0 a 1). Sirve para que cada sede se vea distinta. */
  ocupacionEjemplo: number;
};

/** Profesional con agenda propia (estilista, barbero...). */
export type StudioProfesional = {
  id: string;
  /** Nombre visible. Mientras el negocio no lo confirme, genérico ("Estilista 1"). */
  nombre: string;
  /** Qué tan llena está su agenda de ejemplo (0 a 1). */
  ocupacionEjemplo: number;
};

export type StudioServicio = {
  id: string;
  nombre: string;
  duracionMin: number;
  descripcion?: string;
  /** La duración es la base: la final se confirma en el estudio (ej. color, según el pelo). */
  requiereConsulta?: boolean;
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

/** Logo de la demo. Siempre una recreación simple, nunca el archivo original de la marca. */
export type StudioMarca =
  /** Monograma "NN" en círculo (Nati Nails). `rayo`: rayo de acento pegado al nombre. */
  | { tipo: "nn"; etiqueta: string; rayo?: boolean }
  /** Nombre en texto con la tipografía display, en color de acento. */
  | { tipo: "wordmark"; texto: string; etiqueta: string };

/** Textos que cambian según el negocio. */
export type StudioTextos = {
  /** Quién recibe el turno: "Ver cómo lo recibe {duenio}". */
  duenio: string;
  /** Los 3 pasos de la portada. */
  pasosPortada: string[];
  /** Ayuda debajo del campo WhatsApp. */
  ayudaTelefono: string;
  /** Pantalla final: "Así le llega este turno al estudio, ...". */
  comoLlega: string;
  /** Bajada del acceso al panel. */
  panelBajada: string;
  /** Al cancelar: "El horario queda libre para ...". */
  libreParaOtra: string;
  /** Nota para servicios con `requiereConsulta`. */
  notaConsulta?: string;
  /** Panel: de dónde llegaban antes los turnos. Es el mensaje de venta. */
  canalesPrevios?: string;
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
  /** PIN del panel de demo (no es autenticación real). */
  adminPin: string;
  colores: StudioColores;
  reserva: {
    diasVisibles: number;
    bloqueMin: number;
    /** Minutos mínimos entre ahora y el turno más próximo. */
    anticipacionMin: number;
  };
  sedes: StudioSede[];
  /** Si está, se elige profesional (o "Sin preferencia") y cada uno tiene su agenda. */
  profesionales?: StudioProfesional[];
  categorias: StudioCategoria[];
  extras: StudioExtra[];
  og: { titulo: string; descripcion: string };
  /** Texto chico al pie, obligatorio en las demos. */
  avisoDemo: string;
  marca: StudioMarca;
  textos: StudioTextos;
  /** Muestra "Avisar por WhatsApp (opcional)" al terminar. Por defecto true. */
  avisoWhatsApp?: boolean;
};

export type StudioBookingStatus = "confirmado" | "atendido" | "cancelado";

/** Turno guardado. Fecha y hora en la zona del negocio (America/Argentina/Tucuman). */
export type StudioBooking = {
  id: string;
  slug: string;
  sedeId: string;
  /** Solo en demos con profesionales. */
  profesionalId?: string;
  servicioId: string;
  extraIds: string[];
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  durationMin: number;
  nombre: string;
  telefono: string; // 549...
  status: StudioBookingStatus;
  /** "web": reservado desde la página. "ejemplo": dato inventado para la demo. */
  origen: "web" | "ejemplo";
  createdAt: string; // ISO
};

/** Horario bloqueado por el estudio en una sede (almuerzo, curso, etc.). */
export type StudioBlock = {
  id: string;
  slug: string;
  sedeId: string;
  /** Si está, bloquea solo a ese profesional; si no, a toda la sede. */
  profesionalId?: string;
  date: string;
  start: string; // HH:mm
  end: string; // HH:mm
  motivo?: string;
};
