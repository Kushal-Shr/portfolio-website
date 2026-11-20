'use client';

import { useEffect, useState } from 'react';
import { formatClock } from '@/lib/time';

// Same character count as a real clock string ("Thu Nov 19 14:05") so nothing shifts on mount.
const PLACEHOLDER = '0'.repeat(16);

export function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    // Tick exactly on minute boundaries instead of drifting with a fixed 60s interval.
    const tick = () => {
      const date = new Date();
      setNow(date);
      timeout = setTimeout(tick, 60_000 - (date.getSeconds() * 1000 + date.getMilliseconds()));
    };
    tick();
    return () => clearTimeout(timeout);
  }, []);

  if (!now) {
    return (
      <time aria-hidden="true" className="invisible ml-auto pl-2.5 max-sm:hidden">
        {PLACEHOLDER}
      </time>
    );
  }
  return (
    <time dateTime={now.toISOString()} className="ml-auto pl-2.5 max-sm:hidden">
      {formatClock(now)}
    </time>
  );
}
