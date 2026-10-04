import { useCallback, useEffect, useRef, useState } from 'react';

/** Element width/height via ResizeObserver, for SVG charts that must be fluid. */
export function useMeasure() {
  const ref = useRef(null);
  const [rect, setRect] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setRect((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      );
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  return [ref, rect];
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Closes a panel on Escape and on any click outside of it. */
export function useDismiss(open, onClose) {
  const ref = useRef(null);

  const handler = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('keydown', handler);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', handler);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open, handler, onClose]);

  return ref;
}
