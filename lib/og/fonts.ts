import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

type OgFont = { name: string; data: Buffer; weight: 400 | 700; style: 'normal' };

let cached: Promise<OgFont[]> | undefined;

/**
 * JetBrains Mono for the social images, read from `assets/fonts` (vendored, OFL). Read from disk
 * so the build never touches the network.
 */
export function ogFonts(): Promise<OgFont[]> {
  cached ??= Promise.all(
    (
      [
        ['Regular', 400],
        ['Bold', 700],
      ] as const
    ).map(async ([file, weight]) => ({
      name: 'JetBrains Mono',
      data: await readFile(join(process.cwd(), 'assets', 'fonts', `JetBrainsMono-${file}.ttf`)),
      weight,
      style: 'normal' as const,
    })),
  );
  return cached;
}
