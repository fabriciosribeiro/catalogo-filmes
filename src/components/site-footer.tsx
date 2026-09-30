import Image from 'next/image';

export function SiteFooter() {
  return (
    <footer className="border-t border-surface-2 px-4 py-6 text-xs text-muted">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="shrink-0">
          <Image src="/tmdb-logo.svg" alt="TMDB" width={96} height={12} />
        </a>
        <p>
          Este produto usa a API do TMDB mas não é endossado ou certificado pelo TMDB. Dados de
          streaming fornecidos por{' '}
          <a
            className="underline hover:text-fg"
            href="https://www.justwatch.com"
            target="_blank"
            rel="noreferrer"
          >
            JustWatch
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
