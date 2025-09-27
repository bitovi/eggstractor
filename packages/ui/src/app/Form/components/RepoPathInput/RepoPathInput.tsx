import { FC } from "react";
import { Input } from "../../../components/Input";
import { useConfig } from "../../../context/ConfigContext";

export const RepoPathInput: FC = () => {
  const { repoPath, setRepoPath } = useConfig();
  return <Input id="repoPath" label="Repository (owner/repo):" placeholder="e.g., bitovi/design-system" value={repoPath} onChange={setRepoPath} />
};
