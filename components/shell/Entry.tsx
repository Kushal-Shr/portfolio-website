import { memo } from 'react';
import type { Entry as EntryData } from '@/lib/shell/session';
import { Neofetch } from './Neofetch';
import { OutputLine } from './OutputLine';

export type NeofetchData = {
  portrait: readonly string[];
  rows: readonly { label: string; value: string }[];
};

type EntryProps = { entry: EntryData; neofetch?: NeofetchData };

/** The echoed prompt line plus its output. Memoized so keystrokes never re-render old output. */
export const Entry = memo(function Entry({ entry, neofetch }: EntryProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div>
        <span className="text-green">guest@portfolio</span>
        <span className="text-fg-dim">:</span>
        <span className="text-blue">{entry.cwd}</span>
        <span className="text-fg-dim">$ </span>
        {entry.input}
      </div>
      {entry.lines.map((line, i) =>
        line.kind === 'neofetch' ? (
          neofetch ? (
            <Neofetch
              key={i}
              portrait={neofetch.portrait}
              rows={neofetch.rows}
              animate={!!entry.animate}
            />
          ) : (
            <div key={i} className="text-fg-dim pl-4">
              [the neofetch card shows on the home page]
            </div>
          )
        ) : (
          <OutputLine key={i} line={line} />
        ),
      )}
    </div>
  );
});
