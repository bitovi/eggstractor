import hljs from 'highlight.js';

interface WorkerRequest {
  id: number;
  code: string;
}

interface WorkerResponse {
  id: number;
  result: string;
}

// `globalThis` is the spec-compliant way to reference the worker global scope.
// `self` is equivalent but is banned by the no-restricted-globals ESLint rule
// because it can be a footgun in regular browser code.
const ctx = globalThis as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, code } = e.data;
  try {
    const result = hljs.highlight(code, { language: 'scss' }).value;
    ctx.postMessage({ id, result } satisfies WorkerResponse);
  } catch {
    // Fall back to plain text so the UI never gets stuck
    ctx.postMessage({ id, result: code } satisfies WorkerResponse);
  }
};
