import { FC } from 'react';
import type { StylesheetFormat, OutputMode, GitProvider } from '@eggstractor/common';
import cn from 'classnames';
import { Button, Input, ButtonGroup, ButtonGroupOption } from '../../components';
import { useSetupForm } from './hooks';
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
    provider,
    repoPath,
    filePath,
    authToken,
    instanceUrl,
    format,
    useCombinatorialParsing,
    generateSemanticColorUtilities,
    outputMode,
    setProvider,
    setRepoPath,
    setFilePath,
    setAuthToken,
    setInstanceUrl,
    setFormat,
    setUseCombinatorialParsing,
    setGenerateSemanticColorUtilities,
    setOutputMode,
    handleSubmit,
    repoLabel,
    repoHint,
    repoLinkHref,
    tokenLabel,
    tokenLinkHref,
  } = useSetupForm();

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
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
            value={authToken}
            onChange={setAuthToken}
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
