import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PrintButton } from '@/components/terminal/PrintButton';
import { ScrollX } from '@/components/terminal/ScrollX';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { achievements } from '@/content/achievements';
import { experience } from '@/content/experience';
import { leadership } from '@/content/leadership';
import { profile } from '@/content/profile';
import { projects } from '@/content/projects';
import { skillGroups } from '@/content/skills';
import { renderResume, type Segment } from '@/lib/resume';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'resume' };

const prompt = ROUTES.find((r) => r.key === 'resume')?.prompt ?? undefined;
const BUTTON = 'inline-flex min-h-11 items-center px-[18px] no-underline';
const SECONDARY = `${BUTTON} border border-line-strong text-fg hover:text-fg`;

const TONE = { rule: 'text-line-strong', heading: 'text-yellow', dim: 'text-fg-dim' } as const;

function Span({ segment }: { segment: Segment }) {
  const className = [segment.tone ? TONE[segment.tone] : '', segment.bold ? 'font-bold' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <span
      // Rule rows (`=====`) are decoration: a screen reader would spell them out.
      aria-hidden={segment.tone === 'rule' ? true : undefined}
      className={className || undefined}
      style={segment.size ? { fontSize: segment.size } : undefined}
    >
      {segment.text}
    </span>
  );
}

export default function ResumePage() {
  // Safety net: never ship a broken download link if the PDF goes missing.
  const hasPdf = existsSync(join(process.cwd(), 'public', profile.resume.href));
  const lines = renderResume({
    profile,
    experience,
    projects,
    leadership,
    achievements,
    skillGroups,
  });

  return (
    <TerminalPage prompt={prompt} className="leading-[1.55]">
      <h1 className="sr-only">Resume</h1>
      <div data-print="hide" className="flex flex-wrap justify-center gap-4">
        {hasPdf ? (
          <a
            href={profile.resume.href}
            download="kushal-shrestha-resume.pdf"
            className={`${BUTTON} bg-green text-bg hover:text-bg font-bold`}
          >
            wget {profile.resume.label}
          </a>
        ) : (
          <span className={`${BUTTON} text-fg-dim`}>wget {profile.resume.label} (coming soon)</span>
        )}
        <PrintButton className={`${SECONDARY} cursor-pointer font-[inherit]`} />
        <Link href="/" className={SECONDARY}>
          cd ~
        </Link>
      </div>
      {hasPdf ? (
        <p data-print="hide" className="text-fg-dim sm:hidden">
          tip: wget {profile.resume.label} for a phone-friendly copy
        </p>
      ) : null}
      <ScrollX label="resume" className="self-center">
        <pre className="resume-text w-[78ch] leading-[1.55] max-sm:text-[12px]">
          {lines.map((line, i) => (
            <span key={i}>
              {i > 0 ? '\n' : ''}
              {line.map((segment, j) => (
                <Span key={j} segment={segment} />
              ))}
            </span>
          ))}
        </pre>
      </ScrollX>
    </TerminalPage>
  );
}
