import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * `design/` is gitignored (it stays on Kushal's machine), so a fresh clone or CI has no
 * artboards. Tests that compare against the design skip there instead of failing.
 */
export const hasDesign = existsSync(join(process.cwd(), 'design/artboards/Main.dc.html'));
