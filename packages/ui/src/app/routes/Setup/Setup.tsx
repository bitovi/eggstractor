import { FC, FormEvent, useState } from 'react';
import type { StylesheetFormat } from '@eggstractor/common';
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

export const OUTPUT_GROUPING_OPTIONS: ButtonGroupOption<'combinatorial' | 'templated'>[] = [
  { value: 'templated', label: 'Templated' },
  { value: 'combinatorial', label: 'Combinatorial' },
];

export const Setup: FC = () => {
  const {
    repoPath: initialRepoPath,
    filePath: initialFilePath,
    githubToken: initialGithubToken,
    format: initialFormat,
    useCombinatorialParsing: initialUseCombinatorialParsing,
    saveConfig,
  } = useConfig();

  const [repoPath, setRepoPath] = useState(initialRepoPath);
  const [filePath, setFilePath] = useState(initialFilePath);
  const [githubToken, setGithubToken] = useState(initialGithubToken);
  const [format, setFormat] = useState(initialFormat);
  const [useCombinatorialParsing, setUseCombinatorialParsing] = useState(
    initialUseCombinatorialParsing,
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveConfig({
      repoPath,
      filePath,
      githubToken,
      format,
      useCombinatorialParsing,
    });
    alert('Changes saved!');
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={cn(styles['form-fields'], 'container')}>
        <div>
          <Input
            value={repoPath}
            onChange={setRepoPath}
            label="Github repository"
            linkLabel="How to find / create your repo"
            linkHref="https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories"
            hint="e.g., levi-myers/eggstractor-demo"
          />
        </div>
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
            value={githubToken}
            onChange={setGithubToken}
            label="Github token"
            linkLabel="How to create a token"
            linkHref="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token"
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
