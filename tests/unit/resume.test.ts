import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { achievements, experience, leadership, profile, projects, skillGroups } from '@/content';
import { lineText, renderResume, RESUME_WIDTH } from '@/lib/resume';

const content = { profile, experience, projects, leadership, achievements, skillGroups };
const ours = renderResume(content).map(lineText);

function designLines(): string[] {
  const html = readFileSync(join(process.cwd(), 'design/artboards/Resume.dc.html'), 'utf8');
  const pre = /<pre style="align-self: center[^>]*>([\s\S]*?)<\/pre>/.exec(html)?.[1] ?? '';
  return pre
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .split('\n');
}

/** Minimal LCS line diff: `-` lines only in the design, `+` lines only in ours. */
function lineDiff(a: string[], b: string[]): string[] {
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i]![j] =
        a[i] === b[j] ? table[i + 1]![j + 1]! + 1 : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
    }
  }
  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else if (table[i + 1]![j]! >= table[i]![j + 1]!) out.push(`-${a[i++]}`);
    else out.push(`+${b[j++]}`);
  }
  while (i < a.length) out.push(`-${a[i++]}`);
  while (j < b.length) out.push(`+${b[j++]}`);
  return out;
}

describe('renderResume', () => {
  it(`never renders a line wider than ${RESUME_WIDTH} columns`, () => {
    expect(Math.max(...ours.map((l) => [...l].length))).toBeLessThanOrEqual(RESUME_WIDTH);
  });

  it('right-aligns dates at column 78', () => {
    const dated = ours.filter((l) => /\d{4}-\d{2} – (\d{4}-\d{2}|present)$/.test(l));
    expect(dated).toHaveLength(experience.length);
    for (const line of dated) expect([...line]).toHaveLength(RESUME_WIDTH);
  });

  it('lists only on-resume projects, so Sanctuary is absent', () => {
    expect(ours.some((l) => l.startsWith('Sanctuary'))).toBe(false);
    expect(ours.filter((l) => /^(Rant & Heal|Zenith|SurgiPath|AirDesk) /.test(l))).toHaveLength(4);
  });

  it('never contains a phone-like number', () => {
    expect(ours.join('\n')).not.toMatch(/\d{3}[-. ]\d{3}[-. ]\d{4}/);
  });

  it('matches the design artboard except for the decided differences', () => {
    expect(lineDiff(designLines(), ours)).toEqual([
      // Phase 2: Byte Bash 2.0 is a coding competition, not a hackathon.
      '-hackathon wins.',
      '+competition wins.',
      // Phase 2: the resume's real title is "Frontend Software Engineering Intern"; the date
      // column stays right-aligned at 78.
      '-Frontend Engineering Intern, Amigo Groups (remote)           2024-03 – 2024-06',
      '+Frontend Software Engineering Intern, Amigo Groups (remote)  2024-03 – 2024-06',
      // The resume (and Skills page) say "Apache Airflow"; the design shortened it, so the
      // line wraps one word earlier.
      '-AI & Data     LLM, scikit-learn, TensorFlow, Data Modeling, BigQuery, Airflow,',
      '-              Talend',
      '+AI & Data     LLM, scikit-learn, TensorFlow, Data Modeling, BigQuery, Apache',
      '+              Airflow, Talend',
    ]);
  });
});
