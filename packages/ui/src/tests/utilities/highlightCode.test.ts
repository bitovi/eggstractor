import hljs, { HighlightResult } from 'highlight.js';
import { highlightCode } from '../../app/utilities/highlightCode';

// Define the function signature you want for the mock
type HLHighlight = (
  code: string,
  opts: { language: string },
) => { value: string };

// Mock with a single generic (the function type)
vi.mock('highlight.js', () => ({
  default: {
    highlight: vi.fn<HLHighlight>(),
  },
}));

// 3) Get a typed mocked version
const mockedHljs = vi.mocked(hljs);

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('highlightCode', () => {
  it('calls hljs.highlight with provided language and returns value', () => {
    mockedHljs.highlight.mockReturnValue({
      value: '<span>ok</span>',
    } as HighlightResult);

    const code = 'body { color: red; }';
    const result = highlightCode(code, 'scss');

    expect(mockedHljs.highlight).toHaveBeenCalledWith(code, {
      language: 'scss',
    });
    expect(result).toBe('<span>ok</span>');
  });

  it('uses default language "scss" when none provided', () => {
    mockedHljs.highlight.mockReturnValue({
      value: '<em>default</em>',
    } as HighlightResult);

    const code = '$color: red;';
    const result = highlightCode(code);

    expect(mockedHljs.highlight).toHaveBeenCalledWith(code, {
      language: 'scss',
    });
    expect(result).toBe('<em>default</em>');
  });

  it('returns original code and logs when highlight.js throws', () => {
    const err = new Error('boom');
    mockedHljs.highlight.mockImplementation(() => {
      throw err;
    });

    const errorSpy = vi.spyOn(console, 'error').mockImplementationOnce(() => {
      /* stub */
    });

    const code = '.oops { }';
    const result = highlightCode(code, 'scss');

    expect(result).toBe(code);
    expect(errorSpy).toHaveBeenCalledWith('Failed to highlight code:', err);
  });
});
