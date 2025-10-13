import { FC, FormEvent, useState } from 'react';
import type { StylesheetFormat } from '@eggstractor/common';
import { useConfig } from '../../context';
import { Button, Input } from '../../components';
import { ButtonGroup, ButtonGroupOption } from '../../components/ButtonGroup';
import cn from 'classnames';
import styles from './Setup.module.scss';

const FORMAT_OPTIONS: ButtonGroupOption<StylesheetFormat>[] = [
  // Only include 'css' option in dev mode for testing purposes (for now)
  ...(__DEV__ ? [{ value: 'css' as const, label: 'CSS' }] : []),
  { value: 'scss', label: 'SCSS' },
  { value: 'tailwind-scss', label: '(v3) Tailwind-SCSS' },
  { value: 'tailwind-v4', label: '(v4) Tailwind Layer Utilities' },
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
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={cn(styles['form-fields'], 'container')}>
        <div>
          <Input value={repoPath} onChange={setRepoPath} label="Github repository" />
        </div>
        <div>
          <Input value={filePath} onChange={setFilePath} label="Output file path" />
        </div>
        <div>
          <Input value={githubToken} onChange={setGithubToken} label="Github token" />
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
