import {
  createContext,
  useContext,
  useMemo,
  useState,
  Dispatch,
  FC,
  ReactNode,
} from 'react';

export interface GeneratedStyles {
  loading: boolean;
  generatedStyles: string;
}

type GeneratedStylesType = GeneratedStyles & {
  setLoading: Dispatch<React.SetStateAction<boolean>>;
  setGeneratedStyles: Dispatch<React.SetStateAction<string>>;
};

const GeneratedStylesContext = createContext<GeneratedStylesType | undefined>(undefined);

interface GeneratedStylesProviderProps {
  children: ReactNode;
}

export const GeneratedStylesProvider: FC<GeneratedStylesProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedStyles, setGeneratedStyles] = useState<string>('');

  const value = useMemo(
    () => ({
      loading,
      generatedStyles,
      setLoading,
      setGeneratedStyles,
    }),
    [loading, generatedStyles]
  );

  return (
    <GeneratedStylesContext.Provider value={value}>
      {children}
    </GeneratedStylesContext.Provider>
  );
};

export const useGeneratedStyles = (): GeneratedStylesType => {
  const ctx = useContext(GeneratedStylesContext);
  if (!ctx) {
    throw new Error('useGeneratedStyles must be used within a GeneratedStylesProvider');
  }
  return ctx;
};
