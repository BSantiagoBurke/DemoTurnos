import type { Metadata } from "next";
import { StudioRoot } from "@/components/studio/StudioRoot";
import { jesus } from "@/demos/jesusestilistas";
import { siteUrl } from "@/lib/site-url";
import { jesusBody, jesusDisplay } from "./fonts";

// Base absoluta para la imagen OG (WhatsApp necesita URLs completas).
export const metadata: Metadata = { metadataBase: siteUrl() };

export default function JesusLayout({ children }: LayoutProps<"/demo/jesusestilistas">) {
  return (
    <StudioRoot config={jesus} fontClassName={`${jesusDisplay.variable} ${jesusBody.variable}`}>
      {children}
    </StudioRoot>
  );
}
