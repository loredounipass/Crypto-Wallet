import { useEffect, useState, use, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useProviderSettings from '../../hooks/useProviderSettings';
import useAllWallets from '../../hooks/useAllWallets';
import { AuthContext } from '../../hooks/AuthContext';



// CUSTOM HOOK THAT MANAGES THE SETTINGS, PAYMENT METHODS AND WALLET CONFIGURATION FOR A PROVIDER
export default function useProviderSettingsLogic({ open, onClose }) {
  const { t } = useTranslation();
  const { auth } = use(AuthContext);
  const { settings, isLoading, getSettings, addPaymentMethod, deletePaymentMethod, toggleDestinationWallet } = useProviderSettings();
  const { allWalletInfo: wallets, refreshWallets } = useAllWallets();

  const [newMethod, setNewMethod] = useState('');



  // REF TO KEEP TRACK OF THE LATEST AUTH STATE TO PREVENT STALE CLOSURES
  const authRef = useRef(auth);
  useEffect(() => {
    authRef.current = auth;
  });



  // EFFECT TO FETCH THE PROVIDER SETTINGS AND WALLETS WHEN THE MODAL IS OPENED
  useEffect(() => {
    if (!open || !auth?._id) return;

    const controller = new AbortController();

    const doFetch = async () => {
      if (!authRef.current?._id) return;
      await getSettings(controller.signal);
      if (authRef.current?._id) {
        refreshWallets();
      }
    };
    doFetch();

    return () => {
      controller.abort();
    };
  }, [open, auth, getSettings, refreshWallets]);



  // EFFECT TO CLOSE THE SETTINGS MODAL IF THE USER LOGS OUT OR THE AUTH SESSION EXPIRES
  useEffect(() => {
    if (open && !auth?._id) {
      onClose();
    }
  }, [open, auth, onClose]);



  // HANDLES THE ADDITION OF A NEW PAYMENT METHOD
  const handleAddMethod = async () => {
    if (!newMethod.trim()) return;
    try {
      await addPaymentMethod({ paymentMethod: newMethod.trim() });
      setNewMethod('');
    } catch (e) {
      console.error(e);
    }
  };



  // HANDLES THE DELETION OF AN EXISTING PAYMENT METHOD
  const handleDeleteMethod = async (method) => {
    try {
      await deletePaymentMethod(method);
    } catch (e) {
      console.error(e);
    }
  };



  // TOGGLES THE ENABLED STATE OF A DESTINATION WALLET
  const handleToggle = async (address) => {
    try {
      await toggleDestinationWallet({ address });
    } catch (e) {
      console.error(e);
    }
  };



  // CHECKS IF A SPECIFIC WALLET ADDRESS IS CURRENTLY ENABLED
  const isWalletEnabled = (walletAddr) => {
    if (!settings?.destinationWallets) return false;
    const found = settings.destinationWallets.find(w => w.address === walletAddr);
    return found ? found.enabled : false;
  };

  return {
    t,
    settings,
    isLoading,
    wallets,
    newMethod,
    setNewMethod,
    handleAddMethod,
    handleDeleteMethod,
    handleToggle,
    isWalletEnabled
  };
}
