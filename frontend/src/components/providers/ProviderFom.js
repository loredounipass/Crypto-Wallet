import React, { useState, use, useEffect } from 'react';
import { useHistory } from 'react-router-dom'; 
import { useTranslation } from 'react-i18next';
import useProvider from '../../hooks/useProviders';
import { AuthContext } from '../../hooks/AuthContext';
import useAllWallets from '../../hooks/useAllWallets';
import TransactionToast from '../TransactionToast';
import { getCoinLogo, getCoinFallbackLogo } from '../utils/Chains';

export default function ProviderForm() {
  const { t } = useTranslation();
  const { createNewProvider, findByEMail, checkTerms, acceptTerms } = useProvider();
  const AVAILABLE_PAYMENT_METHODS = [t('p2p_bank_transfer'), t('p2p_in_person')];
  const { auth } = use(AuthContext);
  const history = useHistory();
  const [toast, setToast] = useState(null);

  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    firstName: auth?.firstName || '',
    lastName: auth?.lastName || '',
    idNumber: '',
    email: auth?.email || '',
    streetName: '',
    city: '',
    postalCode: '',
    preferredBank: '',
  });

  const [destinationWallets, setDestinationWallets] = useState([]);
  const { allWalletInfo } = useAllWallets();

  useEffect(() => {
    if (auth) {
      setForm(prev => ({
        ...prev,
        firstName: prev.firstName || auth.firstName || '',
        lastName: prev.lastName || auth.lastName || '',
        email: prev.email || auth.email || ''
      }));
    }
  }, [auth]);


  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState([]);

  const hasCheckedProvider = React.useRef(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.idNumber || !form.email) {
        setToast({ kind: 'withdraw', message: t('p2p_complete_personal') });
        return;
      }
    }
    if (step === 2) {
      if (!form.streetName || !form.city || !form.postalCode) {
        setToast({ kind: 'withdraw', message: t('p2p_complete_location') });
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedPaymentMethods.length === 0) {
      setToast({ kind: 'withdraw', message: t('p2p_select_payment_method') });
      return;
    }
    if (selectedPaymentMethods.includes(t('p2p_bank_transfer')) && !form.preferredBank) {
      setToast({ kind: 'withdraw', message: t('p2p_enter_bank') });
      return;
    }
    if (destinationWallets.length === 0) {
      setToast({ kind: 'withdraw', message: t('p2p_select_wallet') });
      return;
    }
    try {
      await createNewProvider({
        ...form,
        paymentMethods: selectedPaymentMethods,
        destinationWallets
      });
      setToast({ kind: 'deposit', message: t('p2p_provider_created') });
      setTimeout(() => {
        history.push('/providerChat');
      }, 1500);
    } catch (err) {
      setToast({ 
        kind: 'withdraw', 
        message: err.message
      });
    }
  };

  const togglePaymentMethod = (pm) => {
    setSelectedPaymentMethods((prev) =>
      prev.includes(pm) ? prev.filter((p) => p !== pm) : [...prev, pm]
    );
  };

  const toggleWallet = (wallet) => {
    setDestinationWallets((prev) => {
      const exists = prev.find(w => w.address === wallet.address && w.coin === wallet.coin);
      if (exists) {
        return prev.filter(w => w.address !== wallet.address || w.coin !== wallet.coin);
      }
      return [...prev, { address: wallet.address, coin: wallet.coin, chainId: wallet.chainId, enabled: true }];
    });
  };

  useEffect(() => {
    const fetchProvider = async () => {
      if (!hasCheckedProvider.current && auth?.email) {
        hasCheckedProvider.current = true;
        try {
          const response = await findByEMail(auth.email);
          if (response) {
            history.push('/providerChat');
          } else {
            const hasAcceptedTerms = await checkTerms();
            if (!hasAcceptedTerms) {
              setShowTermsDialog(true);
            }
          }
        } catch (err) {
          console.error("Error en findByEMail:", err);
          if (err.message) {
            setToast({ kind: 'withdraw', message: err.message });
          }
        }
      }
    };
    fetchProvider();
  }, [auth?.email, findByEMail, checkTerms, history]);

  const handleAcceptTerms = async () => {
    try {
      await acceptTerms();
      setShowTermsDialog(false);
    } catch (err) {
      setToast({ kind: 'withdraw', message: err.message });
    }
  };

  // Design Tokens
  const sectionTitleClass = "text-xl font-bold text-white mb-6 text-center";
  const labelClass = 'mb-1.5 block text-sm font-medium text-slate-300';
  const inputClass = 'w-full rounded-xl border border-[#1F1F33] bg-[#080811] px-4 py-3 text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-500 hover:bg-[#0A0A14] focus:border-[#2186EB] focus:bg-[#0A0A14] focus:ring-2 focus:ring-[#2186EB]/20';
  const modalCardClass = 'w-full max-w-md transform overflow-hidden rounded-2xl border border-[#1F1F33] bg-gradient-to-b from-[#131327] to-[#0C0C17] p-6 shadow-2xl transition-all';
  const btnPrimary = "group relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] p-[1px] transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:cursor-not-allowed disabled:opacity-50";
  const btnSecondary = "rounded-xl border border-[#1F1F33] bg-[#1A1A2E] px-6 py-3 font-medium text-slate-300 transition-all hover:bg-[#2D2D44] hover:text-white";

  return (
    <div className="w-full h-full py-2 px-2 sm:px-4 lg:px-8 flex flex-col justify-center">
      <div className="mx-auto w-full max-w-2xl">
        
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/30">
            <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {t('p2p_registration_title')}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {t('p2p_registration_subtitle')}
          </p>
        </div>

        {/* Stepper Progress */}
        <div className="mb-8 flex items-center justify-center">
          {[1, 2, 3].map((num) => (
            <React.Fragment key={num}>
              <div className="flex flex-col items-center">
                <div 
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-bold transition-all duration-300 ${
                    step >= num 
                      ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {step > num ? '✓' : num}
                </div>
                <span className={`absolute mt-12 text-[10px] sm:text-xs font-medium uppercase tracking-wider ${step >= num ? 'text-blue-400' : 'text-slate-600'}`}>
                  {num === 1 && t('p2p_step_personal')}
                  {num === 2 && t('p2p_step_location')}
                  {num === 3 && t('p2p_step_details')}
                </span>
              </div>
              {num < 3 && (
                <div className={`mx-2 sm:mx-4 h-1 w-16 sm:w-24 rounded-full transition-all duration-300 ${step > num ? 'bg-blue-600' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl border border-[#1F1F33] bg-gradient-to-b from-[#131327] to-[#0C0C17] shadow-2xl backdrop-blur-sm mt-8">
          <form onSubmit={handleSubmit} className="p-6 sm:p-10">
            
            {/* Step 1: Información Personal */}
            <div className={`transition-all duration-500 ${step === 1 ? 'block animate-[fadeIn_0.5s_ease-out]' : 'hidden'}`}>
              <h3 className={sectionTitleClass}>{t('p2p_personal_info')}</h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>{t('p2p_first_name')}</label>
                  <input className={inputClass} name="firstName" value={form.firstName} onChange={handleChange} placeholder={t('p2p_first_name_placeholder')} readOnly={!!auth?.firstName} style={{ opacity: auth?.firstName ? 0.7 : 1 }} />
                </div>
                <div>
                  <label className={labelClass}>{t('p2p_last_name')}</label>
                  <input className={inputClass} name="lastName" value={form.lastName} onChange={handleChange} placeholder={t('p2p_last_name_placeholder')} readOnly={!!auth?.lastName} style={{ opacity: auth?.lastName ? 0.7 : 1 }} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t('p2p_id_number')}</label>
                  <input className={inputClass} name="idNumber" value={form.idNumber} onChange={handleChange} placeholder={t('p2p_id_placeholder')} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t('p2p_email')}</label>
                  <input type="email" className={inputClass} name="email" value={form.email} onChange={handleChange} placeholder={t('p2p_email_placeholder')} readOnly={!!auth?.email} style={{ opacity: auth?.email ? 0.7 : 1 }} />
                </div>
              </div>
            </div>

            {/* Step 2: Ubicación */}
            <div className={`transition-all duration-500 ${step === 2 ? 'block animate-[fadeIn_0.5s_ease-out]' : 'hidden'}`}>
              <h3 className={sectionTitleClass}>{t('p2p_location_title')}</h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t('p2p_address')}</label>
                  <input className={inputClass} name="streetName" value={form.streetName} onChange={handleChange} placeholder={t('p2p_address_placeholder')} />
                </div>
                <div>
                  <label className={labelClass}>{t('p2p_city')}</label>
                  <input className={inputClass} name="city" value={form.city} onChange={handleChange} placeholder={t('p2p_city_placeholder')} />
                </div>
                <div>
                  <label className={labelClass}>{t('p2p_zip_code')}</label>
                  <input className={inputClass} name="postalCode" value={form.postalCode} onChange={handleChange} placeholder={t('p2p_zip_placeholder')} />
                </div>
              </div>
            </div>

            {/* Step 3: Detalles Operativos P2P */}
            <div className={`transition-all duration-500 ${step === 3 ? 'block animate-[fadeIn_0.5s_ease-out]' : 'hidden'}`}>
              <h3 className={sectionTitleClass}>{t('p2p_operational_details')}</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className={labelClass}>{t('p2p_destination_wallets')}</label>
                  <p className="mb-3 text-xs text-slate-400">{t('p2p_destination_wallets_desc')}</p>
                  
                  {!allWalletInfo || allWalletInfo.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#1F1F33] p-6 text-center">
                      <p className="text-slate-400 mb-4 text-sm">{t('p2p_no_wallets')}</p>
                      <button type="button" onClick={() => history.push('/wallets')} className={btnSecondary}>
                        {t('p2p_create_wallet')}
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {allWalletInfo.map(wallet => {
                        const isSelected = destinationWallets.some(w => w.address === wallet.address && w.coin === wallet.coin);
                        return (
                          <button
                            key={`${wallet.coin}-${wallet.address}`}
                            type="button"
                            onClick={() => toggleWallet(wallet)}
                            className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                              isSelected 
                                ? 'border-[#8B5CF6] bg-[#8B5CF6]/10' 
                                : 'border-[#1F1F33] bg-[#0A0A14] hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0A0A14]' : ''}`}>
                                <img 
                                  src={getCoinLogo(wallet.coin)} 
                                  alt={wallet.coin}
                                  onError={(e) => {
                                      e.currentTarget.src = getCoinFallbackLogo(wallet.coin);
                                  }}
                                  className="h-10 w-10 object-contain"
                                />
                              </div>
                              <div className="text-left">
                                <p className={`font-semibold ${isSelected ? 'text-[#8B5CF6]' : 'text-slate-200'}`}>
                                  {wallet.coin?.toUpperCase()} Wallet
                                </p>
                                <p className="text-xs text-slate-500 font-mono">
                                  {wallet.address?.substring(0, 10)}...{wallet.address?.substring(wallet.address.length - 4)}
                                </p>
                              </div>
                            </div>
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}`}>
                              {isSelected && <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelClass}>{t('p2p_payment_methods_label')}</label>
                  <p className="mb-3 text-xs text-slate-400">{t('p2p_payment_methods_desc')}</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {AVAILABLE_PAYMENT_METHODS.map((pm) => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => togglePaymentMethod(pm)}
                        className={`group relative flex items-center justify-center rounded-xl border p-3 text-sm font-medium transition-all duration-200 ${
                          selectedPaymentMethods.includes(pm)
                            ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#8B5CF6]'
                            : 'border-[#1F1F33] bg-[#0A0A14] text-slate-400 hover:border-[#8B5CF6] hover:bg-[#0A0A14] hover:text-slate-200'
                        }`}
                      >
                        {selectedPaymentMethods.includes(pm) && (
                          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                        )}
                        {pm}
                      </button>
                    ))}
                  </div>
                  
                  {selectedPaymentMethods.includes('Transferencia Bancaria') && (
                    <div className="mt-5 animate-[fadeIn_0.3s_ease-out]">
                      <label className={labelClass}>{t('p2p_preferred_bank')}</label>
                      <input
                        type="text"
                        name="preferredBank"
                        value={form.preferredBank}
                        onChange={handleChange}
                        placeholder={t('p2p_bank_placeholder')}
                        className={inputClass}
                      />
                      <p className="mt-1 text-xs text-slate-400">
                        {t('p2p_bank_desc')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-10 flex items-center justify-between border-t border-slate-700/50 pt-6">
              {step > 1 ? (
                <button type="button" onClick={handlePrevStep} className={btnSecondary}>
                  {t('p2p_back_button')}
                </button>
              ) : (
                <div /> /* Empty div to keep 'Next' button on the right */
              )}

              {step < 3 ? (
                <button type="button" onClick={handleNextStep} className={btnPrimary}>
                  <div className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] px-6 py-3 font-bold text-white transition-all group-hover:from-[#7C3AED] group-hover:to-[#4F46E5]">
                    {t('p2p_next')}
                  </div>
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={selectedPaymentMethods.length === 0}
                  className={btnPrimary}
                >
                  <div className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] px-8 py-3 font-bold text-white transition-all group-hover:from-[#7C3AED] group-hover:to-[#4F46E5]">
                    {t('p2p_complete_registration')}
                  </div>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Términos */}
      {showTermsDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className={`${modalCardClass} animate-[fadeIn_0.3s_ease-out]`}>
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-center text-xl font-bold text-white">{t('p2p_kyc_title')}</h3>
            <div className="mt-4 flex flex-col gap-5 text-slate-300">
              <div className="rounded-xl bg-slate-800/50 p-4 text-sm leading-relaxed border border-slate-700/50">
                {t('p2p_kyc_terms')}
              </div>
              
              <label className="group flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 transition-colors hover:bg-slate-800/50">
                <div className="relative mt-0.5 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-slate-500 bg-slate-800 transition-all checked:border-blue-500 checked:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <svg className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                  {t('p2p_accept_terms')}
                </span>
              </label>

              <button
                type="button"
                disabled={!termsAccepted}
                onClick={handleAcceptTerms}
                className="mt-2 w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {t('p2p_accept_continue')}
              </button>
            </div>
          </div>
        </div>
      )}

      <TransactionToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
