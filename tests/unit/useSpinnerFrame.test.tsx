// @vitest-environment happy-dom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSpinnerFrame } from '@/lib/hooks/useSpinnerFrame';

describe('useSpinnerFrame', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Unmount first: the timer is module state, shared by every test in this file.
    cleanup();
    vi.useRealTimers();
  });

  it('is null while inactive and starts no timer', () => {
    const { result } = renderHook(() => useSpinnerFrame(false));
    expect(result.current).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('advances one frame every 90ms', () => {
    const { result } = renderHook(() => useSpinnerFrame(true));
    const first = result.current;
    act(() => void vi.advanceTimersByTime(90));
    expect(result.current).toBe((first ?? 0) + 1);
  });

  it('runs one timer however many spinners are mounted, in step with each other', () => {
    const a = renderHook(() => useSpinnerFrame(true));
    const b = renderHook(() => useSpinnerFrame(true));
    expect(vi.getTimerCount()).toBe(1);
    act(() => void vi.advanceTimersByTime(270));
    expect(a.result.current).toBe(b.result.current);

    a.unmount();
    expect(vi.getTimerCount()).toBe(1);
    b.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
