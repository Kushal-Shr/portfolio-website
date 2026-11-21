/**
 * The few design tokens that code (not CSS) needs: social images, the manifest. Same values as
 * the `@theme` block in `app/globals.css`; tests/unit/brand.test.ts keeps the two in step.
 */
export const BRAND = {
  bg: '#0c0f0d',
  bgRaised: '#121713',
  fg: '#d4dccf',
  fgDim: '#8a9785',
  line: '#2a332b',
  lineStrong: '#3a463b',
  green: '#7ee787',
  blue: '#79c0ff',
  yellow: '#e3b341',
  portraitBg: '#d4dccf',
} as const;
