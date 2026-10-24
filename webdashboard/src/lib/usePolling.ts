import { useEffect, useRef } from 'react';

/** Lightweight interval poll — pauses when tab hidden. */
export function usePolling(fn: () => void | Promise<void>, ms: number, enabled = true) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled || ms <= 0) return;
    let timer: ReturnType<typeof setInterval> | undefined;

    const tick = () => {
      if (document.visibilityState === 'hidden') return;
      void fnRef.current();
    };

    timer = setInterval(tick, ms);
    const onVis = () => {
      if (document.visibilityState === 'visible') void fnRef.current();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [ms, enabled]);
}
