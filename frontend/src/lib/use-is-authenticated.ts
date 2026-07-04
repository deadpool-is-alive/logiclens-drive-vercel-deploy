'use client';

import { useState, useEffect } from 'react';
import { isAuthenticated } from './auth';

export function useIsAuthenticated() {
  const [loggedIn, setLoggedIn] = useState(false); // matches server render: always false initially

  useEffect(() => {
    setLoggedIn(isAuthenticated()); // real value, only after mount
    const handler = () => setLoggedIn(isAuthenticated());
    window.addEventListener('authchange', handler);
    return () => window.removeEventListener('authchange', handler);
  }, []);

  return loggedIn;
}