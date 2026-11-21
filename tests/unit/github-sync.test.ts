import { describe, expect, it } from 'vitest';
import { GITHUB_USER, repoStars } from '@/content/github';
import { projects } from '@/content/projects';
import {
  checkRepoResponse,
  diffSnapshots,
  featuredRepos,
  repoName,
  type GithubSnapshot,
} from '@/lib/github-sync';

describe('github sync', () => {
  it('reads repo names from the project source links', () => {
    expect(repoName('https://github.com/Kushal-Shr/Zenith', 'Kushal-Shr')).toBe('Zenith');
    expect(repoName('https://github.com/Kushal-Shr/Zenith/', 'Kushal-Shr')).toBe('Zenith');
    expect(repoName('https://github.com/someone/else', 'Kushal-Shr')).toBeUndefined();
    expect(repoName('https://example.com/Kushal-Shr/x', 'Kushal-Shr')).toBeUndefined();
  });

  it('tracks exactly the repos the projects link to, and content has stars for each', () => {
    const repos = featuredRepos(projects, GITHUB_USER);
    expect(repos).toEqual(['rant-and-heal-v2', 'Zenith', 'SurgiPath', 'AirDesk', 'NLN']);
    for (const repo of repos) expect(typeof repoStars[repo]).toBe('number');
  });

  it('reads the AirDesk badge from the synced star count', () => {
    const airdesk = projects.find((p) => p.slug === 'airdesk')!;
    expect(airdesk.badge).toBe(`★${repoStars.AirDesk} · python`);
  });

  it('summarises what changed', () => {
    const before: GithubSnapshot = { snapshotDate: 'a', repoCount: 43, stars: { A: 1, B: 0 } };
    const after: GithubSnapshot = { snapshotDate: 'b', repoCount: 45, stars: { A: 3, B: 0, C: 2 } };
    expect(diffSnapshots(before, after)).toEqual([
      'repoCount: 43 → 45',
      'stars A: 1 → 3',
      'stars C: (new) → 2',
    ]);
    expect(diffSnapshots(before, before)).toEqual([]);
  });

  it('fails loudly, naming the repo, for a missing or renamed one', () => {
    expect(checkRepoResponse('Zenith', 200, { name: 'Zenith', stargazers_count: 4 })).toBe(4);
    expect(() => checkRepoResponse('Zenith', 404, {})).toThrow(/"Zenith" was not found/);
    expect(() =>
      checkRepoResponse('Zenith', 200, { name: 'Zenith2', stargazers_count: 1 }),
    ).toThrow(/"Zenith" has been renamed to "Zenith2"/);
    expect(() => checkRepoResponse('Zenith', 500, {})).toThrow(/500/);
  });
});
