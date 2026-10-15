# BeeCode Demos · Turnos online

Demo navegable desde el celular de un sistema de turnos para negocios locales (barberías, centros de estética, kinesiología, pilates). Se personaliza para cada negocio en 20 a 30 minutos con un JSON y se comparte con un link.

- **Cliente final:** reserva un turno en 6 toques o menos, sin escribirle a nadie.
- **Dueño del negocio:** ve la agenda del día ordenada por profesional, marca atendidos, cancela, bloquea horarios y ve la facturación estimada.

> Es una herramienta comercial, no un producto en producción: no hay backend ni autenticación real. Los datos viven en el navegador (localStorage) detrás de una interfaz de repositorio, lista para reemplazarse por una API.

## Stack

Next.js 16 (App Router) · TypeScript estricto · Tailwind CSS 4 · date-fns + date-fns-tz (`America/Argentina/Tucuman`) · zod · Vitest · Deploy en Vercel.

## Rutas

| Ruta | Qué es |
|---|---|
| `/turnos/[slug]` | Mini landing: logo, servicios con duración y precio, equipo, sedes y horarios. |
| `/turnos/[slug]/reservar` | Flujo de reserva: servicio, sede, profesional, fecha, horario, datos y confirmación (.ics + WhatsApp). |
| `/turnos/[slug]/admin` | Panel del dueño con PIN de demo: agenda del día y de la semana, acciones, bloqueos, contadores y "Reiniciar demo". |

| `/demo/natinails` | Demo personalizada de Nati Nails 2.0 con la plantilla "estudio" (ver abajo). |

Un slug que no existe en `tenants/` da 404. Todas las páginas tienen `noindex, nofollow` (meta, header `X-Robots-Tag` y `robots.txt`).

Tenants de ejemplo (PIN `1234`):

- `barberia-demo`: Barbería Torno, 2 sedes y 4 barberos.
- `estetica-demo`: Calma Estética, 1 sede, 3 profesionales y servicios de 20 a 90 minutos.

## Desarrollo

```bash
npm install
npm run dev               # http://localhost:3000/turnos/barberia-demo
npm test                  # tests unitarios (Vitest)
npm run lint
npm run typecheck
npm run validate-tenants  # valida todos los JSON de tenants
npm run build             # valida tenants y genera el build estático
```

Requiere Node 20.9 o superior.

## Crear la demo para un negocio nuevo (20 a 30 minutos)

1. **Crear el tenant**

   ```bash
   npm run new-tenant -- --slug tucuman-barberia --type turnos
   ```

   Copia `tenants/_template-turnos.json` a `tenants/tucuman-barberia.json` y crea `public/tenants/tucuman-barberia/` con un logo provisorio.

2. **Editar el JSON**: nombre, frase, colores, WhatsApp (formato `549` + área + número, sin `+`), PIN, servicios (duración en minutos y precio en ARS), profesionales (qué sedes y servicios hace cada uno) y sedes con horarios (`"0"` es domingo; `null` es cerrado). Con `"showPrices": false` se ocultan los precios.

3. **Subir el logo** a `public/tenants/<slug>/` (SVG o PNG cuadrado). Si no es `logo.svg`, actualizá el campo `logo`.

4. **Validar**

   ```bash
   npm run validate-tenants
   ```

   Si algo falla, el error dice el campo exacto, por ejemplo `profesionales.2.sedeIds.0: La sede "centro" no existe`. También avisa si el WhatsApp sigue siendo el de ejemplo o si el color primario tiene poco contraste con blanco (en ese caso los botones usan texto oscuro automáticamente).

5. **Probar** con `npm run dev` en `http://localhost:3000/turnos/<slug>`.

6. **Publicar**: commit y push. Vercel deploya y la demo queda en `https://demo.beecodelab.com/turnos/<slug>`.

## Cómo mostrar la demo

1. Mandá el link de la landing. El cliente reserva como si fuera un cliente final.
2. Desde la confirmación, "Ver cómo lo recibe el negocio" lleva al panel. El PIN se muestra en la pantalla de acceso.
3. Aclaralo al presentarla: el panel muestra las reservas hechas **en el mismo navegador**, porque la demo usa localStorage. En la versión real se ve desde cualquier dispositivo.
4. "Reiniciar demo" (abajo del panel) vuelve a los turnos de ejemplo.

## Arquitectura

