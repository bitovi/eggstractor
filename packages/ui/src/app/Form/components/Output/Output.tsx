import { FC, useState } from 'react';
import { copyToClipboard } from '../../../utilities/copyToClipboard';
import { useOnPluginMessage } from '../../../hooks';
import { useGeneratedStyles } from '../../../context/GeneratedStylesContext/GeneratedStylesContext';
import { highlightCode } from '../../../utilities/highlightCode';

export const Output: FC = () => {
  const { generatedStyles, setGeneratedStyles } = useGeneratedStyles();
  const [copied, setCopied] = useState(false);

  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  useOnPluginMessage('output-styles', (msg) => {
    setHighlightedCode(highlightCode(msg.styles));
    setGeneratedStyles(msg.styles);
  });

  if (!highlightedCode) {
    return null;
  }

  const onClick = () => {
    copyToClipboard(generatedStyles);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div id="output">
      <div className="output-header">
        <button
          type="button"
          id="copyButton"
          className="copy-button"
          aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
          title={copied ? 'Copied!' : 'Copy to clipboard'}
          onClick={onClick}
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <title>Check mark icon</title>
              <path
                d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <title>Copy icon</title>
              <path d="M2 4H1V14H11V13H2V4Z" fill="currentColor" />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M4 1H14V11H4V1ZM5 2H13V10H5V2Z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>
      </div>
      <pre dangerouslySetInnerHTML={{ __html: highlightedCode }} />
    </div>
  );
};
