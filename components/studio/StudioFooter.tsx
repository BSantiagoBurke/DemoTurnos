export function StudioFooter({ aviso }: { aviso: string }) {
  return (
    <footer className="px-4 pb-8 pt-10 text-center text-xs leading-relaxed text-(--st-muted)">
      <p className="mx-auto max-w-xs">{aviso}</p>
      <p className="mt-2">
        <a href="https://beecodelab.com" target="_blank" rel="noopener" className="underline underline-offset-2">
          beecodelab.com
        </a>
      </p>
    </footer>
  );
}
