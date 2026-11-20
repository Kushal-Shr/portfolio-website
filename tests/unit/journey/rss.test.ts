import { describe, expect, it } from 'vitest';
import { buildRss, chicagoOffset, escapeXml, pubDate } from '@/lib/journey/rss';
import type { JourneyEntry } from '@/lib/journey/types';
import { fixtureEntries } from '../shell/helpers';

type XmlNode = { name: string; attrs: Record<string, string>; text: string; children: XmlNode[] };

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = (s: string) => {
  if (/&(?!(amp|lt|gt|quot|apos|#\d+);)/.test(s)) throw new Error(`bare & in: ${s.slice(0, 40)}`);
  return s.replace(/&(amp|lt|gt|quot|apos);/g, (_, e: string) => ENTITIES[e] ?? '');
};

/** A deliberately strict, tiny XML reader: balanced tags, quoted attributes, no bare `<` or `&`. */
function parseXml(xml: string): XmlNode {
  const body = xml.replace(/^<\?xml[^?]*\?>\s*/, '');
  const root: XmlNode = { name: '#root', attrs: {}, text: '', children: [] };
  const stack = [root];
  const tag = /<(\/?)([A-Za-z][\w:.-]*)((?:\s+[\w:.-]+="[^"<]*")*)\s*(\/?)>/y;
  let i = 0;
  while (i < body.length) {
    const lt = body.indexOf('<', i);
    const top = stack.at(-1)!;
    const chunk = body.slice(i, lt === -1 ? body.length : lt);
    if (chunk.includes('>')) throw new Error(`stray > in text: ${chunk.slice(0, 40)}`);
    top.text += decode(chunk);
    if (lt === -1) break;
    tag.lastIndex = lt;
    const m = tag.exec(body);
    if (!m) throw new Error(`malformed tag at ${lt}: ${body.slice(lt, lt + 40)}`);
    const [, close, name = '', rawAttrs = '', selfClose] = m;
    if (close) {
      const open = stack.pop();
      if (open?.name !== name) throw new Error(`</${name}> closes <${open?.name}>`);
    } else {
      const attrs: Record<string, string> = {};
      for (const a of rawAttrs.matchAll(/([\w:.-]+)="([^"]*)"/g)) attrs[a[1]!] = decode(a[2]!);
      const node: XmlNode = { name, attrs, text: '', children: [] };
      top.children.push(node);
      if (!selfClose) stack.push(node);
    }
    i = tag.lastIndex;
  }
  if (stack.length !== 1) throw new Error(`unclosed <${stack.at(-1)?.name}>`);
  if (root.children.length !== 1) throw new Error('more than one root element');
  return root.children[0]!;
}

const kids = (n: XmlNode | undefined, name: string) =>
  n?.children.filter((c) => c.name === name) ?? [];
const child = (n: XmlNode | undefined, name: string) => kids(n, name)[0];

const tricky: JourneyEntry = {
  date: '2026-11-18',
  slug: '2026-11-18',
  day: 3,
  learned: `Tom & Jerry's <script>alert("x")</script> 🚀`,
  built: 'A > B && C < D',
  builtLink: 'https://example.com/?a=1&b=2',
  stuckOn: `"quotes" and 'apostrophes'`,
  next: 'ok',
  tags: ['rss', 'xml-escaping'],
  bodyHtml: '<p>notes &amp; more</p>',
};

const now = new Date(Date.UTC(2026, 10, 20, 17, 0));
const feed = (entries: readonly JourneyEntry[]) =>
  parseXml(buildRss({ entries, siteUrl: 'https://example.com/', now }));

describe('rss dates', () => {
  it('uses noon in Chicago, CST or CDT as the day requires', () => {
    expect(chicagoOffset('2026-11-19')).toBe('-0600');
    expect(chicagoOffset('2026-07-04')).toBe('-0500');
    expect(chicagoOffset('2026-11-01')).toBe('-0600'); // DST ended at 2am that day
    expect(chicagoOffset('2026-03-08')).toBe('-0500'); // DST started at 2am that day
    expect(pubDate('2026-11-19')).toBe('Thu, 19 Nov 2026 12:00:00 -0600');
    expect(pubDate('2026-07-04')).toBe('Sat, 04 Jul 2026 12:00:00 -0500');
  });
});

describe('rss', () => {
  it('escapes XML', () => {
    expect(escapeXml(`<a href="x">&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;',
    );
    expect(escapeXml('bad\u0000\u0008char')).toBe('badchar');
  });

  it('is a well-formed RSS 2.0 channel', () => {
    const rss = feed([tricky]);
    expect(rss.name).toBe('rss');
    expect(rss.attrs.version).toBe('2.0');
    const channel = child(rss, 'channel');
    expect(child(channel, 'title')?.text).toBe('Kushal Shrestha — ~/journey');
    expect(child(channel, 'link')?.text).toBe('https://example.com/journey/');
    expect(child(channel, 'atom:link')?.attrs.href).toBe('https://example.com/journey/rss.xml');
    expect(child(channel, 'lastBuildDate')?.text).toBe('Fri, 20 Nov 2026 17:00:00 GMT');
    expect(child(channel, 'description')?.text).toBeTruthy();
  });

  it('round-trips a tricky entry exactly (&, <, quotes, emoji)', () => {
    const item = child(child(feed([tricky]), 'channel'), 'item');
    expect(child(item, 'title')?.text).toBe(`day 3 · learned: ${tricky.learned}`);
    expect(child(item, 'link')?.text).toBe('https://example.com/journey/2026-11-18/');
    expect(child(item, 'guid')).toMatchObject({
      attrs: { isPermaLink: 'true' },
      text: 'https://example.com/journey/2026-11-18/',
    });
    expect(child(item, 'pubDate')?.text).toBe('Wed, 18 Nov 2026 12:00:00 -0600');
    expect(kids(item, 'category').map((c) => c.text)).toEqual(['rss', 'xml-escaping']);

    // The description is HTML: escaped once for HTML, then once more for XML.
    const html = child(item, 'description')?.text ?? '';
    expect(html).toContain(
      "<p><strong>learned:</strong> Tom &amp; Jerry's &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; 🚀</p>",
    );
    expect(html).toContain('<strong>built:</strong> A &gt; B &amp;&amp; C &lt; D');
    expect(html).toContain('<a href="https://example.com/?a=1&amp;b=2">');
    expect(html).toContain("<strong>stuck on:</strong> &quot;quotes&quot; and 'apostrophes'");
    expect(html).toContain('#rss #xml-escaping');
    expect(html).toContain('<p>notes &amp; more</p>');
    expect(html).not.toContain('<script>');
  });

  it('keeps the newest 50, newest first', () => {
    const many = Array.from({ length: 60 }, (_, i): JourneyEntry => ({
      ...tricky,
      date: `2026-09-${String((i % 30) + 1).padStart(2, '0')}`.replace(
        /^2026-09/,
        i < 30 ? '2026-09' : '2026-10',
      ),
      day: i + 1,
    }));
    const items = kids(child(feed(many), 'channel'), 'item');
    expect(items).toHaveLength(50);
    expect(child(items[0], 'link')?.text).toBe('https://example.com/journey/2026-10-30/');
  });

  it('is valid with no entries, and with every fixture', () => {
    expect(kids(child(feed([]), 'channel'), 'item')).toHaveLength(0);
    expect(kids(child(feed(fixtureEntries), 'channel'), 'item')).toHaveLength(38);
  });
});
