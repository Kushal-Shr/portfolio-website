import type { Line, Segment, Tone } from './types';

export function seg(text: string, tone?: Tone, bold?: boolean): Segment {
  const s: Segment = { text };
  if (tone) s.tone = tone;
  if (bold) s.bold = true;
  return s;
}

export const text = (value: string, tone?: Tone, bold?: boolean): Line => ({
  kind: 'text',
  segments: [seg(value, tone, bold)],
});

export const link = (prefix: string, label: string, href: string, external?: boolean): Line => {
  const line: Line = { kind: 'link', text: label, href };
  if (prefix) line.prefix = prefix;
  if (external) line.external = true;
  return line;
};
