type WriteUpProps = {
  /** Sanitized HTML from `loadWriteup`, or `null` when there is nothing to show yet. */
  html: string | null;
  name: string;
  /** Optional notes (skills) render nothing instead of a placeholder. */
  optional?: boolean;
};

export function WriteUp({ html, name, optional }: WriteUpProps) {
  if (html) return <div className="prose-term" dangerouslySetInnerHTML={{ __html: html }} />;
  if (optional) return null;
  return <p className="text-fg-dim">[write-up coming: the full story of {name}]</p>;
}
