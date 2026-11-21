export type GithubSnapshot = {
  snapshotDate: string;
  repoCount: number;
  stars: Record<string, number>;
};

/** The repository a project's `source` link points at: `https://github.com/Kushal-Shr/Zenith` → `Zenith`. */
export function repoName(sourceUrl: string, user: string): string | undefined {
  const match = new RegExp(`^https://github\\.com/${user}/([^/?#]+)/?$`, 'i').exec(sourceUrl);
  return match?.[1];
}

/** The repos to track: every project that links its source on the user's account. */
export function featuredRepos(
  projects: readonly { links: { source?: string } }[],
  user: string,
): string[] {
  const names = projects.flatMap((p) => {
    const name = p.links.source ? repoName(p.links.source, user) : undefined;
    return name ? [name] : [];
  });
  return [...new Set(names)];
}

/** One line per change, for the script's summary. Empty when nothing changed. */
export function diffSnapshots(before: GithubSnapshot, after: GithubSnapshot): string[] {
  const lines: string[] = [];
  if (before.repoCount !== after.repoCount) {
    lines.push(`repoCount: ${before.repoCount} → ${after.repoCount}`);
  }
  for (const [name, stars] of Object.entries(after.stars)) {
    const was = before.stars[name];
    if (was !== stars) lines.push(`stars ${name}: ${was ?? '(new)'} → ${stars}`);
  }
  for (const name of Object.keys(before.stars)) {
    if (!(name in after.stars)) lines.push(`stars ${name}: removed`);
  }
  return lines;
}

/** Throws with the repo's name when GitHub says it is gone or has been renamed. */
export function checkRepoResponse(
  name: string,
  status: number,
  body: { name?: string; stargazers_count?: number },
): number {
  if (status === 404)
    throw new Error(`featured repo "${name}" was not found (renamed or deleted?)`);
  if (status !== 200) throw new Error(`GitHub answered ${status} for "${name}"`);
  if (body.name !== name) {
    throw new Error(
      `featured repo "${name}" has been renamed to "${body.name}": update content/projects.ts`,
    );
  }
  if (typeof body.stargazers_count !== 'number') {
    throw new Error(`no star count in the answer for "${name}"`);
  }
  return body.stargazers_count;
}
