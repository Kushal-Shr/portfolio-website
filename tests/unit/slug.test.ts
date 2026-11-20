import { describe, expect, it } from 'vitest';
import { slugify } from '@/lib/slug';

describe('slugify', () => {
  it.each([
    ['Python', 'python'],
    ['C++', 'cpp'],
    ['C#', 'csharp'],
    ['Next.js', 'nextjs'],
    ['Node.js', 'nodejs'],
    ['p5.js', 'p5js'],
    ['Tailwind CSS', 'tailwind-css'],
    ['REST APIs', 'rest-apis'],
    ['scikit-learn', 'scikit-learn'],
    ['Apache Airflow', 'apache-airflow'],
    ['OAuth 2.0', 'oauth2'],
  ])('%s -> %s', (name, slug) => {
    expect(slugify(name)).toBe(slug);
  });
});
