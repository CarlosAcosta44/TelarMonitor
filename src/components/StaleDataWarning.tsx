import { WifiOff } from 'lucide-react';

interface StaleDataWarningProps {
  /** ISO timestamp string of the last reading */
  lastReadingAt: string | null;
  /** How many minutes before we consider data stale. Default: 5 */
  staleAfterMinutes?: number;
}

/**
 * StaleDataWarning
 *
 * Server Component. Renders a dismissal banner when the most recent reading
 * is older than `staleAfterMinutes`. This catches cases where the sensor /
 * simulator has stopped sending data, so the user knows the numbers on screen
 * may not reflect the current reality.
 */
export function StaleDataWarning({
  lastReadingAt,
  staleAfterMinutes = 5,
}: StaleDataWarningProps) {
  if (!lastReadingAt) return null;

  const lastDate = new Date(lastReadingAt);
  const ageMinutes = (Date.now() - lastDate.getTime()) / 60_000;

  if (ageMinutes <= staleAfterMinutes) return null;

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
