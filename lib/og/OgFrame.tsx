import 'server-only';
import { ImageResponse } from 'next/og';
import type { ReactElement, ReactNode } from 'react';
import { BRAND } from '@/lib/brand';
import { ROUTES, type RouteKey } from '@/lib/routes';
import { ogFonts } from './fonts';

import { OG_HEIGHT, OG_WIDTH } from './size';

export const OG_SIZE = { width: OG_WIDTH, height: OG_HEIGHT } as const;

const FONT = 'JetBrains Mono';
const BAR_H = 52;

/** The tmux bar's tabs, in the same words as the real nav (`0:shell 1:dashboard …`). */
const TABS = ROUTES.map((r, i) => ({ key: r.key, text: `${i}:${r.label}` }));

type FrameProps = {
  /** The command the prompt shows, e.g. `cat README.md`. */
  cmd: string;
  /** The working directory in the prompt: `~`, `~/projects/zenith`. */
  cwd?: string;
  /** Which tab of the bar is current. */
  active: RouteKey;
  children: ReactNode;
};

const Prompt = ({ cmd, cwd }: { cmd: string; cwd: string }) => (
  <div style={{ display: 'flex', fontSize: 30, whiteSpace: 'pre', color: BRAND.fg }}>
    <span style={{ color: BRAND.green }}>guest@portfolio</span>
    <span style={{ color: BRAND.fgDim }}>:</span>
    <span style={{ color: BRAND.blue }}>{cwd}</span>
    <span style={{ color: BRAND.fgDim }}>$ </span>
    <span>{cmd}</span>
    <span style={{ color: BRAND.green, marginLeft: 4 }}>█</span>
  </div>
);

const TmuxBar = ({ active }: { active: RouteKey }) => {
  // One run of text with real spaces, like the real bar: the current tab is the only styled span.
  const at = TABS.findIndex((t) => t.key === active);
  const join = (tabs: typeof TABS) => tabs.map((t) => t.text).join(' ');
  const before = join(TABS.slice(0, at));
  const after = join(TABS.slice(at + 1));
  const current = TABS[at];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: BAR_H,
        padding: '0 18px',
        background: BRAND.green,
        color: BRAND.bg,
        fontSize: 16,
        whiteSpace: 'pre',
      }}
    >
      <span style={{ fontWeight: 700 }}>[kushal] </span>
      <span>{before ? `${before} ` : ''}</span>
      <span style={{ background: BRAND.bg, color: BRAND.green, fontWeight: 700, padding: '3px 0' }}>
        {current ? `${current.text}*` : ''}
      </span>
      <span>{after ? ` ${after}` : ''}</span>
    </div>
  );
};

/** The shared terminal window every social image is drawn in. */
export function OgFrame({ cmd, cwd = '~', active, children }: FrameProps) {
  return (
    <div
      style={{
        display: 'flex',
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        background: BRAND.bg,
        padding: 24,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: OG_SIZE.width - 48,
          height: OG_SIZE.height - 48,
          border: `1px solid ${BRAND.line}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            padding: '30px 40px 0',
          }}
        >
          <Prompt cmd={cmd} cwd={cwd} />
          <div style={{ display: 'flex', flexGrow: 1, paddingBottom: 28 }}>{children}</div>
        </div>
        <TmuxBar active={active} />
      </div>
    </div>
  );
}

/** Renders a frame to a PNG response (statically, at build time). */
export async function renderOg(element: ReactElement): Promise<ImageResponse> {
  return new ImageResponse(element, { ...OG_SIZE, fonts: await ogFonts() });
}

/**
 * JetBrains Mono has no `★`, and satori would then try to download a fallback font. The star is
 * drawn instead, so the build stays offline.
 */
function BadgeText({ text }: { text: string }) {
  const [first, ...rest] = text.split('★');
  return (
    <>
      {first}
      {rest.map((part, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', whiteSpace: 'pre' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" style={{ marginRight: 4 }}>
            <polygon
              points="12,1.5 15,8.6 22.5,9.3 16.8,14.2 18.5,21.6 12,17.7 5.5,21.6 7.2,14.2 1.5,9.3 9,8.6"
              fill="currentColor"
            />
          </svg>
          {part}
        </span>
      ))}
    </>
  );
}

/** A big green title with lines of text under it: the body of every non-home image. */
export function OgTitleBlock({
  title,
  lines,
  badge,
}: {
  title: string;
  lines: readonly string[];
  badge?: { text: string; tone: 'highlight' | 'dim' };
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flexGrow: 1,
        paddingTop: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: title.length > 14 ? 84 : 104,
          fontWeight: 700,
          color: BRAND.green,
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>
      {badge ? (
        <div style={{ display: 'flex', marginTop: 22 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              padding: '4px 16px',
              border: `1px solid ${badge.tone === 'highlight' ? BRAND.yellow : BRAND.lineStrong}`,
              color: badge.tone === 'highlight' ? BRAND.yellow : BRAND.fgDim,
            }}
          >
            <BadgeText text={badge.text} />
          </div>
        </div>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 28 }}>
        {lines.map((line, i) => (
          <div
            key={line}
            style={{
              display: 'flex',
              fontSize: 36,
              lineHeight: 1.35,
              color: i === 0 ? BRAND.fg : BRAND.fgDim,
              maxWidth: 1040,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
