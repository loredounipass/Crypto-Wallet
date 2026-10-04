import { useEffect, useMemo, useState, use, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useProviderSettings from '../../hooks/useProviderSettings';
import useAllWallets from '../../hooks/useAllWallets';
import useTokenBalances from '../../hooks/useTokenBalances';
import { AuthContext } from '../../hooks/AuthContext';
import { getNetworkName } from '../utils/Chains';



// CUSTOM HOOK THAT MANAGES THE SETTINGS, PAYMENT METHODS AND WALLET CONFIGURATION FOR A PROVIDER
export default function useProviderSettingsLogic({ open, onClose }) {
  const { t } = useTranslation();
  const { auth } = use(AuthContext);
  const { settings, isLoading, error, getSettings, addPaymentMethod, deletePaymentMethod, toggleDestinationWallet } = useProviderSettings();
  const { allWalletInfo: wallets, refreshWallets } = useAllWallets();
  const { tokenBalances } = useTokenBalances();

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



  // UNIFIED LIST OF ALL TOGGLEABLE ASSETS (NATIVE WALLETS + ERC20 TOKENS)
  const allToggleableAssets = useMemo(() => {
    const nativeAssets = (wallets || []).map(w => ({
      key: `native-${w.coin}-${w.chainId}`,
      address: w.address,
      coin: w.coin,
      chainId: w.chainId,
      isToken: false,
      tokenAddress: null,
      label: `${w.coin?.toUpperCase()}`,
      sublabel: getNetworkName(w.chainId),
    }));

    const tokenAssets = (tokenBalances || []).map(t => ({
      key: `token-${t.chainId}-${t.tokenAddress}`,
      address: t.walletAddress,
      coin: t.tokenSymbol,
      chainId: t.chainId,
      isToken: true,
      tokenAddress: t.tokenAddress,
      label: `${t.tokenSymbol?.toUpperCase()}`,
      sublabel: `${getNetworkName(t.chainId)} · ERC20`,
    }));

    return [...nativeAssets, ...tokenAssets];
  }, [wallets, tokenBalances]);



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



  // TOGGLES THE ENABLED STATE OF A DESTINATION WALLET OR TOKEN
  const handleToggle = async (asset) => {
    try {
      const body = { address: asset.address };
      if (asset.isToken) {
        body.isToken = true;
        body.tokenAddress = asset.tokenAddress;
        body.coin = asset.coin;
        body.chainId = asset.chainId;
      }
      await toggleDestinationWallet(body);
    } catch (e) {
      console.error(e);
    }
  };



  // CHECKS IF A SPECIFIC ASSET IS CURRENTLY ENABLED AS A DESTINATION
  const isAssetEnabled = (asset) => {
    if (!settings?.destinationWallets) return false;
    if (asset.isToken) {
      const found = settings.destinationWallets.find(
        w => w.address === asset.address && w.isToken === true && w.tokenAddress === asset.tokenAddress
      );
      return found ? found.enabled : false;
    }
    const found = settings.destinationWallets.find(
      w => w.address === asset.address && !w.isToken
    );
    return found ? found.enabled : false;
  };

  return {
    t,
    settings,
    isLoading,
    error,
    allToggleableAssets,
    newMethod,
    setNewMethod,
    handleAddMethod,
    handleDeleteMethod,
    handleToggle,
    isAssetEnabled
  };
}
