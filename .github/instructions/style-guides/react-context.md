# React Context Style Guide

## Unique Conventions in This Codebase

### Auto-Sync Context Pattern

**Unique Pattern**: Context providers automatically sync changes to Figma plugin storage:

```tsx
export const ConfigProvider: FC<ConfigProps> = ({ children /* initial props */ }) => {
  const [repoPath, setRepoPath] = useState<string>(pRepoPath ?? '');
  // ... other state

  // Auto-save on every change
  useEffect(() => {
    messageMainThread({
      type: 'save-config',
      repoPath,
      filePath,
      branchName,
      githubToken,
      format,
      useCombinatorialParsing,
    });
  }, [repoPath, filePath, branchName, githubToken, format, useCombinatorialParsing]);
};
```

### Controlled Props with Fallbacks

**Unique Pattern**: Context accepts initial values but maintains internal state:

```tsx
export const ConfigProvider: FC<ConfigProps> = ({
  children,
  repoPath: pRepoPath = '', // Prop with 'p' prefix
  filePath: pFilePath = '',
  // ...
}) => {
  // Internal state with fallback to prop values
  const [repoPath, setRepoPath] = useState<string>(pRepoPath ?? '');
  const [filePath, setFilePath] = useState<string>(pFilePath ?? '');
};
```

### Setter Function Exposure Pattern

**Unique Pattern**: Context exposes both values and setter functions:

```tsx
type ConfigType = Config & {
  setRepoPath: Dispatch<SetStateAction<string>>;
  setFilePath: Dispatch<SetStateAction<string>>;
  setFormat: Dispatch<SetStateAction<StylesheetFormat>>;
  // All setters exposed directly
};
```
