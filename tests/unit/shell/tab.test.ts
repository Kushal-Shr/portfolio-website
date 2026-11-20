import { describe, expect, it } from 'vitest';
import { tabStep } from '@/lib/shell/tab';

describe('tabStep', () => {
  it('lets Tab keep its normal meaning with nothing to complete', () => {
    expect(tabStep('', { value: '', candidates: [] }, false).step).toEqual({ kind: 'native' });
    expect(tabStep('   ', { value: '   ', candidates: [] }, false).step).toEqual({
      kind: 'native',
    });
    expect(tabStep('zzz', { value: 'zzz', candidates: [] }, false).step).toEqual({
      kind: 'native',
    });
  });

  it('replaces the draft when completion makes progress', () => {
    expect(tabStep('cd pro', { value: 'cd projects/', candidates: [] }, true)).toEqual({
      step: { kind: 'replace', value: 'cd projects/' },
      stuck: false,
    });
  });

  it('waits on the first stuck Tab and lists candidates on the second', () => {
    const result = { value: 'c', candidates: ['cat', 'cd'] };
    const first = tabStep('c', result, false);
    expect(first).toEqual({ step: { kind: 'wait' }, stuck: true });
    expect(tabStep('c', result, first.stuck)).toEqual({
      step: { kind: 'list', items: ['cat', 'cd'] },
      stuck: false,
    });
  });
});
