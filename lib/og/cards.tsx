import 'server-only';
import type { ReactElement } from 'react';
import { PORTRAIT } from '@/content/portrait';
import { profile } from '@/content/profile';
import { projects } from '@/content/projects';
import { BRAND } from '@/lib/brand';
import { routeDescriptions } from '@/lib/seo/copy';
import { OgFrame, OgTitleBlock } from './OgFrame';

/** 72 columns at 7px (4.2px per glyph) is 302px wide: small, but still recognisably a face. */
const PORTRAIT_FONT = 7;

/** The home image: a `neofetch` card, like the shell's. */
export function homeCard(): ReactElement {
  return (
    <OgFrame cmd="neofetch" active="shell">
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', paddingTop: 22 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: BRAND.portraitBg,
            color: BRAND.bg,
            padding: '10px 12px',
            fontSize: PORTRAIT_FONT,
            lineHeight: 1.125,
            whiteSpace: 'pre',
          }}
        >
          {PORTRAIT.slice(1).map((row, i) => (
            <div key={i} style={{ display: 'flex' }}>
              {row || ' '}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 56, flexGrow: 1 }}>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, color: BRAND.green }}>
            {profile.name}
          </div>
          <div style={{ display: 'flex', fontSize: 38, color: BRAND.fg, marginTop: 18 }}>
            {profile.role}
          </div>
          <div style={{ display: 'flex', fontSize: 34, color: BRAND.fgDim, marginTop: 8 }}>
            {profile.location}
          </div>
          <div style={{ display: 'flex', fontSize: 27, color: BRAND.yellow, marginTop: 34 }}>
            {`open to: ${profile.openTo.join(' · ')}`}
          </div>
        </div>
      </div>
    </OgFrame>
  );
}

export function projectsCard(): ReactElement {
  return (
    <OgFrame cmd="ls -l ~/projects" active="projects">
      <OgTitleBlock
        title="projects"
        lines={[`${projects.length} projects, one hackathon win`, routeDescriptions.projects]}
      />
    </OgFrame>
  );
}

export function journeyCard(): ReactElement {
  return (
    <OgFrame cmd="tail -f ~/journey/log" active="journey">
      <OgTitleBlock title="journey" lines={[routeDescriptions.journey]} />
    </OgFrame>
  );
}

export function resumeCard(): ReactElement {
  return (
    <OgFrame cmd="cat resume.txt" active="resume">
      <OgTitleBlock
        title="resume"
        lines={[profile.resumeHeadline, `${profile.name} · plain text, or download the PDF`]}
      />
    </OgFrame>
  );
}

/** One card per project: the prompt of its README, its name, its summary and its badge. */
export function projectCard(slug: string): ReactElement {
  const p = projects.find((item) => item.slug === slug);
  if (!p) throw new Error(`unknown project: ${slug}`);
  return (
    <OgFrame cmd="cat README.md" cwd={`~/projects/${p.slug}`} active="projects">
      <OgTitleBlock
        title={p.name}
        lines={[p.shortSummary]}
        badge={{ text: p.badge, tone: p.badgeTone }}
      />
    </OgFrame>
  );
}
