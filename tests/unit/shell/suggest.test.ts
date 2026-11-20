import { describe, expect, it } from 'vitest';
import { ALL_COMMANDS } from '@/lib/shell/commands';
import { distance, suggest } from '@/lib/shell/suggest';

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
