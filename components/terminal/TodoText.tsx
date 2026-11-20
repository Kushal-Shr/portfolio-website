import { isTodo, type MaybeTodo } from '@/content/types';

/** Renders copy that may still be a placeholder: placeholders are dim and bracketed. */
export function MaybeTodoText({ value }: { value: MaybeTodo }) {
  if (isTodo(value)) return <span className="text-fg-dim">[{value.text}]</span>;
  return <>{value}</>;
}
