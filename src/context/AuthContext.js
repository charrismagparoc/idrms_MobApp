import { createContext, useContext, useState } from 'react';

const API_URL = 'https://julianna-unblossomed-zahra.ngrok-free.dev/api';
const Ctx = createContext(null);

async function postLogout(userName) {
  try {
    await fetch(`${API_URL}/auth/logout/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: userName }),
    });
  } catch (_) {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const logout = async () => {
    if (user) await postLogout(user.name);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, login: setUser, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}