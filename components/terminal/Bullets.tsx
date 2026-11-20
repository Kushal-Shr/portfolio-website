import { isTodo, type MaybeTodo } from '@/content/types';

type BulletsProps = {
  items: readonly MaybeTodo[];
  className?: string;
};

/** `- text` lines with a hanging indent: dim dash, `fg` text, placeholders dim in brackets. */
export function Bullets({ items, className = '' }: BulletsProps) {
  return (
    <ul className={`text-fg-dim m-0 list-none p-0 ${className}`.trim()}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-[1ch]">
          <span aria-hidden="true">-</span>
          {isTodo(item) ? <span>[{item.text}]</span> : <span className="text-fg">{item}</span>}
        </li>
      ))}
    </ul>
  );
}
