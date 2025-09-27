import { FC } from "react";
import { Input } from "../../../components";
import { useConfig } from "../../../context";

export const GithubTokenInput: FC = () => {
  const { githubToken, setGithubToken } = useConfig();
  return <Input type="password" id="githubToken" label="GitHub Token:" placeholder="Github PAT token" value={githubToken} onChange={setGithubToken} />;
};
