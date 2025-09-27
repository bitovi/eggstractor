import { FC } from "react";
import { Input } from "../../../components/Input";
import { useConfig } from "../../../context/ConfigContext";

export const FilePathInput: FC = () => {
  const { filePath, setFilePath } = useConfig();
  return <Input id="filePath" label="File Path:" placeholder="e.g., src/styles/variables.scss" value={filePath} onChange={setFilePath} />;
}
