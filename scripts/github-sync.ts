/* eslint-disable no-console -- a CLI script: its output is the console */
// Refreshes content/github.json from the public GitHub API: the repo count and the stars of the
// repos the projects link to. Run by hand (`pnpm github:sync`), then commit the change. The build
// never calls it, so builds stay offline and deterministic.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GITHUB_USER } from '../content/github';
import { projects } from '../content/projects';
import {
  checkRepoResponse,
  diffSnapshots,
  featuredRepos,
  type GithubSnapshot,
} from '../lib/github-sync';

const API = 'https://api.github.com';
const FILE = join(process.cwd(), 'content', 'github.json');

const headers: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'portfolio-github-sync',
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

async function get(path: string): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await fetch(`${API}${path}`, { headers });
  if (res.status === 403 || res.status === 429) {
    throw new Error(
      `GitHub rate limit hit (${res.status}). Set GITHUB_TOKEN to raise it and run again.`,
    );
  }
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function main() {
  const before = JSON.parse(readFileSync(FILE, 'utf8')) as GithubSnapshot;

  const user = await get(`/users/${GITHUB_USER}`);
  if (user.status !== 200 || typeof user.body.public_repos !== 'number') {
    throw new Error(`could not read github.com/${GITHUB_USER} (status ${user.status})`);
  }

  const stars: Record<string, number> = {};
  for (const name of featuredRepos(projects, GITHUB_USER)) {
    const repo = await get(`/repos/${GITHUB_USER}/${name}`);
    stars[name] = checkRepoResponse(name, repo.status, repo.body);
  }

  const after: GithubSnapshot = {
    snapshotDate: new Date().toISOString().slice(0, 10),
    repoCount: user.body.public_repos,
    stars,
  };
  writeFileSync(FILE, `${JSON.stringify(after, null, 2)}\n`);

  const changes = diffSnapshots(before, after);
  console.log(`github.com/${GITHUB_USER}: snapshot ${before.snapshotDate} → ${after.snapshotDate}`);
  console.log(changes.length ? changes.map((c) => `  ${c}`).join('\n') : '  no changes');
  if (changes.length) console.log('Review `git diff content/github.json`, then commit it.');
}

main().catch((error: unknown) => {
  console.error(`github:sync failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
