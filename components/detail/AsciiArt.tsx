type AsciiArtProps = {
  art: string;
  /** Project pictures carry alt text. Skill icons are decorative: the page names the skill. */
  alt?: string;
  className?: string;
};

/** ASCII art: hidden from assistive tech, with `alt` (when given) on a `role="img"` wrapper. */
export function AsciiArt({ art, alt, className = '' }: AsciiArtProps) {
  return (
    <div
      role={alt ? 'img' : undefined}
      aria-label={alt}
      className={`max-w-full flex-none overflow-hidden ${className}`.trim()}
    >
      <pre aria-hidden="true" className="text-blue leading-[1.2]">
        {art}
      </pre>
    </div>
  );
}
