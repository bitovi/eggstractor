import { FC } from 'react';
import { Input } from '../../../components';
import { useConfig } from '../../../context';

export const BranchNameInput: FC = () => {
  const { branchName, setBranchName } = useConfig();
  const updateBranchName = (value: string) => {
    const processedValue = value.replace(/^\.|[^-/.\w]|\/$/g, '-');
    setBranchName(processedValue);
  };

  return (
    <Input
      id="branchName"
      label="New Branch Name:"
      placeholder="e.g., feature/update-scss-variables"
      value={branchName}
      onChange={updateBranchName}
    />
  );
};
