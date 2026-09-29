import { useState, useCallback } from 'react';
import Provider from '../services/providerService';




// CUSTOM HOOK THAT MANAGES THE REGISTRATION AND QUERYING OF FIAT PROVIDER ACCOUNTS
export default function useProviders() {
  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);




  // REGISTERS A NEW PROVIDER ACCOUNT WITH THE SPECIFIED DETAILS
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




  // FETCHES THE LIST OF ALL AVAILABLE FIAT PROVIDERS IN THE SYSTEM
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




  // SEARCHES FOR A SPECIFIC PROVIDER PROFILE BY THEIR EMAIL ADDRESS
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




  // CHECKS IF THE CURRENT PROVIDER HAS ACCEPTED THE LATEST TERMS OF SERVICE
  const checkTerms = useCallback(async () => {
    try {
      const res = await Provider.checkTerms();
      return res?.accepted || false;
    } catch (err) {
      console.error('Error checking terms:', err);
      return false;
    }
  }, []);




  // REGISTERS THE CURRENT PROVIDER'S ACCEPTANCE OF THE TERMS OF SERVICE
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
