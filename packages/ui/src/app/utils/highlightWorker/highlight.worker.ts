import hljs from 'highlight.js';

interface WorkerRequest {
  id: number;
  code: string;
}

interface WorkerResponse {
  id: number;
  lines: string[];
}

/**
 * Splits hljs-highlighted HTML into self-contained per-line strings.
 *
 * hljs spans can open on one line and close on another (e.g. block comments).
 * This function tracks the open-span stack and adds the necessary closing and
 * re-opening tags at each line boundary so every line can be rendered
 * independently inside a virtual list.
 */
function splitIntoLines(html: string): string[] {
  const rawLines = html.split('\n');
  const result: string[] = [];
  // Stack of opening tag strings that are still active (unclosed).
  const openSpans: string[] = [];

  for (const rawLine of rawLines) {
    // Prepend spans that were left open by the previous line.
    let processedLine = openSpans.join('') + rawLine;

    // Scan the raw line (before prefixing) to update the open-span stack.
    const tagRegex = /<(\/?)span([^>]*)>/g;
    let match;
    while ((match = tagRegex.exec(rawLine)) !== null) {
      if (match[1] === '/') {
        openSpans.pop();
      } else {
        openSpans.push(`<span${match[2]}>`);
      }
    }

    // Close any spans that are still open so this line is self-contained.
    processedLine += '</span>'.repeat(openSpans.length);
    result.push(processedLine);
  }

  return result;
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, code } = e.data;
  try {
    const highlighted = hljs.highlight(code, { language: 'scss' }).value;
    const lines = splitIntoLines(highlighted);
    self.postMessage({ id, lines } satisfies WorkerResponse);
  } catch {
    // Fall back to plain text split so the UI never gets stuck.
    self.postMessage({ id, lines: code.split('\n') } satisfies WorkerResponse);
  }
};
