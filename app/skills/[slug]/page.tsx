import type { Metadata } from 'next';
import Link from 'next/link';
import { AsciiArt } from '@/components/detail/AsciiArt';
import { MetaGrid, type MetaRow } from '@/components/detail/MetaGrid';
import { PageTrail } from '@/components/detail/PageTrail';
import { WriteUp } from '@/components/detail/WriteUp';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { skillArt } from '@/content/art';
import { skillGroups } from '@/content/skills';
import { trailFor, usageOf } from '@/lib/detail';
import { loadSiteTree } from '@/lib/site-load';
import { skillEntries } from '@/lib/site-tree';
import { loadWriteup } from '@/lib/writeups';

export const dynamicParams = false;

const skills = skillEntries(skillGroups);

export const generateStaticParams = () => skills.map((s) => ({ slug: s.slug }));

type Props = { params: Promise<{ slug: string }> };

const find = async (params: Props['params']) => {
  const { slug } = await params;
  const skill = skills.find((s) => s.slug === slug);
  if (!skill) throw new Error(`unknown skill: ${slug}`);
  return skill;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await find(params);
  return {
    title: s.name,
    description: `${s.name}: where it shows up in Kushal's projects and jobs.`,
  };
}

const joinLinks = (items: { href: string; label: string }[]) =>
  items.map((item, i) => (
    <span key={item.href}>
      {i > 0 ? ', ' : ''}
      <Link href={item.href}>{item.label}</Link>
    </span>
  ));

export default async function SkillPage({ params }: Props) {
  const skill = await find(params);
  const notes = await loadWriteup('skills', skill.slug);
  const { projects, jobs } = usageOf(skill);

  const rows: MetaRow[] = [
    { label: 'Package:', labelClass: 'font-bold', value: <h1 className="inline">{skill.name}</h1> },
    {
      label: 'Section:',
      labelClass: 'font-bold',
      value: <Link href={`/skills/?section=${skill.group}`}>{skill.group}</Link>,
    },
    { label: 'Status:', labelClass: 'font-bold', value: 'install ok installed' },
    {
      label: 'Projects:',
      labelClass: 'font-bold',
      value: projects.length ? (
        joinLinks(projects.map((p) => ({ href: `/projects/${p.slug}/`, label: p.slug })))
      ) : (
        <span className="text-fg-dim">(on the resume — no project page uses it yet)</span>
      ),
    },
  ];
  if (jobs.length) {
    rows.push({
      label: 'Jobs:',
      labelClass: 'font-bold',
      value: joinLinks(jobs.map((e) => ({ href: `/experience/${e.id}/`, label: e.id }))),
    });
  }

  return (
    <TerminalPage prompt={`apt show ${skill.slug}`} promptPath="~/skills">
      <div className="flex gap-8 max-[900px]:flex-col">
        {skillArt[skill.name] ? <AsciiArt art={skillArt[skill.name] ?? ''} /> : null}
        <div className="min-w-0 flex-1">
          <MetaGrid rows={rows} />
        </div>
      </div>

      <WriteUp html={notes.html} name={skill.name} optional />

      <PageTrail trail={trailFor(await loadSiteTree(), `~/skills/${skill.slug}`)} />
    </TerminalPage>
  );
}
