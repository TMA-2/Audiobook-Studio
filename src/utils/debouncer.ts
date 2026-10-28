/**
 * Creates a debouncer that runs `fn` once, `delayMs` after the last `schedule()` call.
 * @param fn Function to run when the delay elapses or `flush()` is called.
 * @param delayMs Quiet period in milliseconds before `fn` runs.
 */
export function createDebouncer(fn: () => void, delayMs: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return {
    /** Restarts the delay; `fn` runs when it elapses. */
    schedule() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        fn();
      }, delayMs);
    },
    /** Runs `fn` now if a call is pending. */
    flush() {
      if (!timer) return;
      clearTimeout(timer);
      timer = null;
      fn();
    },
    /** Drops a pending call without running `fn`. */
    cancel() {
      if (timer) clearTimeout(timer);
      timer = null;
    }
  };
}
