'use client';

import type { InputHTMLAttributes } from 'react';
import { useFormStatus } from 'react-dom';
import { primaryActionClasses } from '@/components/empty-state';

type FieldProps = { label: string } & InputHTMLAttributes<HTMLInputElement>;

export function Field({ label, id, ...input }: FieldProps) {
  const inputId = id ?? input.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        className="rounded-md bg-surface px-3 py-2 ring-1 ring-surface-2 outline-none focus:ring-2 focus:ring-accent"
        {...input}
      />
    </div>
  );
}

export function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${primaryActionClasses} disabled:opacity-60`}
    >
      {children}
    </button>
  );
}

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (error) {
    return (
      <p role="alert" className="text-sm text-red-400">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p role="status" className="text-sm text-green-400">
        {success}
      </p>
    );
  }
  return null;
}
