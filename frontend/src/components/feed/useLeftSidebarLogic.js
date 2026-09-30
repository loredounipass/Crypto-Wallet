import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import donationsService from '../../services/donations';



// CUSTOM HOOK THAT MANAGES THE STATE AND LOGIC FOR THE LEFT SIDEBAR
export default function useLeftSidebarLogic(auth) {
  const [copied, setCopied] = useState({ btc: false, usdt: false });
  const [wallets, setWallets] = useState({ btc: '', usdt: '' });
  const navigate = useNavigate();



  // EFFECT THAT FETCHES THE DONATION WALLET ADDRESSES ON MOUNT
  useEffect(() => {
    donationsService.getWallets()
      .then(resp => {
        const data = resp?.data;
        if (data) setWallets({ btc: data.btc || '', usdt: data.usdt || '' });
      })
      .catch(() => { });
  }, []);



  const btcAddress = wallets.btc;
  const usdtAddress = wallets.usdt;



  // COPIES THE PROVIDED TEXT TO THE CLIPBOARD AND SHOWS A SUCCESS MESSAGE
  const copyToClipboard = async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied((p) => ({ ...p, [key]: true }));
      setTimeout(() => setCopied((p) => ({ ...p, [key]: false })), 2000);
    } catch (err) { }
  };



  // COMPUTES THE DISPLAY NAME OF THE CURRENT USER
  const first = auth?.firstName || '';
  const last = auth?.lastName || '';
  const name = `${first} ${last}`.trim() || auth?.username || 'Usuario';



  // NAVIGATES TO THE SPECIFIED PATH
  const nav = (path) => {
    try { navigate(path); } catch (_) { }
  };


  return { copied, btcAddress, usdtAddress, copyToClipboard, name, nav };
}
