import { useState, useCallback } from 'react';
import Provider from '../services/providerService';

export default function useProviders() {
  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const createNewProvider = async (body) => {
    setIsLoading(true);
    try {
      const res = await Provider.createProvider(body);
      setProvider(res);
      setError(null);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getAllProviders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await Provider.getAllProviders();
      if (Array.isArray(res)) {
        setProviders(res);
        setError(null);
        return res;
      }
      return [];
    } catch (err) {
      setError(err.message);
      setProviders([]);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const findByEMail = useCallback(async (email) => {
    setIsLoading(true);
    try {
      const res = await Provider.findByEMail(email);
      if (res) {
        setProvider(res);
        setError(null);
        return res;
      }
      return null;
    } catch (err) {
      setError(err.message);
      setProvider(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkTerms = useCallback(async () => {
    try {
      const res = await Provider.checkTerms();
      return res?.accepted || false;
    } catch (err) {
      console.error('Error checking terms:', err);
      return false;
    }
  }, []);

  const acceptTerms = useCallback(async () => {
    try {
      const res = await Provider.acceptTerms();
      return res?.accepted || false;
    } catch (err) {
      console.error('Error accepting terms:', err);
      throw err;
    }
  }, []);

  return {
    providers,
    provider,
    error,
    isLoading,
    createNewProvider,
    findByEMail,
    getAllProviders,
    checkTerms,
    acceptTerms,
  };
}
