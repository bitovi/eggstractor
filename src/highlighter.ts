import hljs from 'highlight.js';
import scss from 'highlight.js/lib/languages/scss';

// Register the SCSS language
hljs.registerLanguage('scss', scss);

export function highlightCode(code: string, language: string = 'scss'): string {
  try {
    const result = hljs.highlight(code, { language }).value;
    return result;
  } catch (error) {
    console.error('Highlighting error:', error);
    console.warn('Failed to highlight code:', error);
    return code;
  }
} 