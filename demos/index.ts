import type { StudioDemoConfig } from "@/lib/studio/types";
import { jesus } from "./jesusestilistas";
import { natinails } from "./natinails";

/** Registro de demos con plantilla "estudio". Cada una tiene su ruta en app/demo/<slug>. */
export const studioDemos: StudioDemoConfig[] = [natinails, jesus];
