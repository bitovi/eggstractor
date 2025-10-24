import { FC, useState } from 'react';
import { copyToClipboard, highlightCode } from '../../../../utils';
import { useOnPluginMessage } from '../../../../hooks';
import { useGeneratedStyles } from '../../../../context';
import { Button, ExpandableCard } from '../../../../components';
import { CopyIcon } from '../CopyIcon';
import styles from './Output.module.scss';

export const Output: FC = () => {
  const { generatedStyles, setGeneratedStyles, warnings, setWarnings } = useGeneratedStyles();
  const [copied, setCopied] = useState(false);
  const [warningsExpanded, setWarningsExpanded] = useState(true);

  useOnPluginMessage('output-styles', (msg) => {
    setGeneratedStyles(msg.styles);
    setWarnings(msg.warnings || []);
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
      {warnings.length > 0 && (
        <ExpandableCard
          title="Warnings"
          expanded={warningsExpanded}
          setExpanded={setWarningsExpanded}
        >
          <ul className={styles['warnings-list']}>
            {warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </ExpandableCard>
      )}
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
            __html: generatedStyles
              ? highlightCode(generatedStyles)
              : 'Generated code will be displayed here...',
          }}
        />
      </div>
    </div>
  );
};
