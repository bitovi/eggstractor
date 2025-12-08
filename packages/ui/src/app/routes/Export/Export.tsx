import { FC, useState, FormEvent, useCallback } from 'react';
import { getValidStylesheetFormat } from '@eggstractor/common';
import { messageMainThread } from '../../utils';
import { useConfig, useGeneratedStyles } from '../../context';
import { Button, StepperStep, Input, StaticCard } from '../../components';
import {
  GeneratingStylesProgressBar,
  useStatus,
  Output,
  ExportTestDataButton,
  Spinner,
} from './components';
import { useOnPluginMessage } from '../../hooks';
import styles from './Export.module.scss';

export const Export: FC = () => {
  const {
    format,
    useCombinatorialParsing,
    branchName: initialBranchName,
    githubToken,
    repoPath,
    filePath,
    generateSemanticColorUtilities,
    outputMode,
  } = useConfig();
  const { loading, setLoading, generatedStyles, setGeneratedStyles } = useGeneratedStyles();
  const { status: prStatus, setCreatingPR, setPRCreated, setIdle } = useStatus();
  const [branchName, setBranchName] = useState(initialBranchName);
  const [prButtonDisabled, setPRButtonDisabled] = useState(false);

  const generateStyles = () => {
    messageMainThread({
      type: 'generate-styles',
      format: getValidStylesheetFormat(format),
      useCombinatorialParsing,
      generateSemanticColorUtilities,
      outputMode,
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      generateStyles();
      setLoading(true);
    } else if (step === 2) {
      createPR();
    }
  };

  const handlePRCreated = useCallback(
    (msg: { type: 'pr-created'; prUrl: string }) => {
      setPRCreated(msg.prUrl);
      setPRButtonDisabled(false);
    },
    [setPRCreated],
  );

  const handleError = useCallback(
    (msg: { type: 'error'; message: string }) => {
      alert(`Error: ${msg.message}`);
      setPRButtonDisabled(false);
      setIdle();
    },
    [setIdle],
  );

  useOnPluginMessage('pr-created', handlePRCreated);
  useOnPluginMessage('error', handleError);

  const createPR = () => {
    setPRButtonDisabled(true);
    setCreatingPR();

    const checks = [
      { value: githubToken, warning: 'Please add a github token' },
      { value: repoPath, warning: 'Please add path to the repository' },
      {
        value: filePath,
        warning: 'Please add the path to your generated SCSS file',
      },
      {
        value: branchName,
        warning: 'Please specify the name of the branch to create or add the commit to',
      },
      { value: generatedStyles, warning: 'Please generate the SCSS first' },
    ];

    const missing = checks.filter((check) => !check.value);
    if (missing.length) {
      alert(missing[0].warning);
      setPRButtonDisabled(false);
      setIdle();
      return;
    }

    messageMainThread({
      type: 'create-pr',
      githubToken,
      repoPath,
      filePath,
      branchName,
    });
  };

  const getStep: () => 1 | 2 | 3 | null = () => {
    if (!generatedStyles && !loading) return 1;
    if (generatedStyles && prStatus.state !== 'pr-created') return 2;
    if (prStatus.state === 'pr-created') return 3;
    return null;
  };

  // Determine stepper statuses based on current step
  const step: 1 | 2 | 3 | null = getStep();
  const stepOneStatus = step === 1 ? 'current' : 'past';
  const stepTwoStatus = step === 2 ? 'current' : step === 3 ? 'past' : 'future';
  const stepThreeStatus = step === 3 ? 'current' : 'future';

  const handleStepOneClick = () => {
    setGeneratedStyles('');
    setIdle();
    setLoading(false);
  };

  const handleStepTwoClick = () => {
    setIdle();
  };

  return (
    <>
      <div className={styles['top-sheet']}>
        <div className={styles['stepper-container']}>
          <StepperStep
            step={1}
            label="Generate"
            status={stepOneStatus}
            position="first"
            onClick={stepOneStatus === 'past' ? handleStepOneClick : null}
          />
          <StepperStep
            step={2}
            label="Publish"
            status={stepTwoStatus}
            position="middle"
            onClick={stepTwoStatus === 'past' ? handleStepTwoClick : null}
          />
          <StepperStep step={3} status={stepThreeStatus} position="last" />
        </div>

        <form onSubmit={onSubmit} className={styles['action-area']}>
          {step === 1 ? (
            <div className={styles['step-one-buttons']}>
              <Button type="submit" variant="primary" className={styles['generate-button']}>
                Generate styles
              </Button>
              {__DEV__ ? <ExportTestDataButton /> : null}
            </div>
          ) : null}

          <GeneratingStylesProgressBar />

          {step === 2 ? (
            !loading ? (
              <>
                <div className={styles['branch-input-wrapper']}>
                  <Input
                    label="Branch name"
                    value={branchName}
                    onChange={setBranchName}
                    className={styles['branch-input']}
                    disabled={prStatus.state === 'creating-pr'}
                  />
                </div>
                <div className={styles['publish-button']}>
                  <Button
                    type="submit"
                    disabled={prButtonDisabled || prStatus.state === 'creating-pr'}
                    variant="primary"
                  >
                    {prStatus.state === 'creating-pr' ? <Spinner /> : 'Create Pull Request'}
                  </Button>
                </div>
              </>
            ) : null
          ) : null}

          {step === 3 ? (
            <div className={styles['success-state']}>
              <div className={styles['success-message']}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M8.25 12.75L10.5 15L15.75 9.75"
                    stroke="#01A6AE"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
                    stroke="#01A6AE"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Pull request created!</span>
              </div>
              <Button
                variant="primary"
                onClick={() =>
                  prStatus.state === 'pr-created' ? window.open(prStatus.url, '_blank') : null
                }
                className={styles['view-button']}
              >
                Open in Github →
              </Button>
            </div>
          ) : null}
        </form>
      </div>
      <div className={styles['content-area']}>
        {step === 1 || loading ? (
          <div className={styles['card-wrapper']}>
            <StaticCard>
              <p>Generating styles can take several minutes, depending on the size of the file.</p>
              <p>To publish to Github, connect your repo on the "Setup" tab.</p>
            </StaticCard>
          </div>
        ) : (
          <Output />
        )}
      </div>
    </>
  );
};
