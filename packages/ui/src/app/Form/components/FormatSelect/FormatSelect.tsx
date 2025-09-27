import { FC } from 'react';
import { Select, SelectOption } from '../../../components/Select';
import { StylesheetFormat } from '@eggstractor/common';
import { useConfig } from '../../../context/ConfigContext';

const FORMAT_OPTIONS: SelectOption<StylesheetFormat>[] = [
  // Only include 'css' option in dev mode for testing purposes (for now)
  ...(__DEV__ ? [{ value: 'css' as const, label: 'CSS' }] : []),
  { value: 'scss', label: 'SCSS' },
  { value: 'tailwind-scss', label: '(v3) Tailwind-SCSS' },
  { value: 'tailwind-v4', label: '(v4) Tailwind Layer Utilities' },
];

export const FormatSelect: FC = () => {
  const { format, setFormat } = useConfig();
  return (
    <Select<StylesheetFormat>
      id="formatSelect"
      value={format}
      onChange={(option) => setFormat(option.value)}
      options={FORMAT_OPTIONS}
    />
  );
};
