import { createContext, useContext, useMemo, useState, FC, ReactNode } from 'react';

type StatusState =
  | { state: 'idle' }
  | { state: 'creating-pr' }
  | { state: 'pr-created'; url: string };

type StatusContextValue = {
  status: StatusState;

  // explicit state-setters
  setIdle: () => void;
  setCreatingPR: () => void;
  setPRCreated: (url: string) => void;
};

const StatusContext = createContext<StatusContextValue | undefined>(undefined);

interface StatusProviderProps {
  children: ReactNode;
}

export const StatusProvider: FC<StatusProviderProps> = ({ children }) => {
  const [status, setStatus] = useState<StatusState>({ state: 'idle' });

  const setIdle = () => {
    console.log('setIdle');
    setStatus({ state: 'idle' });
  };
  const setCreatingPR = () => setStatus({ state: 'creating-pr' });
  const setPRCreated = (url: string) => setStatus({ state: 'pr-created', url });

  const value = useMemo<StatusContextValue>(
    () => ({
      status,
      setIdle,
      setCreatingPR,
      setPRCreated,
    }),
    [status],
  );

  return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>;
};

export const useStatus = (): StatusContextValue => {
  const ctx = useContext(StatusContext);
  if (!ctx) throw new Error('useStatus must be used within a StatusProvider');
  return ctx;
};
