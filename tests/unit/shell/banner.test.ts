import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { BANNER } from '@/components/shell/banner';
import { hasDesign } from '../design-files';

it.skipIf(!hasDesign)('matches the banner in the Main artboard', () => {
  const html = readFileSync(join(process.cwd(), 'design/artboards/Main.dc.html'), 'utf8');
  const match =
    /<pre aria-hidden="true" style="color: \{\{accent\}\}; line-height: 1.2">([\s\S]*?)<\/pre>/.exec(
      html,
    );
  expect(BANNER).toBe(match?.[1]);
});
