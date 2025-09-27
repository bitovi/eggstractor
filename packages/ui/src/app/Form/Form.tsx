import { FC, useState } from 'react';
import { messageMainThread } from '../utilities';
import { getValidStylesheetFormat } from '@eggstractor/common';
import { useConfig } from '../context/ConfigContext';
import { Button } from '../components/Button';
import { GithubTokenInput } from './components/GithubTokenInput';
import { RepoPathInput } from './components/RepoPathInput';
import { FilePathInput } from './components/FilePathInput';
import { BranchNameInput } from './components/BranchNameInput';
import { FormatSelect } from './components/FormatSelect/FormatSelect';
import { ParsingModeRadioGroup } from './components/ParsingModeRadioGroup/ParsingModeRadioGroup';
import { ExportTestDataButton } from './components/ExportTestDataButton';
import { useOnPluginMessage } from '../hooks';
import { CreatePRButton, GeneratingStylesProgressBar } from './components';
import { TIME_TO_REMOVE_PROGRESS_BAR } from './constants';
import { useGeneratedStyles } from '../context/GeneratedStylesContext/GeneratedStylesContext';
import { Warnings } from './components/Warnings';
import { Output } from './components/Output';
import { Status } from './components/Status';

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

  const onSubmit = (e: React.FormEvent) => {
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
