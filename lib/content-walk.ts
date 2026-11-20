export type Visit = (value: unknown, path: string) => void;

/** Depth-first walk over plain data, calling `visit` on every node with a readable path. */
export function walk(value: unknown, path: string, visit: Visit): void {
  visit(value, path);
  if (Array.isArray(value)) {
    value.forEach((item, i) => walk(item, `${path}[${i}]`, visit));
  } else if (typeof value === 'object' && value !== null) {
    for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`, visit);
  }
}
