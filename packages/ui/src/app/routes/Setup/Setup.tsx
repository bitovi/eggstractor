import { FC, FormEvent, useState } from 'react';
import type { StylesheetFormat, OutputMode, GitProvider } from '@eggstractor/common';
import cn from 'classnames';
import { useConfig } from '../../context';
import { Button, Input, ButtonGroup, ButtonGroupOption } from '../../components';
import styles from './Setup.module.scss';

const FORMAT_OPTIONS: ButtonGroupOption<StylesheetFormat>[] = [
  // Only include 'css' option in dev mode for testing purposes (for now)
  ...(__DEV__ ? [{ value: 'css' as const, label: 'CSS' }] : []),
  { value: 'scss', label: 'SCSS' },
  { value: 'tailwind-scss', label: 'Tailwind 3 + SCSS' },
  { value: 'tailwind-v4', label: 'Tailwind 4' },
];

export const PROVIDER_OPTIONS: ButtonGroupOption<GitProvider>[] = [
  { value: 'github', label: 'GitHub' },
  { value: 'gitlab', label: 'GitLab' },
];

export const OUTPUT_GROUPING_OPTIONS: ButtonGroupOption<'combinatorial' | 'templated'>[] = [
  { value: 'templated', label: 'Templated' },
  { value: 'combinatorial', label: 'Combinatorial' },
];

export const USE_SEMANTIC_COLOR_UTILITIES_OPTIONS: ButtonGroupOption<boolean>[] = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
];

export const OUTPUT_MODE_OPTIONS: ButtonGroupOption<OutputMode>[] = [
  { value: 'variables', label: 'Figma Variables' },
  { value: 'components', label: 'Figma Components' },
  { value: 'all', label: 'All' },
];

export const Setup: FC = () => {
  const {
    provider: initialProvider,
    repoPath: initialRepoPath,
    filePath: initialFilePath,
    githubToken: initialGithubToken,
    token: initialToken,
    instanceUrl: initialInstanceUrl,
    format: initialFormat,
    useCombinatorialParsing: initialUseCombinatorialParsing,
    generateSemanticColorUtilities: initialGenerateSemanticColorUtilities,
    outputMode: initialOutputMode,
    saveConfig,
  } = useConfig();

  const [provider, setProvider] = useState<GitProvider>(initialProvider);
  const [repoPath, setRepoPath] = useState(initialRepoPath);
  const [filePath, setFilePath] = useState(initialFilePath);
  const [token, setToken] = useState(initialToken || initialGithubToken);
  const [instanceUrl, setInstanceUrl] = useState(initialInstanceUrl || '');
  const [format, setFormat] = useState(initialFormat);
  const [useCombinatorialParsing, setUseCombinatorialParsing] = useState(
    initialUseCombinatorialParsing,
  );
  const [generateSemanticColorUtilities, setGenerateSemanticColorUtilities] = useState(
    initialGenerateSemanticColorUtilities,
  );
  const [outputMode, setOutputMode] = useState<OutputMode>(initialOutputMode);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveConfig({
      provider,
      repoPath,
      filePath,
      githubToken: token, // Keep for backward compatibility
      token,
      instanceUrl: provider === 'gitlab' ? instanceUrl : undefined,
      format,
      useCombinatorialParsing,
      generateSemanticColorUtilities,
      outputMode,
    });
    alert('Changes saved!');
  };

  const providerLabel = provider === 'github' ? 'GitHub' : 'GitLab';
  const repoLabel = provider === 'github' ? 'GitHub repository' : 'GitLab project';
  const repoHint =
    provider === 'github' ? 'e.g., levi-myers/eggstractor-demo' : 'e.g., username/project-name';
  const repoLinkHref =
    provider === 'github'
      ? 'https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories'
      : 'https://docs.gitlab.com/ee/user/project/';
  const tokenLabel = `${providerLabel} token`;
  const tokenLinkHref =
    provider === 'github'
      ? 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token'
      : 'https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html';

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={cn(styles['form-fields'], 'container')}>
        <div>
          <ButtonGroup
            label="Git provider"
            value={provider}
            onChange={setProvider}
            options={PROVIDER_OPTIONS}
          ></ButtonGroup>
        </div>
        <div>
          <Input
            value={repoPath}
            onChange={setRepoPath}
            label={repoLabel}
            linkLabel="How to find / create your repo"
            linkHref={repoLinkHref}
            hint={repoHint}
          />
        </div>
        {provider === 'gitlab' && (
          <div>
            <Input
              value={instanceUrl}
              onChange={setInstanceUrl}
              label="GitLab instance URL (optional)"
              hint="e.g., gitlab.company.com (leave empty for gitlab.com)"
            />
          </div>
        )}
        <div>
          <Input
            value={filePath}
            onChange={setFilePath}
            label="Output file path"
            linkLabel="Locating your file"
            hint="e.g., src/scss/_eggstracted.scss"
            linkHref="https://docs.github.com/en/repositories/working-with-files/using-files/viewing-and-understanding-files"
          />
        </div>
        <div>
          <Input
            type="password"
            value={token}
            onChange={setToken}
            label={tokenLabel}
            linkLabel="How to create a token"
            linkHref={tokenLinkHref}
          />
        </div>
        <div>
          <ButtonGroup
            label="Stylesheet format"
            value={format}
            onChange={setFormat}
            options={FORMAT_OPTIONS}
          ></ButtonGroup>
        </div>
        <div>
          {format === 'tailwind-v4' ? (
            <ButtonGroup
              label="Output Semantic Variables as Tailwind Utilities"
              value={generateSemanticColorUtilities}
              onChange={setGenerateSemanticColorUtilities}
              options={USE_SEMANTIC_COLOR_UTILITIES_OPTIONS}
            ></ButtonGroup>
          ) : null}
        </div>
        <div>
          <ButtonGroup
            label="What to output"
            value={outputMode}
            onChange={setOutputMode}
            options={OUTPUT_MODE_OPTIONS}
            hint="Choose what to include in the generated output"
          ></ButtonGroup>
        </div>
        <div>
          <ButtonGroup
            label="Output grouping"
            value={useCombinatorialParsing ? 'combinatorial' : 'templated'}
            onChange={(value) => setUseCombinatorialParsing(value === 'combinatorial')}
            options={OUTPUT_GROUPING_OPTIONS}
            hint="Combinatorial uses AI to group and minimize output styles"
          ></ButtonGroup>
        </div>
      </div>
      <div className={styles['bottom-sheet']}>
        <Button type="submit" variant="primary">
          Save changes
        </Button>
        <Button type="button" variant="secondary">
          Cancel
        </Button>
      </div>
    </form>
  );
};
