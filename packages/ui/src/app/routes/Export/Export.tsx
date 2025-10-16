import { FC, useState, FormEvent } from 'react';
import { getValidStylesheetFormat } from '@eggstractor/common';
import { messageMainThread } from '../../utils';
import { useConfig } from '../../context';
import { useOnPluginMessage } from '../../hooks';
import { Button, StepperStep, Card, Input } from '../../components';
import styles from './Export.module.scss';

type ExportStep = 'generate' | 'generating' | 'publish' | 'done';

export const Export: FC = () => {
  const { format, useCombinatorialParsing } = useConfig();
  const [currentStep, setCurrentStep] = useState<ExportStep>('generate');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [branchName, setBranchName] = useState('change-text-to-purple');
  const [generatedStyles, setGeneratedStyles] = useState('');

  useOnPluginMessage('progress-start', () => {
    setCurrentStep('generating');
    setProgress(0);
    setProgressMessage('Starting...');
  });

  useOnPluginMessage('progress-update', (msg) => {
    setProgress(msg.progress);
    setProgressMessage(msg.message);
    messageMainThread({ type: 'progress-updated', id: msg.id });
  });

  useOnPluginMessage('progress-end', () => {
    setProgress(100);
    setProgressMessage('Complete!');
  });

  useOnPluginMessage('output-styles', (msg) => {
    setGeneratedStyles(msg.styles);
    // Transition to publish state after a short delay
    setTimeout(() => {
      setCurrentStep('publish');
    }, 1000);
  });

  const generateStyles = () => {
    messageMainThread({
      type: 'generate-styles',
      format: getValidStylesheetFormat(format),
      useCombinatorialParsing,
    });
  };

  const createPullRequest = () => {
    // TODO: Get GitHub config from context/config
    // For now, just transition to done state
    messageMainThread({
      type: 'create-pr',
      githubToken: '', // TODO: Get from config
      filePath: '', // TODO: Get from config
      repoPath: '', // TODO: Get from config
      branchName,
    });
  };

  const copyToClipboard = async () => {
    if (generatedStyles) {
      try {
        await navigator.clipboard.writeText(generatedStyles);
        // Optional: Add success feedback here
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // Syntax highlighting for SCSS code
  const highlightCode = (code: string) => {
    // Split into lines and process each line
    const lines = code.split('\n');
    return lines.map((line, idx) => {
      // Comment lines (starting with //)
      if (line.trim().startsWith('//')) {
        return (
          <p key={idx} style={{ margin: 0, fontStyle: 'italic', color: '#5fa657' }}>
            {line}
          </p>
        );
      }

      // Regex patterns for different tokens
      const patterns = [
        { regex: /(@mixin|@include|@import|@use)/g, color: '#cf7c01' }, // At-rules (orange)
        { regex: /(\$[\w-]+)/g, color: '#b068f4' }, // Variables (purple)
        { regex: /(#[0-9a-fA-F]{3,8})/g, color: '#01a6ae' }, // Hex colors (teal)
        { regex: /(\d+\.?\d*(?:rem|px|em|%))/g, color: '#01a6ae' }, // Numeric values (teal)
        {
          regex:
            /(display|flex-direction|align-items|justify-content|gap|padding|margin|width|height|background|border|border-radius|color|font-family|font-size|font-weight|font-style|line-height|box-shadow|flex|position|top|left|right|bottom|overflow)/g,
          color: '#5b91e9',
        }, // Properties (blue)
      ];

      // Process line to find all matches
      const segments: Array<{ text: string; color?: string }> = [];
      let lastIndex = 0;

      // Find all matches for all patterns
      const allMatches: Array<{ index: number; length: number; color: string }> = [];

      patterns.forEach((pattern) => {
        const regex = new RegExp(pattern.regex);
        let match;
        while ((match = regex.exec(line)) !== null) {
          allMatches.push({
            index: match.index,
            length: match[0].length,
            color: pattern.color,
          });
        }
      });

      // Sort by index
      allMatches.sort((a, b) => a.index - b.index);

      // Build segments
      allMatches.forEach((match) => {
        if (match.index > lastIndex) {
          segments.push({ text: line.substring(lastIndex, match.index) });
        }
        segments.push({
          text: line.substring(match.index, match.index + match.length),
          color: match.color,
        });
        lastIndex = match.index + match.length;
      });

      if (lastIndex < line.length) {
        segments.push({ text: line.substring(lastIndex) });
      }

      // If no matches, just return plain text
      if (segments.length === 0) {
        return (
          <p key={idx} style={{ margin: 0, color: '#002a2d' }}>
            {line || '\u00A0'}
          </p>
        );
      }

      return (
        <p key={idx} style={{ margin: 0 }}>
          {segments.map((segment, segIdx) => (
            <span key={segIdx} style={{ color: segment.color || '#002a2d' }}>
              {segment.text}
            </span>
          ))}
        </p>
      );
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (currentStep === 'generate') {
      generateStyles();
    } else if (currentStep === 'publish') {
      createPullRequest();
    }
  };

  // Determine stepper statuses based on current step
  const step1Status =
    currentStep === 'generate' || currentStep === 'generating' ? 'current' : 'past';
  const step2Status =
    currentStep === 'publish' || currentStep === 'done'
      ? currentStep === 'publish'
        ? 'current'
        : 'past'
      : 'future';
  const step3Status = currentStep === 'done' ? 'current' : 'future';

  return (
    <div className="container">
      <div className={styles['top-sheet']}>
        <div className={styles['stepper-container']}>
          <StepperStep step={1} label="Generate" status={step1Status} position="first" />
          <StepperStep step={2} label="Publish" status={step2Status} position="middle" />
          <StepperStep step={3} status={step3Status} position="last" />
        </div>

        <form onSubmit={onSubmit} className={styles['action-area']}>
          {currentStep === 'generate' && (
            <Button type="submit" variant="primary" className={styles['generate-button']}>
              Generate styles
            </Button>
          )}

          {currentStep === 'generating' && (
            <div className={styles['progress-container']}>
              <div className={styles['progress-bar']}>
                <div className={styles['progress-fill']} style={{ width: `${progress}%` }} />
              </div>
              <div className={styles['progress-text']}>{progressMessage}</div>
            </div>
          )}

          {currentStep === 'publish' && (
            <>
              <Input
                label="Branch name"
                value={branchName}
                onChange={setBranchName}
                className={styles['branch-input']}
              />
              <Button type="submit" variant="primary">
                Create pull request
              </Button>
            </>
          )}
        </form>
      </div>
      <>
        <div className={styles['content-area']}>
          {currentStep === 'generate' || currentStep === 'generating' ? (
            <div className={styles['card-wrapper']}>
              <Card type="static">
                Generating styles can take several minutes, depending on the size of the file.
                <br />
                <br />
                To publish to Github, connect your repo on the "Setup" tab.
              </Card>
            </div>
          ) : (
            <div className={styles['code-sample']}>
              <button
                type="button"
                onClick={copyToClipboard}
                className={styles['copy-button']}
                aria-label="Copy code to clipboard"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="9"
                    y="9"
                    width="13"
                    height="13"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </button>
              <pre>
                {generatedStyles
                  ? highlightCode(generatedStyles)
                  : 'Generated code will be displayed here...'}
              </pre>
            </div>
          )}
        </div>
      </>
    </div>
  );
};
