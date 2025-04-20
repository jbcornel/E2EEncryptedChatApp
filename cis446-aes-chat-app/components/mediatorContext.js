'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const MediatorContext = createContext();

export function MediatorProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);

  //Check cookie and set session state
  useEffect(() => {
    async function validateSession() {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data.user) {
          setUserId(data.user.id);
          setUsername(data.user.username);
          setSessionReady(true);
        } else {
          setSessionReady(true); //still true, just unauthenticated
        }
      } catch (err) {
        console.error('Session check failed:', err);
        setSessionReady(true);
      }
    }

    validateSession();
  }, []);

  return (
    <MediatorContext.Provider value={{
      userId,
      username,
      sessionReady,
      setUserId,
      setUsername,
      setSessionReady,
    }}>
      {children}
    </MediatorContext.Provider>
  );
}

export function useMediator() {
  return useContext(MediatorContext);
}
