import { describe, expect, it } from 'vitest';
import { siteName } from '@/lib/site';

describe('sanity', () => {
  it('runs the test runner and resolves the @ alias', () => {
    expect(siteName).toBe('Kushal Shrestha');
  });
});
