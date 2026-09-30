'use client';

import { EmptyState, primaryActionClasses } from '@/components/empty-state';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      title="Algo deu errado"
      description="Não conseguimos carregar os filmes agora. Tente de novo em instantes."
      action={
        <button type="button" onClick={reset} className={primaryActionClasses}>
          Tentar de novo
        </button>
      }
    />
  );
}
