import { useEffect, useMemo, useRef } from "react";

interface DebouncedCallback<Args extends unknown[]> {
  (...args: Args): void;
  cancel: () => void;
}

// Returns a stable debounced wrapper around `callback`. The most recent
// callback is always the one invoked (so it never goes stale), and any pending
// call is cancelled on unmount. Call `.cancel()` to drop a pending invocation.
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number
): DebouncedCallback<Args> {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const debounced = useMemo(() => {
    const run = ((...args: Args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => callbackRef.current(...args), delayMs);
    }) as DebouncedCallback<Args>;
    run.cancel = () => clearTimeout(timer.current);
    return run;
  }, [delayMs]);

  useEffect(() => debounced.cancel, [debounced]);

  return debounced;
}
