import Link from 'next/link';
import type { ReactNode } from 'react';

type Tone = 'default' | 'green' | 'yellow';

type BoxProps = {
  title: string;
  /** Makes the title a quiet link to a detail page. */
  titleHref?: string;
  badge?: ReactNode;
  tone?: Tone;
  /** `tui` is the dashboard's lighter title: regular weight, 11px up, 12px in. */
  variant?: 'default' | 'tui';
  as?: 'section' | 'article' | 'aside' | 'div';
  headingLevel?: 2 | 3;
  id?: string;
  /** An accessible name for the region when the title alone is too terse. */
  ariaLabel?: string;
  /** Marks the box for the skills filter (`data-section`). */
  section?: string;
  className?: string;
  children?: ReactNode;
};

const BORDER: Record<Tone, string> = {
  default: 'border-line-strong',
  green: 'border-green',
  yellow: 'border-yellow',
};

export function Box({
  title,
  titleHref,
  badge,
  tone = 'default',
  variant = 'default',
  as: Tag = 'section',
  headingLevel = 2,
  id,
  ariaLabel,
  section,
  className = 'px-5 pt-6 pb-4',
  children,
}: BoxProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const titleColor = tone === 'yellow' ? 'text-yellow' : 'text-green';

  return (
    <Tag
      id={id}
      aria-label={ariaLabel}
      data-section={section}
      className={`relative border ${BORDER[tone]} ${variant === 'tui' ? 'box-tui' : ''} ${className}`}
    >
      <Heading className={`box-title ${titleColor}`}>
        <span aria-hidden="true">┤ </span>
        {titleHref ? (
          <Link href={titleHref} className="link-quiet">
            {title}
          </Link>
        ) : (
          title
        )}
        <span aria-hidden="true"> ├</span>
      </Heading>
      {badge ? <div className="box-badge">{badge}</div> : null}
      {children}
    </Tag>
  );
}
