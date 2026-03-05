import React, { createContext, useContext, useState } from 'react';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  return (
    <Ctx.Provider value={{ user, login: setUser, logout: () => setUser(null) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
