import type { ReactNode } from 'react';

type DetailHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
};

export function DetailHeader({ title, description, badge }: DetailHeaderProps) {
  return (
    <header className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-[20px] font-bold">{title}</h1>
        {badge ? <p className="flex-none">{badge}</p> : null}
      </div>
      {description ? <p className="text-fg-dim">{description}</p> : null}
    </header>
  );
}
