import { FC, FormEvent, useState } from 'react';
import { getValidStylesheetFormat } from '@eggstractor/common';
import { messageMainThread } from '../utils';
import { useConfig, useGeneratedStyles } from '../context';
import { Button } from '../components';
import { useOnPluginMessage } from '../hooks';
import {
  BranchNameInput,
  CreatePRButton,
  ExportTestDataButton,
  FilePathInput,
  FormatSelect,
  GeneratingStylesProgressBar,
  GithubTokenInput,
  Output,
  ParsingModeRadioGroup,
  RepoPathInput,
  Status,
  Warnings,
} from './components';
import { TIME_TO_REMOVE_PROGRESS_BAR } from './constants';

export const Form: FC = () => {
  const { setLoading } = useGeneratedStyles();
  const [disableGenerateButton, setDisableGenerateButton] = useState(false);

  const { format, useCombinatorialParsing } = useConfig();

  const generateStyles = () => {
    messageMainThread({
      type: 'generate-styles',
      format: __DEV__ ? getValidStylesheetFormat(format) : 'scss',
      useCombinatorialParsing,
    });
  };

  useOnPluginMessage('progress-end', () => {
    setLoading(false);

    setTimeout(() => {
      setDisableGenerateButton(false);
    }, TIME_TO_REMOVE_PROGRESS_BAR);
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    generateStyles();
  };

  return (
    <form className="container" onSubmit={onSubmit}>
      <GithubTokenInput />
      <RepoPathInput />
      <FilePathInput />
      <BranchNameInput />
      <div style={{ marginBottom: '10px' }}>
        <FormatSelect />
        <ParsingModeRadioGroup />
      </div>
      <div className="button-group">
        <div className="button-container">
          <Button
            id="generateBtn"
            type="submit"
            disabled={disableGenerateButton}
          >
            Generate Styles
          </Button>
          <div id="spinner" className="spinner hidden"></div>
        </div>
        {__DEV__ ? <ExportTestDataButton /> : null}
        <CreatePRButton />
        <Status />
      </div>
      <GeneratingStylesProgressBar />
      <Warnings />
      <Output />
    </form>
  );
};
