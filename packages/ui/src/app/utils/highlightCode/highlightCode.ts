import hljs from 'highlight.js';

export const highlightCode = (code: string, language = 'scss'): string => {
  try {
    const result = hljs.highlight(code, { language }).value;
    return result;
  } catch (error) {
    console.error('Failed to highlight code:', error);
    return code;
  }
};
