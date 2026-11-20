'use client';

import { useTypewriter } from '@/lib/hooks/useTypewriter';
import { Cursor } from './Cursor';

type TypedPromptProps = { cmd: string; path?: string };

export function TypedPrompt({ cmd, path = '~' }: TypedPromptProps) {
  const { shown, pending } = useTypewriter(cmd, { speed: 55 });

  return (
    <p data-print="hide" className="flex min-h-12 items-center text-[16px]">
      {/* axe forbids aria-label on a <p>, so the final text is exposed as screen-reader-only text. */}
      <span className="sr-only">{`guest@portfolio:${path}$ ${cmd}`}</span>
      {/* One inline run, so a long command wraps instead of pushing the page sideways. */}
      <span className="min-w-0 [overflow-wrap:anywhere] whitespace-pre-wrap">
        <span aria-hidden="true" className="text-green">
          guest@portfolio
        </span>
        <span aria-hidden="true" className="text-fg-dim">
          :
        </span>
        <span aria-hidden="true" className="text-blue">
          {path}
        </span>
        <span aria-hidden="true" className="text-fg-dim">
          {'$ '}
        </span>
        <span
          aria-hidden="true"
          data-testid="prompt-command"
          data-typing={pending ? 'pending' : undefined}
        >
          {shown}
        </span>
        <Cursor />
      </span>
    </p>
  );
}
