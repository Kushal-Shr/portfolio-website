import snapshot from './github.json';

// A snapshot of github.com/Kushal-Shr, rewritten by `pnpm github:sync` (never by the build).
export const GITHUB_USER = 'Kushal-Shr';
export const repoCount: number = snapshot.repoCount;
export const snapshotDate: string = snapshot.snapshotDate;

/** Stars per repository name, for the repos the projects link to. */
export const repoStars: Readonly<Record<string, number>> = snapshot.stars;
