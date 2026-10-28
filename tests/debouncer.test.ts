import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDebouncer } from '../src/utils/debouncer';

describe('createDebouncer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('runs once after the delay for rapid calls', () => {
    const fn = vi.fn();
    const d = createDebouncer(fn, 300);
    d.schedule();
    vi.advanceTimersByTime(200);
    d.schedule();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('flush runs a pending call immediately and only once', () => {
    const fn = vi.fn();
    const d = createDebouncer(fn, 300);
    d.schedule();
    d.flush();
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('flush does nothing when nothing is pending', () => {
    const fn = vi.fn();
    createDebouncer(fn, 300).flush();
    expect(fn).not.toHaveBeenCalled();
  });

  it('cancel drops a pending call', () => {
    const fn = vi.fn();
    const d = createDebouncer(fn, 300);
    d.schedule();
    d.cancel();
    vi.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();
  });
});
