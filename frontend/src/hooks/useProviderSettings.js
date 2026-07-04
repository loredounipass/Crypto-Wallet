import { useState, useCallback } from 'react';
import Provider from '../services/providerService';

export default function useProviderSettings() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await Provider.getSettings();
      setSettings(res);
      setError(null);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addPaymentMethod = async (body) => {
    setIsLoading(true);
    try {
      const res = await Provider.addPaymentMethod(body);
      setSettings(res);
      setError(null);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePaymentMethod = async (method) => {
    setIsLoading(true);
    try {
      const res = await Provider.deletePaymentMethod(method);
      setSettings(res);
      setError(null);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateDestinationWallet = async (body) => {
    setIsLoading(true);
    try {
      const res = await Provider.updateDestinationWallet(body);
      setSettings(res);
      setError(null);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    settings,
    error,
    isLoading,
    getSettings,
    addPaymentMethod,
    deletePaymentMethod,
    updateDestinationWallet,
  };
}
