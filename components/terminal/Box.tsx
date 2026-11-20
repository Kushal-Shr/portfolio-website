import type { ReactNode } from 'react';

type Tone = 'default' | 'green' | 'yellow';

type BoxProps = {
  title: string;
  badge?: ReactNode;
  tone?: Tone;
  as?: 'section' | 'article' | 'aside' | 'div';
  headingLevel?: 2 | 3;
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
  badge,
  tone = 'default',
  as: Tag = 'section',
  headingLevel = 2,
  className = 'px-5 pt-6 pb-4',
  children,
}: BoxProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const titleColor = tone === 'yellow' ? 'text-yellow' : 'text-green';

  return (
    <Tag className={`relative border ${BORDER[tone]} ${className}`}>
      <Heading className={`box-title ${titleColor}`}>
        <span aria-hidden="true">┤ </span>
        {title}
        <span aria-hidden="true"> ├</span>
      </Heading>
      {badge ? <div className="box-badge">{badge}</div> : null}
      {children}
    </Tag>
  );
}
