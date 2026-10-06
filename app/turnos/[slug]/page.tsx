import Link from "next/link";
import { notFound } from "next/navigation";
import { TenantLogo } from "@/components/turnos/TenantLogo";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { formatDuration, formatPrice } from "@/lib/format";
import { summarizeHours } from "@/lib/hours";
import { getTenant } from "@/lib/tenants";

export default async function TenantLanding({ params }: PageProps<"/turnos/[slug]">) {
  const { slug } = await params;
  const tenant = getTenant(slug);
  if (!tenant) notFound();
  const showPrices = tenant.showPrices ?? true;

  return (
    <main className="mx-auto w-full max-w-2xl">
      <header className="bg-primary px-4 pb-10 pt-8 text-on-primary">
        <div className="flex items-center gap-4">
          <TenantLogo tenant={tenant} size={64} />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight">{tenant.name}</h1>
            {tenant.tagline ? <p className="mt-1 opacity-90">{tenant.tagline}</p> : null}
          </div>
        </div>
        <Link
          href={`/turnos/${tenant.slug}/reservar`}
          className="mt-6 hidden min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-lg font-bold text-on-accent sm:inline-flex"
        >
          Reservar turno
        </Link>
      </header>

      <section aria-labelledby="servicios" className="-mt-4 px-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 id="servicios" className="text-lg font-bold text-slate-900">
            Servicios
          </h2>
          <ul className="mt-2 divide-y divide-slate-100">
            {tenant.servicios.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  {s.description ? <p className="text-sm text-slate-600">{s.description}</p> : null}
                  <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-600">
                    <Icon name="clock" className="size-4" />
                    {formatDuration(s.durationMin)}
                  </p>
                </div>
                {showPrices ? <p className="shrink-0 font-semibold text-slate-900">{formatPrice(s.price)}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="equipo" className="mt-6 px-4">
        <h2 id="equipo" className="text-lg font-bold text-slate-900">
          Equipo
        </h2>
        <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {tenant.profesionales.map((p) => (
            <li key={p.id} className="flex flex-col items-center text-center">
              <Avatar name={p.name} className="size-14 text-base" />
              <span className="mt-1.5 text-sm text-slate-800">{p.name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sedes" className="mt-6 px-4">
        <h2 id="sedes" className="text-lg font-bold text-slate-900">
          {tenant.sedes.length > 1 ? "Sedes y horarios" : "Dónde estamos"}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {tenant.sedes.map((sede) => (
            <article key={sede.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <h3 className="font-semibold text-slate-900">{sede.name}</h3>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-700">
                <Icon name="pin" className="mt-0.5 size-4 shrink-0" />
                {sede.address}
              </p>
              <dl className="mt-3 space-y-1 text-sm">
                {summarizeHours(sede.hours).map((row) => (
                  <div key={row.days} className="flex justify-between gap-3">
                    <dt className="text-slate-600">{row.days}</dt>
                    <dd className={row.hours === "Cerrado" ? "text-slate-500" : "font-medium text-slate-900"}>{row.hours}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>

      <p className="mt-8 px-4 text-center text-sm">
        <Link href={`/turnos/${tenant.slug}/admin`} className="text-slate-600 underline underline-offset-2">
          ¿Sos el dueño? Entrá al panel del negocio
        </Link>
      </p>

      <div className="sticky bottom-0 z-10 mt-6 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:hidden">
        <Link href={`/turnos/${tenant.slug}/reservar`} className={buttonClasses("primary", true) + " min-h-12 text-lg"}>
          Reservar turno
        </Link>
      </div>
    </main>
  );
}
