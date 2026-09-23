import { createContext, useMemo } from 'react';

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const value = useMemo(() => ({ appName: 'AroundU' }), []);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
