import { BeeCodeFooter } from "@/components/ui/BeeCodeFooter";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">BeeCode</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Demos de turnos online</h1>
      <p className="mt-3 text-slate-600">
        Si recibiste un link de demo, abrilo directamente para ver la versión armada para tu negocio.
      </p>
      <BeeCodeFooter className="mt-12" />
    </main>
  );
}
