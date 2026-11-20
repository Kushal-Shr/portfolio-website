import type { ReactNode } from 'react';

export type MetaRow = { label: string; labelClass?: string; value: ReactNode };

/** A `<dl>` in a `12ch 1fr` grid. */
export function MetaGrid({ rows }: { rows: readonly MetaRow[] }) {
  return (
    <dl className="m-0 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-[12ch_minmax(0,1fr)]">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className={row.labelClass ?? 'text-fg-dim'}>{row.label}</dt>
          <dd className="m-0 min-w-0 [overflow-wrap:anywhere] max-sm:mb-1 max-sm:pl-[2ch]">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
