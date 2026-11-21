import { describe, expect, it } from 'vitest';
import { ALL_COMMANDS } from '@/lib/shell/commands';
import { distance, suggest, suggestPage } from '@/lib/shell/suggest';
import { siteTree } from '@/lib/site-data';
import { flatten } from '@/lib/site-tree';

describe('distance', () => {
  it('counts a transposition as one edit', () => {
    expect(distance('sl', 'ls')).toBe(1);
    expect(distance('cta', 'cat')).toBe(1);
  });

  it('counts insertions, deletions and substitutions', () => {
    expect(distance('nefetch', 'neofetch')).toBe(1);
    expect(distance('kitten', 'sitting')).toBe(3);
    expect(distance('', 'abc')).toBe(3);
  });
});

describe('suggest', () => {
  it.each([
    ['sl', 'ls'],
    ['nefetch', 'neofetch'],
    ['cta', 'cat'],
    ['hlep', 'help'],
    ['whoam', 'whoami'],
  ])('suggests %s -> %s', (typo, expected) => {
    expect(suggest(typo, ALL_COMMANDS)).toBe(expected);
  });

  it('stays quiet for unrelated words', () => {
    expect(suggest('foo', ALL_COMMANDS)).toBeUndefined();
    expect(suggest('xyzzy', ALL_COMMANDS)).toBeUndefined();
  });
});

describe('suggestPage (the 404 page)', () => {
  const hrefs = flatten(siteTree).flatMap((n) => (n.href ? [n.href] : []));

  it.each([
    ['/projects/zenit/', '/projects/zenith/'],
    ['/skills/pyhton/', '/skills/python/'],
    ['/project/', '/projects/'],
    ['/projects/zenit', '/projects/zenith/'],
    ['/Projects/Zenith/', '/projects/zenith/'],
    ['/experiance/', '/experience/'],
    ['/abuot/', '/about/'],
  ])('%s -> %s', (typo, expected) => {
    expect(suggestPage(typo, hrefs)).toBe(expected);
  });

  it.each([
    ['/projects/nope/', '/projects/'],
    ['/skills/nope/', '/skills/'],
    ['/experience/zzz/', '/experience/'],
    ['/projects/zenith/nope/', '/projects/zenith/'],
    ['/leadership/achievements/nope/', '/leadership/achievements/'],
    ['/journey/2020-01-01/', '/journey/'],
  ])('falls back to the nearest page above: %s -> %s', (missing, expected) => {
    expect(suggestPage(missing, hrefs)).toBe(expected);
  });

  it('suggests nothing when the path is not a plausible typo', () => {
    expect(suggestPage('/that/path/', hrefs)).toBeUndefined();
    expect(suggestPage('/wp-admin/login.php', hrefs)).toBeUndefined();
  });

  it('never suggests the home page for a short miss', () => {
    expect(suggestPage('/ab/', hrefs)).not.toBe('/');
  });

  it('ignores query strings and hashes', () => {
    expect(suggestPage('/skills/pyhton/?x=1#y', hrefs)).toBe('/skills/python/');
  });
});
