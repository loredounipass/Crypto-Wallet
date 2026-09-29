import { useState, useCallback } from 'react';
import Provider from '../services/providerService';




// CUSTOM HOOK TO MANAGE THE FIAT PROVIDER CONFIGURATION AND PAYMENT METHODS
export default function useProviderSettings() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);




  // FETCHES THE CURRENT PROVIDER SETTINGS INCLUDING ACTIVE PAYMENT METHODS
  const getSettings = useCallback(async (signal) => {
    setIsLoading(true);
    try {
      const res = await Provider.getSettings(signal);
      setSettings(res);
      setError(null);
      return res;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);




  // ADDS A NEW PAYMENT METHOD TO THE PROVIDER SETTINGS
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




  // DELETES AN EXISTING PAYMENT METHOD FROM THE PROVIDER SETTINGS
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




  // UPDATES THE DESTINATION WALLET CONFIGURATION FOR RECEIVING PAYMENTS
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




  // TOGGLES THE ENABLED STATUS OF THE DESTINATION WALLET FEATURE
  const toggleDestinationWallet = async (body) => {
    setIsLoading(true);
    try {
      const res = await Provider.toggleDestinationWallet(body);
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
    toggleDestinationWallet,
  };
}
