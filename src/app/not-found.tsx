import Link from 'next/link';
import { EmptyState, primaryActionClasses } from '@/components/empty-state';

export default function NotFound() {
  return (
    <EmptyState
      title="Página não encontrada"
      action={
        <Link href="/" className={primaryActionClasses}>
          Ver catálogo
        </Link>
      }
    />
  );
}
