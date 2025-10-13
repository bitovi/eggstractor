import { FC, useState } from 'react';
import { Button, Input, SegmentedButton } from '../../components';
import { useConfig } from '../../context';

export const Setup: FC = () => {
  const config = useConfig();
  const [localConfig, setLocalConfig] = useState({
    repoPath: config.repoPath,
    filePath: config.filePath,
    githubToken: config.githubToken,
    format: config.format,
    useCombinatorialParsing: config.useCombinatorialParsing,
  });

  const formatOptions = [
    { value: 'scss', label: 'SCSS' },
    { value: 'tailwind3-scss', label: 'Tailwind 3 + SCSS' },
    { value: 'tailwind4', label: 'Tailwind 4' },
  ];

  const parsingOptions = [
    { value: 'templated', label: 'Templated' },
    { value: 'combinatorial', label: 'Combinatorial' },
  ];

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving config:', localConfig);
  };

  const handleCancel = () => {
    // Reset to original config
    setLocalConfig({
      repoPath: config.repoPath,
      filePath: config.filePath,
      githubToken: config.githubToken,
      format: config.format,
      useCombinatorialParsing: config.useCombinatorialParsing,
    });
  };

  return (
    <div className="app-container">
      <div className="setup-content">
        <Input
          label="Github repository"
          value={localConfig.repoPath}
          onChange={(e) => setLocalConfig({ ...localConfig, repoPath: e.target.value })}
          placeholder="e.g., levi-myers/eggstractor-demo"
          hint="e.g., levi-myers/eggstractor-demo"
          linkText="How to find / create your repo →"
        />

        <Input
          label="Output file path"
          value={localConfig.filePath}
          onChange={(e) => setLocalConfig({ ...localConfig, filePath: e.target.value })}
          placeholder="e.g., src/scss/_source.scss"
          hint="e.g., src/scss/_source.scss"
          linkText="Locating your file →"
        />

        <Input
          label="Github token"
          value={localConfig.githubToken}
          onChange={(e) => setLocalConfig({ ...localConfig, githubToken: e.target.value })}
          placeholder=""
          type="password"
          linkText="How to create a token →"
        />

        <SegmentedButton
          label="Output format"
          options={formatOptions}
          value={localConfig.format}
          onChange={(value) => setLocalConfig({ ...localConfig, format: value })}
        />

        <SegmentedButton
          label="Output grouping"
          options={parsingOptions}
          value={localConfig.useCombinatorialParsing ? 'combinatorial' : 'templated'}
          onChange={(value) =>
            setLocalConfig({
              ...localConfig,
              useCombinatorialParsing: value === 'combinatorial',
            })
          }
          hint="Combinatorial uses AI to group and minimize output styles"
        />
      </div>

      <div className="bottom-sheet">
        <div className="action-area">
          <Button onClick={handleSave}>Save changes</Button>
          <Button className="button--secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
