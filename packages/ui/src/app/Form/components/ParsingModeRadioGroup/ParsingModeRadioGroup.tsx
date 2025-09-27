import { FC, useState } from 'react';
import { RadioGroup } from '../../../components/RadioGroup';
import { useConfig } from '../../../context/ConfigContext';

type ParsingMode = 'combinatorial' | 'templated';

export const ParsingModeRadioGroup: FC = () => {
  const { setUseCombinatorialParsing } = useConfig();
  const [parsingMode, setParsingMode] = useState<ParsingMode>('combinatorial');

  const updateParsingMode = (parsingMode: ParsingMode) => {
    setParsingMode(parsingMode);
    setUseCombinatorialParsing(parsingMode === 'combinatorial');
  };

  return (
    <RadioGroup<ParsingMode>
      label="Eggstractor Output:"
      name="parsingMode"
      value={parsingMode}
      options={[
        { value: 'combinatorial', label: 'Combinatorial' },
        { value: 'templated', label: 'Templated' },
      ]}
      onChange={updateParsingMode}
    />
  );
};
