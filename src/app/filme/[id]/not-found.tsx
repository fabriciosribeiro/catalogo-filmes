import Link from 'next/link';
import { EmptyState, primaryActionClasses } from '@/components/empty-state';

export default function MovieNotFound() {
  return (
    <EmptyState
      title="Filme não encontrado"
      description="O link pode estar errado ou o filme foi removido do TMDB."
      action={
        <Link href="/" className={primaryActionClasses}>
          Voltar ao catálogo
        </Link>
      }
    />
  );
}
