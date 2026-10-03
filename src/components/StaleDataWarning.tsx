'use client';

import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StaleDataWarningProps {
  /** ISO timestamp string of the last reading */
  lastReadingAt: string | null;
  /** How many minutes before we consider data stale. Default: 5 */
  staleAfterMinutes?: number;
}

/**
 * StaleDataWarning
 *
 * Client Component. Renders a dismissal banner when the most recent reading
 * is older than `staleAfterMinutes`.
 */
export function StaleDataWarning({
  lastReadingAt,
  staleAfterMinutes = 5,
}: StaleDataWarningProps) {
  const [ageMinutes, setAgeMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (!lastReadingAt) return;
    const lastDate = new Date(lastReadingAt);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAgeMinutes((Date.now() - lastDate.getTime()) / 60_000);
    
    const interval = setInterval(() => {
      setAgeMinutes((Date.now() - lastDate.getTime()) / 60_000);
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [lastReadingAt]);

  if (!lastReadingAt || ageMinutes === null || ageMinutes <= staleAfterMinutes) {
    return null;
  }

  const ageLabel =
    ageMinutes < 60
      ? `${Math.round(ageMinutes)} min`
      : `${Math.round(ageMinutes / 60)} h`;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 px-4 py-3 rounded-xl animate-fade-in-up"
      style={{
        background: 'var(--accent-consumption-light)',
        border: '1px solid var(--accent-consumption-glow)',
      }}
    >
      <div
        className="mt-0.5 shrink-0"
        style={{ color: 'var(--accent-consumption)' }}
      >
        <WifiOff size={16} />
      </div>
      <div>
        <p
          className="text-sm font-semibold"
          style={{ color: 'var(--accent-consumption)' }}
        >
          Sin señal del sensor
        </p>
        <p
          className="text-xs mt-0.5"
          style={{ color: 'var(--foreground-muted)' }}
        >
          La última lectura llegó hace&nbsp;
          <strong style={{ color: 'var(--foreground)' }}>{ageLabel}</strong>.
          Los valores mostrados pueden no reflejar la situación actual.
        </p>
      </div>
    </div>
  );
}
