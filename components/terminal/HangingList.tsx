import { isTodo, type MaybeTodo } from '@/content/types';

type HangingListProps = {
  items: readonly MaybeTodo[];
  /** The text colour of the dashes and items that aren't placeholders. */
  tone?: 'fg' | 'dim';
  className?: string;
};

/**
 * `- text` lines whose wrapped lines hang under the text, not under the dash. Replaces a `<pre>`
 * of dashes, which can only overflow when a line is long. A real list, so it also reads as one.
 */
export function HangingList({ items, tone = 'fg', className = '' }: HangingListProps) {
  return (
    <ul className={`m-0 list-none p-0 ${tone === 'dim' ? 'text-fg-dim' : ''} ${className}`.trim()}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-[1ch]">
          <span aria-hidden="true">-</span>
          {isTodo(item) ? (
            <span className="text-fg-dim min-w-0">[{item.text}]</span>
          ) : (
            <span className={`min-w-0 [overflow-wrap:anywhere] ${tone === 'dim' ? 'text-fg' : ''}`}>
              {item}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
