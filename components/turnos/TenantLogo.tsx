import Image from "next/image";
import type { TenantTurnosConfig } from "@/lib/types";

export function TenantLogo({ tenant, size = 56 }: { tenant: TenantTurnosConfig; size?: number }) {
  return (
    <Image
      src={tenant.logo}
      alt={`Logo de ${tenant.name}`}
      width={size}
      height={size}
      unoptimized
      priority
      className="shrink-0 rounded-2xl object-contain"
    />
  );
}
