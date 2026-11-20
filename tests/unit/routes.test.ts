import { describe, expect, it } from 'vitest';
import { activeRouteKey, ROUTES } from '@/lib/routes';

describe('activeRouteKey', () => {
  it('maps / to shell', () => {
    expect(activeRouteKey('/')).toBe('shell');
  });

  it.each(ROUTES.filter((r) => r.key !== 'shell'))('maps $href to $key', ({ href, key }) => {
    expect(activeRouteKey(href)).toBe(key);
  });

  it('handles missing trailing slashes', () => {
    expect(activeRouteKey('/projects')).toBe('projects');
  });

  it('handles nested paths', () => {
    expect(activeRouteKey('/journey/2026-11-19/')).toBe('journey');
  });

  it('falls back to shell for unknown paths', () => {
    expect(activeRouteKey('/nope/')).toBe('shell');
  });
});
