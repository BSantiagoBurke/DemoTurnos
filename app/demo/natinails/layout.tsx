import type { Metadata } from "next";
import { StudioRoot } from "@/components/studio/StudioRoot";
import { natinails } from "@/demos/natinails";
import { siteUrl } from "@/lib/site-url";
import { body, display } from "./fonts";

// Base absoluta para la imagen OG (WhatsApp necesita URLs completas).
export const metadata: Metadata = { metadataBase: siteUrl() };

export default function NatiNailsLayout({ children }: LayoutProps<"/demo/natinails">) {
  return (
    <StudioRoot config={natinails} fontClassName={`${display.variable} ${body.variable}`}>
      {children}
    </StudioRoot>
  );
}
