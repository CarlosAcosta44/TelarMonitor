'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * DashboardRefresher
 *
 * Invisible client component that calls router.refresh() every N seconds.
 * router.refresh() triggers Next.js to re-fetch all Server Component data
 * on the current page without a full browser reload — so the user sees
 * fresh numbers without any flash or navigation.
 */
interface DashboardRefresherProps {
  /** Interval in milliseconds. Default: 10 000 (10 s) */
  intervalMs?: number;
}

export function DashboardRefresher({ intervalMs = 10_000 }: DashboardRefresherProps) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(id);
  }, [router, intervalMs]);

  // Renders nothing — purely behavioral
  return null;
}
