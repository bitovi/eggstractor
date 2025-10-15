import { FC } from 'react';
import { Input } from '../../../../components';
import { useConfig } from '../../../../context';

export const FilePathInput: FC = () => {
  const { filePath, setFilePath } = useConfig();
  return (
    <Input
      id="filePath"
      label="File Path:"
      placeholder="e.g., src/styles/eggstracted.scss"
      value={filePath}
      onChange={setFilePath}
    />
  );
};
