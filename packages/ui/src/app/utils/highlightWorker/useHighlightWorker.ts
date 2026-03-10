import { useEffect, useRef, useState } from 'react';
// `?worker&inline` tells Vite to bundle the worker and its dependencies into
// a Blob URL at runtime. This is required for Figma, which uses
// vite-plugin-singlefile — regular file-based workers cannot be loaded from a
// URL in a single-file HTML output.
import HighlightWorker from './highlight.worker?worker&inline';

interface WorkerResponse {
  id: number;
  lines: string[];
}

export interface UseHighlightWorkerResult {
  /**
   * Per-line syntax-highlighted HTML strings, each self-contained (no unclosed
   * spans). Empty array while the first highlight is still pending.
   */
  lines: string[];
  /** True while the worker is processing. */
  highlighting: boolean;
}

/**
 * Runs hljs inside a Web Worker so the main thread stays responsive while
 * processing large outputs. Returns plain-text immediately (highlighting=true)
 * then switches to the highlighted HTML once the worker responds.
 *
 * The worker is created once and reused for every subsequent call, so only the
 * first invocation pays the startup cost.
 */
export function useHighlightWorker(code: string): UseHighlightWorkerResult {
  const [lines, setLines] = useState<string[]>([]);
  const [highlighting, setHighlighting] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  // Create the worker once on mount; terminate on unmount.
  useEffect(() => {
    workerRef.current = new HighlightWorker();
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Send a new highlight request whenever `code` changes.
  useEffect(() => {
    if (!code) {
      setLines([]);
      setHighlighting(false);
      return;
    }

    const worker = workerRef.current;
    if (!worker) return;

    const id = ++requestIdRef.current;
    setHighlighting(true);

    const handler = (e: MessageEvent<WorkerResponse>) => {
      // Discard responses from superseded requests (e.g. rapid re-generations).
      if (e.data.id !== id) return;
      setLines(e.data.lines);
      setHighlighting(false);
    };

    worker.addEventListener('message', handler);
    worker.postMessage({ id, code });

    return () => {
      worker.removeEventListener('message', handler);
    };
  }, [code]);

  return { lines, highlighting };
}
