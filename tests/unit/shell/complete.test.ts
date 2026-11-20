import { describe, expect, it } from 'vitest';
import { complete } from '@/lib/shell/complete';
import { ctx, state } from './helpers';

const tab = (input: string, cwd = '~') => complete(input, state(cwd), ctx);

describe('complete: commands', () => {
  it('completes a unique command with a trailing space', () => {
    expect(tab('ne')).toEqual({ value: 'neofetch ', candidates: [] });
  });

  it('lists candidates when nothing more can be added', () => {
    expect(tab('c')).toEqual({ value: 'c', candidates: ['cat', 'cd', 'clear', 'contact'] });
  });

  it('extends to the longest common prefix', () => {
    expect(tab('he')).toEqual({ value: 'help ', candidates: [] });
    expect(tab('t')).toEqual({ value: 't', candidates: ['tail', 'tldr', 'tree'] });
    expect(tab('tr')).toEqual({ value: 'tree ', candidates: [] });
  });

  it('does nothing for an empty line or an unknown prefix', () => {
    expect(tab('')).toEqual({ value: '', candidates: [] });
    expect(tab('zzz')).toEqual({ value: 'zzz', candidates: [] });
  });
});

describe('complete: paths', () => {
  it('completes a directory with a trailing slash', () => {
    expect(tab('cd pro')).toEqual({ value: 'cd projects/', candidates: [] });
  });

  it('completes nested paths', () => {
    expect(tab('cd projects/ze')).toEqual({ value: 'cd projects/zenith/', candidates: [] });
    expect(tab('cat projects/zenith/R')).toEqual({
      value: 'cat projects/zenith/README.md',
      candidates: [],
    });
  });

  it('completes relative to cwd and through ../', () => {
    expect(tab('cat ze', '~/projects')).toEqual({ value: 'cat zenith/', candidates: [] });
    expect(tab('cat ../pro', '~/leadership')).toEqual({
      value: 'cat ../projects/',
      candidates: [],
    });
  });

  it('extends to a common prefix before listing', () => {
    expect(tab('cat projects/s')).toEqual({
      value: 'cat projects/s',
      candidates: ['surgipath/', 'sanctuary/'].sort(),
    });
    expect(tab('cat projects/su')).toEqual({ value: 'cat projects/surgipath/', candidates: [] });
  });

  it('lists all entries for an empty word', () => {
    const r = tab('ls ');
    expect(r.value).toBe('ls ');
    expect(r.candidates).toContain('projects/');
    expect(r.candidates).toContain('about.md');
  });

  it('only offers directories to cd', () => {
    expect(tab('cd a')).toEqual({ value: 'cd a', candidates: [] });
    expect(tab('cat a')).toEqual({ value: 'cat about.md', candidates: [] });
  });

  it('does nothing for a missing directory', () => {
    expect(tab('cat nope/x')).toEqual({ value: 'cat nope/x', candidates: [] });
  });
});
