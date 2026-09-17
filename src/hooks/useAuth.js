import { useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'bbb_credentials';

/**
 * Hook to manage login credentials.
 * Stores server URL + username in secure storage.
 */
const useAuth = () => {
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCredentials = useCallback(async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        setCredentials(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load credentials:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveCredentials = useCallback(async (creds) => {
    try {
      if (creds) {
        await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(creds));
        setCredentials(creds);
      } else {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
        setCredentials(null);
      }
    } catch (e) {
      console.warn('Failed to save credentials:', e);
    }
  }, []);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  return {
    credentials,
    loading,
    saveCredentials,
    isLoggedIn: !!credentials,
  };
};

export default useAuth;
