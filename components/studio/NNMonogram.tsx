/** Trazo del monograma "NN" (viewBox 0 0 100 100). Recreación simple, no el archivo original de la marca. */
export const NN_PATH = "M24 67V33H31L40 52.1V33H47V67H40L31 47.9V67Z M53 67V33H60L69 52.1V33H76V67H69L60 47.9V67Z";

/** Monograma "NN" negro en círculo blanco. Se usa en la portada, el header, el ícono y la imagen OG. */
export function NNMonogram({ size = 96, title }: { size?: number; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <circle cx="50" cy="50" r="49" fill="#ffffff" />
      <path d={NN_PATH} fill="#0e0e0f" />
    </svg>
  );
}
