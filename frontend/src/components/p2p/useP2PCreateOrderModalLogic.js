import { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useAllWallets from '../../hooks/useAllWallets';
import Price from '../../services/price';
import Escrow from '../../services/escrow';

const MIN_ORDER_USD = 10;



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
  const shouldRender = Boolean(open && provider);



  // MEMOIZED LIST OF COMPATIBLE WALLETS BASED ON THE PROVIDER'S DESTINATION WALLETS
  const compatibleWallets = useMemo(() => {
    if (!wallets || !provider?.destinationWallets) return [];
    return wallets.filter(w => provider.destinationWallets.some(dw => dw.coin?.toUpperCase() === w.coin?.toUpperCase() && dw.enabled));
  }, [wallets, provider]);

  const [coin, setCoin] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [coinPriceUsd, setCoinPriceUsd] = useState(0);
  const [gasFee, setGasFee] = useState(0);
  const [gasLoading, setGasLoading] = useState(false);



  // LIST OF AVAILABLE PAYMENT METHODS DERIVED FROM THE PROVIDER
  const availablePaymentMethods = provider?.paymentMethods?.length > 0
    ? provider.paymentMethods.map(pm =>
      (pm === 'Transferencia Bancaria' && provider.preferredBank)
        ? provider.preferredBank
        : pm
    )
    : ['Transferencia Bancaria'];

  const selectedWallet = wallets?.find(w => w.coin?.toUpperCase() === coin?.toUpperCase());
  const balance = Number(selectedWallet?.balance || 0);
  const chainId = selectedWallet?.chainId || 0;



  // CALCULATES THE AVAILABLE BALANCE BASED ON THE SELECTED WALLET
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
        if (isMountedLocal) setCoinPriceUsd(Number(data?.USD || 0));
      } catch (_) {
        if (isMountedLocal) setCoinPriceUsd(0);
      }
    }
    loadPrice();
    return () => { isMountedLocal = false; };
  }, [coin]);



  // EFFECT THAT FETCHES THE ESTIMATED NETWORK GAS FEE FOR THE TRANSACTION
  useEffect(() => {
    let isMountedLocal = true;
    async function loadGasEstimate() {
      if (!coin || !chainId) {
        if (isMountedLocal) setGasFee(0);
        return;
      }
      setGasLoading(true);
      console.log('[P2P Gas] Fetching estimate:', { coin, chainId, selectedWallet: selectedWallet ? { address: selectedWallet.address, balance: selectedWallet.balance, chainId: selectedWallet.chainId } : 'none' });
      try {
        const data = await Escrow.getGasEstimate(coin, chainId);
        console.log('[P2P Gas] Response:', data);
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
  }, [coin, chainId, selectedWallet]);

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
    if (!isValid) return;
    const safeNetAmount = truncateToDecimals(netAmount, 8);
    onSubmit({
      coin: coin.toUpperCase(),
      amount: safeNetAmount,
      fiatAmount: parseFloat(fiatAmount),
      providerEmail: provider.email,
      paymentMethod: resolvePaymentMethod(paymentMethod),
    });
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
