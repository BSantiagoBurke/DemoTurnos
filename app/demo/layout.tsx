import type { Metadata } from "next";

// Todas las rutas /demo son muestras privadas: nunca se indexan.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return children;
}
