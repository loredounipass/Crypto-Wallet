import { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useAllWallets from '../../hooks/useAllWallets';
import useTokenBalances from '../../hooks/useTokenBalances';
import Price from '../../services/price';
import Escrow from '../../services/escrow';
import { getNetworkName } from '../utils/Chains';

const MIN_ORDER_USD = 10;
const STABLECOIN_FALLBACK_PRICE = { USDT: 1, USDC: 1 };



// CUSTOM HOOK THAT MANAGES THE STATE, VALIDATION, AND LOGIC FOR CREATING A P2P ORDER
export default function useP2PCreateOrderModalLogic({ open, provider, onSubmit }) {
  const { t } = useTranslation();
  const isMounted = useRef(true);



  // EFFECT THAT TRACKS COMPONENT MOUNT STATUS TO PREVENT MEMORY LEAKS
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const { allWalletInfo: wallets } = useAllWallets();
  const { tokenBalances } = useTokenBalances();
  const shouldRender = Boolean(open && provider);



  // MEMOIZED UNIFIED LIST OF SELECTABLE ASSETS (NATIVE COINS + ERC20 TOKENS)
  const allSelectableAssets = useMemo(() => {
    if (!wallets || !provider?.destinationWallets) return [];
    const enabledDestCoins = provider.destinationWallets.filter(dw => dw.enabled);

    // Native wallets compatible with provider
    const nativeAssets = wallets
      .filter(w => enabledDestCoins.some(dw => dw.coin?.toUpperCase() === w.coin?.toUpperCase()))
      .map(w => ({
        key: `native-${w.coin}`,
        coin: w.coin,
        balance: w.balance,
        address: w.address,
        chainId: w.chainId,
        isToken: false,
        tokenAddress: null,
        label: `${w.coin?.toUpperCase()} — Balance: ${Number(w.balance || 0).toFixed(6)}`,
      }));

    // ERC20 tokens compatible with provider
    const tokenAssets = (tokenBalances || [])
      .filter(t => enabledDestCoins.some(dw => dw.coin?.toUpperCase() === t.tokenSymbol?.toUpperCase()))
      .filter(t => t.availableBalance > 0)
      .map(t => ({
        key: `token-${t.chainId}-${t.tokenAddress}`,
        coin: t.tokenSymbol,
        balance: t.availableBalance,
        address: t.walletAddress,
        chainId: t.chainId,
        isToken: true,
        tokenAddress: t.tokenAddress,
        label: `${t.tokenSymbol?.toUpperCase()} (${getNetworkName(t.chainId)}) — Balance: ${t.availableBalance?.toFixed(6)}`,
      }));

    return [...nativeAssets, ...tokenAssets];
  }, [wallets, tokenBalances, provider]);


  // For backward compat, compatibleWallets maps to allSelectableAssets
  const compatibleWallets = allSelectableAssets;

  const [selectedAssetKey, setSelectedAssetKey] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [coinPriceUsd, setCoinPriceUsd] = useState(0);
  const [gasFee, setGasFee] = useState(0);
  const [gasLoading, setGasLoading] = useState(false);



  // DERIVED SELECTED ASSET FROM THE KEY
  const selectedAsset = useMemo(() => {
    return allSelectableAssets.find(a => a.key === selectedAssetKey) || null;
  }, [allSelectableAssets, selectedAssetKey]);

  const coin = selectedAsset?.coin || '';
  const setCoin = (key) => { setSelectedAssetKey(key); setAmount(''); };


  // LIST OF AVAILABLE PAYMENT METHODS DERIVED FROM THE PROVIDER
  const availablePaymentMethods = provider?.paymentMethods?.length > 0
    ? provider.paymentMethods.map(pm =>
      (pm === 'Transferencia Bancaria' && provider.preferredBank)
        ? provider.preferredBank
        : pm
    )
    : ['Transferencia Bancaria'];

  const selectedWallet = selectedAsset;
  const balance = Number(selectedAsset?.balance || 0);
  const chainId = selectedAsset?.chainId || 0;



  // CALCULATES THE AVAILABLE BALANCE BASED ON THE SELECTED ASSET
  const availableBalance = useMemo(() => {
    return balance || 0;
  }, [balance]);

  const belowMinimum = coinPriceUsd > 0 && (balance * coinPriceUsd) < MIN_ORDER_USD;



  // TRUNCATES A NUMERIC VALUE TO A SPECIFIC NUMBER OF DECIMALS WITHOUT ROUNDING
  const truncateToDecimals = (value, decimals = 8) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return 0;
    const factor = 10 ** decimals;
    return Math.floor(numeric * factor) / factor;
  };



  // FORMATS A VALUE TO A STRING WITH TRIMMED TRAILING ZEROS
  const formatTrimmed = (value, decimals = 8) => {
    const truncated = truncateToDecimals(value, decimals);
    if (!truncated) return '';
    return truncated.toFixed(decimals).replace(/\.?0+$/, '');
  };



  // EFFECT THAT FETCHES THE CURRENT USD PRICE FOR THE SELECTED COIN
  useEffect(() => {
    let isMountedLocal = true;
    async function loadPrice() {
      if (!coin) {
        if (isMountedLocal) setCoinPriceUsd(0);
        return;
      }
      try {
        const { data } = await Price.getPrice(coin);
        const price = Number(data?.USD || 0);
        if (isMountedLocal) {
          if (price > 0) {
            setCoinPriceUsd(price);
          } else {
            // Fallback for testnet stablecoins
            setCoinPriceUsd(STABLECOIN_FALLBACK_PRICE[coin.toUpperCase()] || 0);
          }
        }
      } catch (_) {
        if (isMountedLocal) {
          setCoinPriceUsd(STABLECOIN_FALLBACK_PRICE[coin.toUpperCase()] || 0);
        }
      }
    }
    loadPrice();
    return () => { isMountedLocal = false; };
  }, [coin]);



  // EFFECT THAT FETCHES THE ESTIMATED NETWORK GAS FEE FOR THE TRANSACTION
  useEffect(() => {
    let isMountedLocal = true;
    async function loadGasEstimate() {
      // ERC20 tokens don't have gas in token units (gas is paid in native coin)
      if (selectedAsset?.isToken) {
        if (isMountedLocal) setGasFee(0);
        setGasLoading(false);
        return;
      }
      if (!coin || !chainId) {
        if (isMountedLocal) setGasFee(0);
        return;
      }
      setGasLoading(true);
      try {
        const data = await Escrow.getGasEstimate(coin, chainId);
        if (isMountedLocal) setGasFee(Number(data.gasFee || 0));
      } catch (err) {
        console.error('[P2P Gas] Error:', err?.response?.data || err?.message || err);
        if (isMountedLocal) setGasFee(0);
      } finally {
        if (isMountedLocal) setGasLoading(false);
      }
    }
    loadGasEstimate();
    return () => { isMountedLocal = false; };
  }, [coin, chainId, selectedAsset]);

  const amountNum = parseFloat(amount) || 0;
  const netAmount = Math.max(0, amountNum - gasFee);



  // CALCULATES THE FIAT EQUIVALENT OF THE NET CRYPTO AMOUNT
  const fiatAmount = useMemo(() => {
    const qty = netAmount;
    if (!qty || !coinPriceUsd) return '';
    const totalUsd = truncateToDecimals(qty * coinPriceUsd, 2);
    return totalUsd ? totalUsd.toFixed(2) : '';
  }, [netAmount, coinPriceUsd]);

  const isValid = coin && amountNum > 0 && parseFloat(fiatAmount) > 0
    && paymentMethod
    && netAmount > 0
    && amountNum <= balance
    && !belowMinimum;

  const insufficientBalance = amountNum > 0 && amountNum > balance;



  // RESOLVES THE ACTUAL PAYMENT METHOD VALUE BASED ON THE PROVIDER'S CONFIGURATION
  const resolvePaymentMethod = (displayValue) => {
    if (provider?.paymentMethods?.includes(displayValue)) return displayValue;
    if (displayValue === provider?.preferredBank) return 'Transferencia Bancaria';
    return displayValue;
  };



  // HANDLES THE SUBMISSION OF THE NEW P2P ORDER
  const handleSubmit = () => {
    if (!isValid || !selectedAsset) return;
    const safeNetAmount = truncateToDecimals(netAmount, 8);
    const body = {
      coin: coin.toUpperCase(),
      amount: safeNetAmount,
      fiatAmount: parseFloat(fiatAmount),
      providerEmail: provider.email,
      paymentMethod: resolvePaymentMethod(paymentMethod),
      chainId: selectedAsset.chainId,
    };
    // Add token-specific fields for ERC20 orders
    if (selectedAsset.isToken && selectedAsset.tokenAddress) {
      body.tokenAddress = selectedAsset.tokenAddress;
      body.isToken = true;
    }
    onSubmit(body);
  };



  // SETS THE AMOUNT INPUT TO THE MAXIMUM AVAILABLE BALANCE
  const handleSetMax = () => {
    if (!coin || availableBalance <= 0) return;
    setAmount(formatTrimmed(availableBalance, 8));
  };

  return {
    t,
    shouldRender,
    compatibleWallets,
    coin,
    setCoin,
    amount,
    setAmount,
    paymentMethod,
    setPaymentMethod,
    coinPriceUsd,
    gasFee,
    gasLoading,
    availablePaymentMethods,
    selectedWallet,
    availableBalance,
    belowMinimum,
    amountNum,
    netAmount,
    fiatAmount,
    isValid,
    insufficientBalance,
    truncateToDecimals,
    handleSubmit,
    handleSetMax
  };
}

