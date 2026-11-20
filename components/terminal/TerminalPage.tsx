import type { ReactNode } from 'react';
import { NavBar } from './NavBar';
import { TypedPrompt } from './TypedPrompt';

type TerminalPageProps = {
  prompt?: string;
  promptPath?: string;
  padX?: 'default' | 'wide';
  className?: string;
  children?: ReactNode;
};

export function TerminalPage({
  prompt,
  promptPath,
  padX = 'default',
  className = '',
  children,
}: TerminalPageProps) {
  const padding = padX === 'wide' ? 'px-[160px]' : 'px-6';

  return (
    <div className="flex min-h-dvh flex-col">
      <div className={`mx-auto flex w-full max-w-[1280px] flex-1 flex-col pt-6 pb-6 ${padding}`}>
        <main id="content" tabIndex={-1} className={`flex flex-col gap-6 ${className}`.trim()}>
          {prompt ? <TypedPrompt cmd={prompt} path={promptPath} /> : null}
          {children}
        </main>
      </div>
      <NavBar />
    </div>
  );
}
