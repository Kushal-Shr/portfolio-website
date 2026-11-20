import type { ReactNode } from 'react';
import { ShellDock } from '@/components/shell/ShellDock';
import { shellInfo } from '@/lib/site-data';
import { NavBar } from './NavBar';
import { TypedPrompt } from './TypedPrompt';

type TerminalPageProps = {
  prompt?: string;
  promptPath?: string;
  padX?: 'default' | 'wide';
  /** Top padding: the dashboard uses 20px instead of 24px. */
  padTop?: 'default' | 'compact';
  /** The docked command line above the nav bar (off on the home page, which is the shell). */
  dock?: boolean;
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
  dock = true,
  fill = false,
  padBottom = 'pb-6',
  gap = 'gap-6',
  className = '',
  children,
}: TerminalPageProps) {
  // 24px beside the content (16px on phones); the man page's 160px margins ease down through 48.
  const padding = padX === 'wide' ? 'px-4 sm:px-12 lg:px-[160px]' : 'px-4 sm:px-6';
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
      <div className="dock-group" data-print="hide">
        {dock ? <ShellDock info={shellInfo} /> : null}
        <NavBar dock={dock} />
      </div>
    </div>
  );
}
