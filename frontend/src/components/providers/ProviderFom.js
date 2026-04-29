import React, { useState, useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom'; 
import useProvider from '../../hooks/useProviders';
import { AuthContext } from '../../hooks/AuthContext';
import TransactionToast from '../TransactionToast';

export default function ProviderForm() {
  const { createNewProvider, findByEMail, checkTerms, acceptTerms } = useProvider();
  const { auth } = useContext(AuthContext);
  const history = useHistory();
  const [toast, setToast] = useState(null);

  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    idNumber: '',
    email: '',
    streetName: '',
    city: '',
    postalCode: '',
    walletAddress: '',
  });

  const AVAILABLE_PAYMENT_METHODS = [
    'Transferencia Bancaria', 'Zelle', 'PayPal', 'Nequi',
    'Mercado Pago', 'Efectivo', 'Otro'
  ];
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState([]);

  const [hasCheckedProvider, setHasCheckedProvider] = useState(false);
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
        setToast({ kind: 'withdraw', message: 'Por favor completa todos los campos personales.' });
        return;
      }
    }
    if (step === 2) {
      if (!form.streetName || !form.city || !form.postalCode) {
        setToast({ kind: 'withdraw', message: 'Por favor completa todos los campos de ubicación.' });
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
      setToast({ kind: 'withdraw', message: 'Debes seleccionar al menos un método de pago.' });
      return;
    }
    try {
      await createNewProvider({
        ...form,
        paymentMethods: selectedPaymentMethods,
      });
      setToast({ kind: 'deposit', message: 'Proveedor creado exitosamente' });
      setTimeout(() => {
        history.push('/providerChat');
      }, 1500);
    } catch (err) {
      setToast({ 
        kind: 'withdraw', 
        message: err.message || err.response?.data?.message || 'Ocurrió un error al crear el proveedor' 
      });
    }
  };

  const togglePaymentMethod = (pm) => {
    setSelectedPaymentMethods((prev) =>
      prev.includes(pm) ? prev.filter((p) => p !== pm) : [...prev, pm]
    );
  };

  useEffect(() => {
    const fetchProvider = async () => {
      if (!hasCheckedProvider && auth?.email) {
        setHasCheckedProvider(true);
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
  }, [auth?.email, hasCheckedProvider, findByEMail, checkTerms, history]);

  const handleAcceptTerms = async () => {
    try {
      await acceptTerms();
      setShowTermsDialog(false);
    } catch (err) {
      setToast({ kind: 'withdraw', message: 'Error al aceptar los términos' });
    }
  };

  // Design Tokens
  const sectionTitleClass = "text-xl font-bold text-white mb-6 text-center";
  const labelClass = 'mb-1.5 block text-sm font-medium text-slate-300';
  const inputClass = 'w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-500 hover:bg-slate-800 focus:border-blue-500 focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20';
  const modalCardClass = 'w-full max-w-md transform overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl transition-all';
  const btnPrimary = "group relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 p-[1px] transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:cursor-not-allowed disabled:opacity-50";
  const btnSecondary = "rounded-xl border border-slate-600 bg-slate-800 px-6 py-3 font-medium text-slate-300 transition-all hover:bg-slate-700 hover:text-white";

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="mx-auto w-full max-w-2xl">
        
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/30">
            <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Registro P2P
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Completa tu perfil en 3 sencillos pasos
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
                  {num === 1 && 'Personal'}
                  {num === 2 && 'Ubicación'}
                  {num === 3 && 'Detalles'}
                </span>
              </div>
              {num < 3 && (
                <div className={`mx-2 sm:mx-4 h-1 w-16 sm:w-24 rounded-full transition-all duration-300 ${step > num ? 'bg-blue-600' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/80 shadow-2xl backdrop-blur-sm mt-8">
          <form onSubmit={handleSubmit} className="p-6 sm:p-10">
            
            {/* Step 1: Información Personal */}
            <div className={`transition-all duration-500 ${step === 1 ? 'block animate-[fadeIn_0.5s_ease-out]' : 'hidden'}`}>
              <h3 className={sectionTitleClass}>Información Personal</h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Primer nombre</label>
                  <input className={inputClass} name="firstName" value={form.firstName} onChange={handleChange} placeholder="Ej. Juan" />
                </div>
                <div>
                  <label className={labelClass}>Apellido</label>
                  <input className={inputClass} name="lastName" value={form.lastName} onChange={handleChange} placeholder="Ej. Pérez" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Número de identificación</label>
                  <input className={inputClass} name="idNumber" value={form.idNumber} onChange={handleChange} placeholder="Documento de identidad" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Correo electrónico</label>
                  <input type="email" className={inputClass} name="email" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com" />
                </div>
              </div>
            </div>

            {/* Step 2: Ubicación */}
            <div className={`transition-all duration-500 ${step === 2 ? 'block animate-[fadeIn_0.5s_ease-out]' : 'hidden'}`}>
              <h3 className={sectionTitleClass}>Ubicación</h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Dirección (Calle / Av)</label>
                  <input className={inputClass} name="streetName" value={form.streetName} onChange={handleChange} placeholder="Av. Principal 123" />
                </div>
                <div>
                  <label className={labelClass}>Ciudad</label>
                  <input className={inputClass} name="city" value={form.city} onChange={handleChange} placeholder="Ciudad" />
                </div>
                <div>
                  <label className={labelClass}>Código Postal</label>
                  <input className={inputClass} name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="ZIP" />
                </div>
              </div>
            </div>

            {/* Step 3: Detalles Operativos P2P */}
            <div className={`transition-all duration-500 ${step === 3 ? 'block animate-[fadeIn_0.5s_ease-out]' : 'hidden'}`}>
              <h3 className={sectionTitleClass}>Detalles Operativos P2P</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className={labelClass}>Wallet de destino (para recibir crypto)</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg className="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4A2 2 0 002 6V18A2 2 0 004 20H20A2 2 0 0022 18V6A2 2 0 0020 4ZM20 18H4V6H20V18ZM14 10H18V14H14V10Z" />
                      </svg>
                    </div>
                    <input className={`${inputClass} pl-11 font-mono text-sm`} name="walletAddress" value={form.walletAddress} onChange={handleChange} placeholder="0x..." />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Métodos de pago aceptados</label>
                  <p className="mb-3 text-xs text-slate-400">Selecciona los métodos por los cuales puedes recibir o enviar dinero fiat.</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {AVAILABLE_PAYMENT_METHODS.map((pm) => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => togglePaymentMethod(pm)}
                        className={`group relative flex items-center justify-center rounded-xl border p-3 text-sm font-medium transition-all duration-200 ${
                          selectedPaymentMethods.includes(pm)
                            ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                            : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {selectedPaymentMethods.includes(pm) && (
                          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                        )}
                        {pm}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-10 flex items-center justify-between border-t border-slate-700/50 pt-6">
              {step > 1 ? (
                <button type="button" onClick={handlePrevStep} className={btnSecondary}>
                  ← Atrás
                </button>
              ) : (
                <div /> /* Empty div to keep 'Next' button on the right */
              )}

              {step < 3 ? (
                <button type="button" onClick={handleNextStep} className={btnPrimary}>
                  <div className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-bold text-white transition-all group-hover:from-blue-500 group-hover:to-cyan-400">
                    Siguiente →
                  </div>
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={selectedPaymentMethods.length === 0}
                  className={btnPrimary}
                >
                  <div className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-3 font-bold text-white transition-all group-hover:from-blue-500 group-hover:to-cyan-400">
                    Completar Registro
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
            <h3 className="text-center text-xl font-bold text-white">Verificación de Identidad</h3>
            <div className="mt-4 flex flex-col gap-5 text-slate-300">
              <div className="rounded-xl bg-slate-800/50 p-4 text-sm leading-relaxed border border-slate-700/50">
                Al registrarte como proveedor P2P en nuestra plataforma, aceptas someterte a un proceso de verificación de identidad (KYC).
                <br /><br />
                Nos tomamos muy en serio la seguridad de nuestra red. Tus datos serán tratados con estricta confidencialidad y utilizados únicamente con fines de autenticación y cumplimiento normativo.
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
                  He leído y acepto los términos y condiciones de proveedor P2P.
                </span>
              </label>

              <button
                type="button"
                disabled={!termsAccepted}
                onClick={handleAcceptTerms}
                className="mt-2 w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                Aceptar y Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      <TransactionToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