```
app/turnos/[slug]/            landing, reservar/ y admin/ (rutas estáticas por tenant)
components/ui/                botón, input, select, modal (<dialog>), stepper, badge
components/turnos/booking/    pasos del flujo de reserva
components/turnos/admin/      PIN, agenda (grilla y lista), semana, bloqueos
lib/
  types.ts                    modelo de datos
  tenant-schema.ts            schema zod con validaciones cruzadas
  tenants.ts                  carga de tenants desde /tenants (solo build)
  slots.ts                    algoritmo de horarios libres (función pura)
  availability.ts             días y horarios disponibles para el flujo
  booking-flow.ts             reducer del flujo (pasos que se omiten, "Atrás")
  booking-service.ts          confirmación que vuelve a validar el horario
  agenda.ts                   lógica del panel (contadores, rangos, conflictos)
  repositories/booking.ts     interfaz BookingRepository + implementación localStorage
  repositories/storage.ts     storage seguro con fallback en memoria
  seed/turnos.ts              datos semilla determinísticos (8 a 15 turnos)
  ics.ts · whatsapp.ts · phone.ts · color.ts · time.ts
scripts/                      new-tenant y validate-tenants
tenants/                      un JSON por negocio + plantilla
```

Decisiones principales:

- **Lógica fuera de los componentes.** Todo lo que decide algo (slots, pasos, contadores, validaciones) está en `lib/` y tiene tests.
- **Repositorio intercambiable.** Ningún componente toca localStorage. `createBookingRepository` en `lib/repositories/index.ts` es el único lugar a cambiar para usar una API real (NestJS + PostgreSQL).
- **Fechas.** Todo se calcula en la zona del negocio (`America/Argentina/Tucuman`), sin importar la zona del celular. Los turnos se guardan en ISO con offset.
- **Sin superposiciones.** Al confirmar se vuelve a leer la agenda y se recalcula el slot; con "Cualquiera disponible" se asigna el primer profesional libre según el orden del JSON.
- **Colores accesibles.** El texto sobre el color primario y el de acento se elige automáticamente (blanco u oscuro) para cumplir contraste AA.

## Algoritmo de slots

`getAvailableSlots` en `lib/slots.ts`:

1. Toma el horario de la sede para ese día de la semana. Si es `null`, no hay slots.
2. Genera inicios cada `slotStepMin` desde la apertura hasta `cierre - duración`.
3. Descarta los que se superponen con un turno `confirmed` o `done`, o con un bloqueo del profesional (en cualquier sede).
4. Si es hoy, descarta los que empiezan antes de ahora + 30 minutos.
5. Con "Cualquiera disponible", el slot vale si al menos un profesional que hace ese servicio en esa sede está libre.

Tests: día cerrado, servicio que no entra antes del cierre, superposición parcial, bloqueo, "cualquiera" con un profesional ocupado y otro libre, y más (`lib/slots.test.ts`).

## Deploy en Vercel

1. Importar el repo en Vercel (framework Next.js, sin variables de entorno).
2. En **Settings → Domains**, agregar `demo.beecodelab.com`.
3. En el DNS de `beecodelab.com`, crear un registro `CNAME` `demo` apuntando a `cname.vercel-dns.com`.

## Fuera de alcance

Autenticación real, backend o base de datos, pagos o señas, recordatorios automáticos, Google Calendar, multi-tenant con permisos y notificaciones push.

---

Hecho por [BeeCode](https://beecodelab.com).


## Plantilla "estudio" (`/demo/<slug>`)

Para negocios donde la clienta elige **sede primero** y no hace falta elegir profesional (estudios de uñas, por ejemplo). Primera demo: `/demo/natinails`.

- **Config:** `demos/<slug>.ts`, tipada y validada con zod (`lib/studio/schema.ts`): nombre, textos de portada, rating público (opcional), Instagram, WhatsApp, colores (se valida el contraste AA), reserva (días visibles, bloque, anticipación), sedes con horario y `horarioAConfirmar`, categorías con servicios (`ejemplo: true` mientras no estén confirmados), extras que suman minutos (`soloCategorias` para limitarlos) y textos de Open Graph.
- **Registro:** agregar la config en `demos/index.ts`. `npm run validate-tenants` la valida y exige que exista `app/demo/<slug>/page.tsx`.
- **Ruta:** copiar `app/demo/natinails/` (layout con fuentes y colores, página, `opengraph-image.tsx` e `icon.svg`).
- **Flujo:** portada → sede (con "Cómo llegar") → servicio → extras → día y horario (14 días, bloques de 30 min, según la duración total) → datos (nombre y WhatsApp argentino) → resumen y "Confirmar por WhatsApp". El paso va en la URL (`?paso=...`), así el "atrás" del celular vuelve un paso.
- **Datos:** todo en memoria. Los horarios ocupados de ejemplo salen de `lib/studio/busy.ts` (determinísticos por sede y día; `ocupacionEjemplo` regula cuántos).
- **Open Graph:** la imagen se genera con `next/og`. Para que WhatsApp muestre la vista previa, la URL tiene que ser absoluta: se toma de `NEXT_PUBLIC_SITE_URL` o, en Vercel, del dominio de producción.
- **Fuentes:** Syne (títulos) y Manrope (texto), de Google Fonts con licencia OFL, servidas desde `assets/fonts` para que el build no dependa de la red.
