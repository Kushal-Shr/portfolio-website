import { dayNumber, MONTH_NAMES, parseDay, weekday, WEEKDAY_NAMES } from './dates';
import { permalink, RSS_PATH } from './format';
import type { JourneyEntry } from './types';

export const RSS_LIMIT = 50;
export const RSS_TITLE = 'Kushal Shrestha — ~/journey';

// Characters XML 1.0 forbids outright; they would make the whole feed unreadable.
const INVALID_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

export function escapeXml(value: string): string {
  return value
    .replace(INVALID_XML, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pad = (n: number): string => String(n).padStart(2, '0');

/** America/Chicago's UTC offset on a calendar day at noon, as `-0600` / `-0500`. */
export function chicagoOffset(date: string): string {
  const { y, m, d } = parseDay(date);
  // Noon in Chicago is 17:00 or 18:00 UTC; DST switches at 2am, so noon is never ambiguous.
  const probe = new Date(Date.UTC(y, m - 1, d, 18));
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    timeZoneName: 'longOffset',
  })
    .formatToParts(probe)
    .find((p) => p.type === 'timeZoneName')?.value;
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name ?? '');
  return match ? `${match[1]}${match[2]}${match[3]}` : '-0600';
}

/** The entry's date at 12:00 America/Chicago, as RFC 822: `Thu, 19 Nov 2026 12:00:00 -0600`. */
export function pubDate(date: string): string {
  const day = parseDay(date);
  return `${WEEKDAY_NAMES[weekday(day)]}, ${pad(day.d)} ${MONTH_NAMES[day.m - 1]} ${day.y} 12:00:00 ${chicagoOffset(date)}`;
}

/** Every field of an entry as a small HTML fragment (escaped again for XML by the caller). */
function descriptionHtml(e: JourneyEntry): string {
  const row = (label: string, value: string) =>
    `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>`;
  const parts = [row('learned', e.learned), row('built', e.built)];
  if (e.builtLink) {
    const href = escapeHtml(e.builtLink);
    parts.push(`<p><a href="${href}">${href}</a></p>`);
  }
  if (e.stuckOn) parts.push(row('stuck on', e.stuckOn));
  parts.push(row('next', e.next));
  if (e.tags.length) parts.push(`<p>${e.tags.map((t) => `#${escapeHtml(t)}`).join(' ')}</p>`);
  if (e.bodyHtml) parts.push(e.bodyHtml);
  return parts.join('\n');
}

export type RssInput = {
  entries: readonly JourneyEntry[];
  siteUrl: string;
  /** `lastBuildDate`: passed in so the output is reproducible in tests. */
  now: Date;
};

/** RSS 2.0 for the newest `RSS_LIMIT` entries. */
export function buildRss({ entries, siteUrl, now }: RssInput): string {
  const base = siteUrl.replace(/\/+$/, '');
  const newest = [...entries]
    .sort((a, b) => dayNumber(parseDay(b.date)) - dayNumber(parseDay(a.date)))
    .slice(0, RSS_LIMIT);

  const items = newest.map((e) => {
    const url = `${base}${permalink(e.date)}`;
    return [
      '    <item>',
      `      <title>${escapeXml(`day ${e.day} · learned: ${e.learned}`)}</title>`,
      `      <link>${escapeXml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      `      <pubDate>${pubDate(e.date)}</pubDate>`,
      `      <description>${escapeXml(descriptionHtml(e))}</description>`,
      ...e.tags.map((t) => `      <category>${escapeXml(t)}</category>`),
      '    </item>',
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(RSS_TITLE)}</title>`,
    `    <link>${escapeXml(`${base}/journey/`)}</link>`,
    `    <atom:link href="${escapeXml(`${base}${RSS_PATH}`)}" rel="self" type="application/rss+xml"/>`,
    `    <description>${escapeXml('What Kushal learned and built, every single day.')}</description>`,
    '    <language>en-us</language>',
    `    <lastBuildDate>${now.toUTCString()}</lastBuildDate>`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}
