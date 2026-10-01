import type { Metadata } from 'next';
import { NewPasswordForm } from '@/components/auth/new-password-form';
import { requireUser } from '@/lib/supabase/auth';

export const metadata: Metadata = { title: 'Nova senha' };

export default async function NewPasswordPage() {
  await requireUser('/nova-senha');
  return (
    <div className="mx-auto w-full max-w-sm space-y-4 py-12">
      <h1 className="text-xl font-semibold">Criar nova senha</h1>
      <NewPasswordForm />
    </div>
  );
}
