import { FC, useState, useMemo, useCallback, memo } from 'react';
import { copyToClipboard, highlightCode } from '../../../../utils';
import { useOnPluginMessage } from '../../../../hooks';
import { useGeneratedStyles } from '../../../../context';
import { Button, ExpandableCard } from '../../../../components';
import { CopyIcon } from '../CopyIcon';
import styles from './Output.module.scss';

const OutputInner: FC = () => {
  const { generatedStyles, setGeneratedStyles, warnings, setWarnings } = useGeneratedStyles();
  const [copied, setCopied] = useState(false);
  const [warningsExpanded, setWarningsExpanded] = useState(true);

  const handleOutputStyles = useCallback(
    (msg: { type: 'output-styles'; styles: string; warnings: string[]; errors: string[] }) => {
      setGeneratedStyles(msg.styles);
      setWarnings(msg.warnings || []);
    },
    [setGeneratedStyles, setWarnings],
  );

  useOnPluginMessage('output-styles', handleOutputStyles);

  /**
   * Memoised so hljs only runs when `generatedStyles` actually changes — not
   * on every re-render triggered by parent state (e.g. branch-name typing) or
   * local state (e.g. warnings expand/collapse toggle).
   */
  const highlightedCode = useMemo(() => {
    if (!generatedStyles) return null;
    return highlightCode(generatedStyles);
  }, [generatedStyles]);

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
        <Button
          variant="icon"
          type="button"
          onClick={onClick}
          className={styles['copy-button']}
          aria-label={copied ? 'Copied!' : 'Copy code to clipboard'}
        >
          <CopyIcon copied={copied} />
        </Button>
        <pre
          dangerouslySetInnerHTML={{
            __html: highlightedCode ?? generatedStyles,
          }}
        />
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
