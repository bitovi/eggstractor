import { FC, useState } from 'react';
import { Button } from '../../../components/Button';
import { messageMainThread } from '../../../utilities';
import { useConfig } from '../../../context/ConfigContext';
import { useOnPluginMessage } from '../../../hooks';
import { useGeneratedStyles } from '../../../context/GeneratedStylesContext/GeneratedStylesContext';
import { useStatus } from '../Status/context/StatusContext';

export const CreatePRButton: FC = () => {
  const { setCreatingPR, setPRCreated, setIdle } = useStatus();
  const { githubToken, repoPath, filePath, branchName } = useConfig();
  const { generatedStyles } = useGeneratedStyles();

  useOnPluginMessage('pr-created', (msg) => {
    setPRCreated(msg.prUrl);
    setDisabled(false);
  });

  useOnPluginMessage('error', (msg) => {
    alert(`Error: ${msg.message}`);
    setDisabled(false);
    setIdle();
  });

  const [disabled, setDisabled] = useState(false);
  const createPR = () => {
    setDisabled(true);
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
        warning:
          'Please specify the name of the branch to create or add the commit to',
      },
      { value: generatedStyles, warning: 'Please generate the SCSS first' },
    ];

    const missing = checks.filter((check) => !check.value);
    if (missing.length) {
      alert(missing[0].warning);
      setDisabled(false);
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

  return (
    <Button onClick={createPR} disabled={disabled}>
      Create PR
    </Button>
  );
};
