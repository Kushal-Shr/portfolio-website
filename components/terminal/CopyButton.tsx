'use client';

import { useEffect, useRef, useState } from 'react';

type CopyState = 'idle' | 'copied' | 'failed';

const RESET_MS = 2000;

type CopyButtonProps = {
  /** What lands on the clipboard. */
  value: string;
  /** What is being copied, for the accessible name: `email`. */
  what: string;
};

/** A tiny `[copy]` button. The result is announced politely and fades back to nothing after 2s. */
export function CopyButton({ value, what }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      // No clipboard API (an insecure page) or the permission was refused.
      setState('failed');
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), RESET_MS);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={`copy ${what} to clipboard`}
        // A dense inline control: 24px for a mouse on a wide screen, 44px on touch and narrow ones.
        data-dense=""
        className="text-fg-dim hover:text-green inline-flex min-h-6 cursor-pointer items-center border-0 bg-transparent p-0 font-[inherit] max-lg:inline-flex max-lg:min-h-11 max-lg:items-center pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center"
      >
        [copy]
      </button>
      <span role="status" className="text-green">
        {state === 'idle' ? (
          ''
        ) : (
          <span className="ml-[1ch]">{state === 'copied' ? 'copied ✓' : 'copy failed'}</span>
        )}
      </span>
    </>
  );
}
