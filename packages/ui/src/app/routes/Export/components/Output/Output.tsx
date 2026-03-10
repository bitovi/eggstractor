import { FC, useState, useRef, useCallback, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { copyToClipboard, useHighlightWorker } from '../../../../utils';
import { useOnPluginMessage } from '../../../../hooks';
import { useGeneratedStyles } from '../../../../context';
import { Button, ExpandableCard } from '../../../../components';
import { CopyIcon } from '../CopyIcon';
import styles from './Output.module.scss';

/**
 * Line height in pixels: $size-xl (1rem = 16px) × line-height 1.5 = 24px.
 * Used as the fixed row size for the virtualizer.
 */
const LINE_HEIGHT_PX = 24;

const OutputInner: FC = () => {
  const { generatedStyles, setGeneratedStyles, warnings, setWarnings } = useGeneratedStyles();
  const [copied, setCopied] = useState(false);
  const [warningsExpanded, setWarningsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleOutputStyles = useCallback(
    (msg: { type: 'output-styles'; styles: string; warnings: string[]; errors: string[] }) => {
      setGeneratedStyles(msg.styles);
      setWarnings(msg.warnings || []);
    },
    [setGeneratedStyles, setWarnings],
  );

  useOnPluginMessage('output-styles', handleOutputStyles);

  // Runs hljs in a Web Worker so the main thread stays responsive while
  // processing large outputs. Returns per-line self-contained HTML strings
  // once done; empty array while pending.
  const { lines, highlighting } = useHighlightWorker(generatedStyles);

  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => LINE_HEIGHT_PX,
    overscan: 15,
  });

  if (!generatedStyles) {
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
    <div className={styles['code-sample']}>
      {warnings.length > 0 ? (
        <ExpandableCard
          title="Warnings"
          expanded={warningsExpanded}
          onToggle={() => setWarningsExpanded(!warningsExpanded)}
        >
          <ul className={styles['warnings-list']}>
            {warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </ExpandableCard>
      ) : null}
      <div className={styles['code-block']}>
        {/* Dedicated scroll container for the virtualizer. */}
        <div ref={scrollRef} className={styles['virtual-scroll']}>
          <Button
            variant="icon"
            type="button"
            onClick={onClick}
            className={styles['copy-button']}
            aria-label={copied ? 'Copied!' : 'Copy code to clipboard'}
          >
            <CopyIcon copied={copied} />
          </Button>
          {highlighting || lines.length === 0 ? (
            // Worker is still processing: show plain text as a lightweight
            // fallback so content is visible immediately.
            <pre className={styles['plain-text']}>{generatedStyles}</pre>
          ) : (
            // Worker done: render only the visible lines via the virtualizer.
            <div className={styles['virtual-list']} style={{ height: virtualizer.getTotalSize() }}>
              {virtualizer.getVirtualItems().map((item) => (
                <div
                  key={item.key}
                  className={styles['virtual-line']}
                  style={{ transform: `translateY(${item.start}px)` }}
                  dangerouslySetInnerHTML={{ __html: lines[item.index] ?? '' }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * React.memo prevents re-renders when parent state changes (e.g. the branch
 * name Input in Export) because Output receives no props. It will still
 * re-render when the shared GeneratedStylesContext values change.
 */
export const Output = memo(OutputInner);
