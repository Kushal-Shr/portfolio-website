import { useReveal } from '@/lib/hooks/useReveal';

type NeofetchProps = {
  portrait: readonly string[];
  rows: readonly { label: string; value: string }[];
  animate: boolean;
};

const SWATCHES = [
  'text-red',
  'text-yellow',
  'text-green',
  'text-blue',
  'text-purple',
  'text-fg',
] as const;

export function Neofetch({ portrait, rows, animate }: NeofetchProps) {
  const reveal = useReveal(portrait.length, 30, { step: 2, enabled: animate });
  const shown = reveal.pending ? portrait : portrait.slice(0, reveal.count);

  return (
    <div className="flex items-start gap-8 py-1">
      <div
        role="img"
        aria-label="ASCII portrait of Kushal Shrestha"
        className="bg-portrait-bg text-bg box-border h-[422px] w-[362px] flex-none overflow-hidden px-2 py-1"
      >
        <pre
          aria-hidden="true"
          data-typing={reveal.pending ? 'pending' : undefined}
          className="text-[8px] leading-[9px]"
        >
          {shown.join('\n')}
        </pre>
      </div>
      <div className="flex flex-col">
        <p>
          <span className="text-green font-bold">guest</span>@
          <span className="text-green font-bold">portfolio</span>
        </p>
        <p aria-hidden="true" className="text-fg-dim">
          ─────────────────────
        </p>
        {rows.map((row) => (
          <p key={row.label}>
            <span className="text-green font-bold">{row.label}: </span>
            {row.value}
          </p>
        ))}
        <p aria-hidden="true" className="mt-3 tracking-[2px]">
          {SWATCHES.map((tone) => (
            <span key={tone} className={tone}>
              ███
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
