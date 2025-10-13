import { FC, useState } from 'react';
import { getValidStylesheetFormat } from '@eggstractor/common';
import { messageMainThread } from '../../utils';
import { useConfig, useGeneratedStyles } from '../../context';
import { Button, Card, Stepper } from '../../components';
import { useOnPluginMessage } from '../../hooks';
import {
  CreatePRButton,
  ExportTestDataButton,
  GeneratingStylesProgressBar,
  Output,
  Status,
  Warnings,
} from './components';
import { useStatus } from './components/Status/context';
import { TIME_TO_REMOVE_PROGRESS_BAR } from './constants';

export const Form: FC = () => {
  const { setLoading, loading, setGeneratedStyles } = useGeneratedStyles();
  const [disableGenerateButton, setDisableGenerateButton] = useState(false);
  const [stepperStep, setStepperStep] = useState(1);
  const { status } = useStatus();

  // Add state for output data
  const [outputStyles, setOutputStyles] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);

  const { format, useCombinatorialParsing } = useConfig();

  // Update stepper based on status changes
  if (status.state === 'pr-created' && stepperStep !== 3) {
    setStepperStep(3); // Move to "Complete" step when PR is created
  }

  const generateStyles = () => {
    setLoading(true);
    setStepperStep(1); // Set to "Generate" step
    messageMainThread({
      type: 'generate-styles',
      format: getValidStylesheetFormat(format),
      useCombinatorialParsing,
    });
  };

  useOnPluginMessage('progress-end', () => {
    setLoading(false);
    setStepperStep(2); // Move to "Publish" step when generation is complete

    setTimeout(() => {
      setDisableGenerateButton(false);
    }, TIME_TO_REMOVE_PROGRESS_BAR);
  });

  // Listen for styles output to see if we get this message
  useOnPluginMessage('output-styles', (msg) => {
    // Store the output data in state
    setOutputStyles(msg.styles);
    setWarnings(msg.warnings || []);
    // Also update the generated styles context
    setGeneratedStyles(msg.styles);
  });

  const onGenerateClick = () => {
    setDisableGenerateButton(true);
    generateStyles();
  };

  return (
    <div className="app-container">
      <div className="bottom-sheet">
        <Stepper
          currentStep={stepperStep}
          steps={[{ label: 'Generate' }, { label: 'Publish' }, { label: 'Complete' }]}
        />
        <div className="action-area">
          {loading ? (
            <div className="generating-state">
              <GeneratingStylesProgressBar />
            </div>
          ) : stepperStep === 1 ? (
            <Button onClick={onGenerateClick} disabled={disableGenerateButton}>
              Generate styles
            </Button>
          ) : stepperStep === 2 ? (
            <CreatePRButton />
          ) : stepperStep === 3 ? (
            <div className="complete-state">
              <Status />
            </div>
          ) : (
            <Button onClick={onGenerateClick} disabled={disableGenerateButton}>
              Generate styles
            </Button>
          )}
        </div>
      </div>

      <div className="content-area">
        {stepperStep === 1 ? (
          <Card>
            <div className="export-card-content">
              <p>Generating styles can take several minutes, depending on the size of the file.</p>
              <p>To publish to Github, connect your repo on the "Setup" tab.</p>
            </div>
          </Card>
        ) : stepperStep >= 2 ? (
          <div className="publish-content-area">
            <Warnings warnings={warnings} />
            <Output styles={outputStyles} />
          </div>
        ) : (
          <Card>
            <div className="export-card-content">
              <p>Generating styles can take several minutes, depending on the size of the file.</p>
              <p>To publish to Github, connect your repo on the "Setup" tab.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Hidden dev components */}
      {__DEV__ ? (
        <div style={{ display: 'none' }}>
          <ExportTestDataButton />
        </div>
      ) : null}
    </div>
  );
};
