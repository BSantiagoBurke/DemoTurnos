import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">No encontramos esta página</h1>
      <p className="mt-2 text-slate-600">Revisá que el link esté completo.</p>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-5 font-semibold text-white">
        Ir al inicio
      </Link>
    </main>
  );
}
