'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { serializeFilters, type Filters, type SerializeOptions } from '@/lib/filters';

export function useFilterNavigation() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (next: Filters, options?: SerializeOptions) => {
      const queryString = serializeFilters(next, options);
      startTransition(() => {
        router.replace(queryString ? `/?${queryString}` : '/', { scroll: false });
      });
    },
    [router],
  );

  return { navigate, isPending };
}
