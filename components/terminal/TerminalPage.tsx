import type { ReactNode } from 'react';
import { NavBar } from './NavBar';
import { TypedPrompt } from './TypedPrompt';

type TerminalPageProps = {
  prompt?: string;
  promptPath?: string;
  padX?: 'default' | 'wide';
  /** Top padding: the dashboard uses 20px instead of 24px. */
  padTop?: 'default' | 'compact';
  /** Fill the viewport exactly and keep the page from scrolling (the shell scrolls inside). */
  fill?: boolean;
  /** Bottom padding above the nav as a Tailwind class. */
  padBottom?: string;
  /** Gap between direct children of `<main>`, as a Tailwind class. */
  gap?: string;
  className?: string;
  children?: ReactNode;
};

export function TerminalPage({
  prompt,
  promptPath,
  padX = 'default',
  padTop = 'default',
  fill = false,
  padBottom = 'pb-6',
  gap = 'gap-6',
  className = '',
  children,
}: TerminalPageProps) {
  const padding = padX === 'wide' ? 'px-[160px]' : 'px-6';
  const top = padTop === 'compact' ? 'pt-5' : 'pt-6';

  return (
    <div className={`page-frame flex flex-col ${fill ? 'h-dvh min-h-[600px]' : 'min-h-dvh'}`}>
      <div
        className={`page-column mx-auto flex w-full max-w-[1280px] flex-1 flex-col ${fill ? 'min-h-0' : ''} ${padBottom} ${top} ${padding}`}
      >
        <main
          id="content"
          tabIndex={-1}
          className={`flex flex-1 flex-col ${fill ? 'min-h-0' : ''} ${gap} ${className}`.trim()}
        >
          {prompt ? <TypedPrompt cmd={prompt} path={promptPath} /> : null}
          {children}
        </main>
      </div>
      <NavBar />
    </div>
  );
}
