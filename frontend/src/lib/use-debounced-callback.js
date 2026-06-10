import { useEffect, useMemo, useRef } from "react";

// Returns a stable debounced wrapper around `callback`. The most recent
// callback is always the one invoked (so it never goes stale), and any pending
// call is cancelled on unmount. Call `.cancel()` to drop a pending invocation.
export function useDebouncedCallback(callback, delayMs) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const timer = useRef(null);

  const debounced = useMemo(() => {
    const run = (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => callbackRef.current(...args), delayMs);
    };
    run.cancel = () => clearTimeout(timer.current);
    return run;
  }, [delayMs]);

  useEffect(() => debounced.cancel, [debounced]);

  return debounced;
}
