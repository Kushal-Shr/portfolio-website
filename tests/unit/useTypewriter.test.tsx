// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTypewriter } from '@/lib/hooks/useTypewriter';

function mockMatchMedia(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  window.matchMedia = globalThis.matchMedia;
}

describe('useTypewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('types to completion one character per tick', () => {
    const { result } = renderHook(() => useTypewriter('abc', { speed: 50 }));
    expect(result.current).toMatchObject({ shown: '', done: false, pending: false });

    act(() => void vi.advanceTimersByTime(50));
    expect(result.current.shown).toBe('a');
    act(() => void vi.advanceTimersByTime(100));
    expect(result.current).toMatchObject({ shown: 'abc', done: true });
  });

  it('honours startDelay', () => {
    const { result } = renderHook(() => useTypewriter('ab', { speed: 10, startDelay: 100 }));
    act(() => void vi.advanceTimersByTime(90));
    expect(result.current.shown).toBe('');
    act(() => void vi.advanceTimersByTime(20));
    expect(result.current.shown).toBe('a');
  });

  it('shows the full text immediately under reduced motion', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useTypewriter('abc', { speed: 50 }));
    expect(result.current).toEqual({ shown: 'abc', done: true, pending: false });
  });

  it('shows the full text when disabled', () => {
    const { result } = renderHook(() => useTypewriter('abc', { speed: 50, enabled: false }));
    expect(result.current).toEqual({ shown: 'abc', done: true, pending: false });
  });

  it('restarts when the text changes', () => {
    const { result, rerender } = renderHook(({ text }) => useTypewriter(text, { speed: 10 }), {
      initialProps: { text: 'one' },
    });
    act(() => void vi.advanceTimersByTime(100));
    expect(result.current.shown).toBe('one');

    rerender({ text: 'two!' });
    expect(result.current.shown).toBe('');
    act(() => void vi.advanceTimersByTime(20));
    expect(result.current.shown).toBe('tw');
    act(() => void vi.advanceTimersByTime(100));
    expect(result.current).toMatchObject({ shown: 'two!', done: true });
  });
});
