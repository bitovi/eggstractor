import { useMemo } from 'react';
import { isFigmaPluginUI } from '../../utils';

/**
 * Returns a *synchronous* initialRoute string. Expected to be used with
 * MemoryPersistenceRouter.
 */
export const useRoutePersistence = () => {
  // Compute the initial route synchronously once
  const initialRoute = useMemo<string>(() => {
    if (isFigmaPluginUI()) {
      // From figma injection
      return window.__INITIAL_ROUTE__ || '/';
    } else {
      // Browser build: sync read from localStorage
      const v = window.localStorage.getItem('memoryRouterPath');
      return v || '/';
    }
  }, []);

  return initialRoute;
};
