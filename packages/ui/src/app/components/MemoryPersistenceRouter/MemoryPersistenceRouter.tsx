import { FC, ReactNode, useEffect } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { isFigmaPluginUI } from '../../utils';

// Inner component that persists on route changes (render this inside your Router)
const RoutePersistence = () => {
  const location = useLocation();
  const path = location.pathname;

  useEffect(() => {
    if (isFigmaPluginUI()) {
      console.log('Persisting route to Figma:', path);
      window.parent.postMessage({ pluginMessage: { type: 'set-route', path } }, '*');
    } else {
      window.localStorage.setItem('memoryRouterPath', path);
    }
  }, [path]);

  return null;
};

interface MemoryPersistenceRouterProps {
  children: ReactNode;
  initialRoute: string;
}

/**
 * Wrapper around MemoryRouter that persists the current route. Expected to be
 * used with useRoutePersistence.
 */
export const MemoryPersistenceRouter: FC<MemoryPersistenceRouterProps> = ({
  children,
  initialRoute,
}) => {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <RoutePersistence />
      {children}
    </MemoryRouter>
  );
};
