import React, { createContext, useContext } from 'react';
import { useDB } from '../hooks/useDB';

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const db = useDB();
  return <Ctx.Provider value={db}>{children}</Ctx.Provider>;
}

export function useApp() {
  return useContext(Ctx);
}
