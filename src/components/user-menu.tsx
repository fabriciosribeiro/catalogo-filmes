import Link from 'next/link';
import { signOutAction } from '@/app/auth/actions';

const itemClasses = 'block w-full rounded px-3 py-2 text-left text-sm hover:bg-surface-2';

/** Menu sem JavaScript (<details>); fecha ao navegar porque a página troca. */
export function UserMenu({ email }: { email: string }) {
  return (
    <details className="relative shrink-0">
      <summary className="cursor-pointer list-none rounded-full bg-surface-2 px-3 py-1.5 text-sm font-medium hover:brightness-110">
        Minha conta
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-60 rounded-md bg-surface p-1 shadow-xl ring-1 ring-surface-2">
        <p className="truncate px-3 py-2 text-xs text-muted">{email}</p>
        <Link href="/minha-lista" className={itemClasses}>
          Minha lista
        </Link>
        <Link href="/minhas-plataformas" className={itemClasses}>
          Minhas plataformas
        </Link>
        <form action={signOutAction}>
          <button type="submit" className={itemClasses}>
            Sair
          </button>
        </form>
      </div>
    </details>
  );
}
