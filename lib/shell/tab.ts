import type { Completion } from './complete';

export type TabStep =
  | { kind: 'native' }
  | { kind: 'replace'; value: string }
  | { kind: 'wait' }
  | { kind: 'list'; items: string[] };

/**
 * What Tab should do, as bash does it: complete if that makes progress, otherwise the first Tab
 * waits and a second consecutive Tab lists the candidates. With nothing to complete the key keeps
 * its normal meaning, so keyboard users are never trapped.
 */
export function tabStep(
  draft: string,
  result: Completion,
  stuck: boolean,
): { step: TabStep; stuck: boolean } {
  if (!draft.trim()) return { step: { kind: 'native' }, stuck: false };
  if (result.value !== draft)
    return { step: { kind: 'replace', value: result.value }, stuck: false };
  if (result.candidates.length > 0) {
    return stuck
      ? { step: { kind: 'list', items: result.candidates }, stuck: false }
      : { step: { kind: 'wait' }, stuck: true };
  }
  return { step: { kind: 'native' }, stuck: false };
}
