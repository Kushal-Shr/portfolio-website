import { Portrait } from '@/components/terminal/Portrait';
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
    <div className="flex items-start gap-4 py-1 max-sm:flex-col sm:gap-8">
      <Portrait
        lines={shown}
        all={portrait}
        pending={reveal.pending}
        className="box-border flex-none px-2 py-1 max-sm:w-full sm:h-[422px] sm:w-[362px]"
      />
      <div className="flex min-w-0 flex-col">
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
