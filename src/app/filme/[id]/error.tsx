'use client';

import { EmptyState, primaryActionClasses } from '@/components/empty-state';

export default function MovieError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      title="Algo deu errado"
      description="Não conseguimos carregar este filme agora."
      action={
        <button type="button" onClick={reset} className={primaryActionClasses}>
          Tentar de novo
        </button>
      }
    />
  );
}
