import React, { useState, useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom'; 
import useProvider from '../../hooks/useProviders';
import { AuthContext } from '../../hooks/AuthContext';
import { useThemeMode } from '../../ui/styles';


export default function ProviderForm() {
  const { createNewProvider, findByEMail, provider, error } = useProvider();
  const { auth } = useContext(AuthContext);
  const history = useHistory();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

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
  const [showLoader, setShowLoader] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createNewProvider({
      ...form,
      paymentMethods: selectedPaymentMethods,
    });
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
            setShowLoader(true);
            setTimeout(() => {
              history.push('/providerChat');
            }, 3000);
          } else {
            setShowTermsDialog(true);
          }
        } catch (err) {
          console.error("Error en findByEMail:", err);
        }
      }
    };
    fetchProvider();
  }, [auth?.email, hasCheckedProvider, findByEMail, history]);

  const cardClass = isDark
    ? 'mx-auto mt-5 max-w-[640px] rounded-2xl border border-slate-700 bg-slate-900/95 p-5 shadow-xl sm:p-7'
    : 'mx-auto mt-5 max-w-[640px] rounded-2xl border border-slate-200 bg-white p-5 shadow-md sm:p-7';

  const titleClass = isDark
    ? 'mb-2 text-center text-2xl font-bold text-blue-300'
    : 'mb-2 text-center text-2xl font-bold text-blue-900';

  const subtitleClass = isDark
    ? 'mb-6 text-center text-sm text-slate-300'
    : 'mb-6 text-center text-sm text-slate-500';

  const labelClass = isDark
    ? 'mb-1 block text-sm font-medium text-slate-200'
    : 'mb-1 block text-sm font-medium text-slate-700';

  const inputClass = isDark
    ? 'w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30'
    : 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

  const modalCardClass = isDark
    ? 'w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl'
    : 'w-full max-w-md rounded-2xl bg-gradient-to-br from-sky-100 to-sky-300 p-6 shadow-xl';

  const modalTitleClass = isDark
    ? 'text-center text-xl font-bold text-sky-200'
    : 'text-center text-xl font-bold text-sky-900';

  const modalBodyClass = isDark
    ? 'mt-4 flex flex-col items-center gap-3 text-slate-200'
    : 'mt-4 flex flex-col items-center gap-3 text-sky-900';

  return (
    <>
      <div className={cardClass}>
        <h2 className={titleClass}>
          Registrame como proveedor P2P
        </h2>
        <p className={subtitleClass}>
          Completa tu informacion para activar tu perfil de proveedor.
        </p>
  
        {provider && (
          <div className="mb-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Proveedor creado exitosamente.
          </div>
        )}
        {error && (
          <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.message || 'Ocurrió un error'}
          </div>
        )}
  
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Primer nombre</span>
              <input
                className={inputClass}
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </label>
  
            <label className="block">
              <span className={labelClass}>Apellido</span>
              <input
                className={inputClass}
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </label>
  
            <label className="block sm:col-span-2">
              <span className={labelClass}>Numero de identificacion</span>
              <input
                className={inputClass}
                name="idNumber"
                value={form.idNumber}
                onChange={handleChange}
                required
              />
            </label>
  
            <label className="block sm:col-span-2">
              <span className={labelClass}>Correo electronico</span>
              <input
                className={inputClass}
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>
  
            <label className="block sm:col-span-2">
              <span className={labelClass}>Nombre de la calle</span>
              <input
                className={inputClass}
                name="streetName"
                value={form.streetName}
                onChange={handleChange}
                required
              />
            </label>
  
            <label className="block sm:col-span-2">
              <span className={labelClass}>Ciudad</span>
              <input
                className={inputClass}
                name="city"
                value={form.city}
                onChange={handleChange}
                required
              />
            </label>
  
            <label className="block sm:col-span-2">
              <span className={labelClass}>Codigo Postal</span>
              <input
                className={inputClass}
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                required
              />
            </label>

            {/* P2P Escrow Fields */}
            <label className="block sm:col-span-2">
              <span className={labelClass}>Wallet de destino (para recibir crypto P2P)</span>
              <input
                className={inputClass}
                name="walletAddress"
                value={form.walletAddress}
                onChange={handleChange}
                placeholder="0x..."
              />
            </label>

            <div className="block sm:col-span-2">
              <span className={labelClass}>Métodos de pago aceptados</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {AVAILABLE_PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => togglePaymentMethod(pm)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                      selectedPaymentMethods.includes(pm)
                        ? 'bg-blue-500 text-white shadow-sm'
                        : isDark
                          ? 'border border-slate-600 bg-slate-800 text-slate-300 hover:border-blue-400'
                          : 'border border-slate-300 bg-white text-slate-600 hover:border-blue-500'
                    }`}
                  >
                    {selectedPaymentMethods.includes(pm) ? '✓ ' : ''}{pm}
                  </button>
                ))}
              </div>
              {selectedPaymentMethods.length === 0 && (
                <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Selecciona al menos un método de pago para P2P
                </p>
              )}
            </div>
  
            <div className="sm:col-span-2">
              <button
                className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-3 font-bold text-white shadow-sm transition hover:from-blue-600 hover:to-blue-500"
                type="submit"
              >
                Crear proveedor
              </button>
            </div>
          </div>
        </form>
      </div>
  
      {showLoader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className={modalCardClass}>
            <h3 className={modalTitleClass}>Bienvenido</h3>
            <div className={modalBodyClass}>
              <span className={`inline-block h-12 w-12 animate-spin rounded-full border-4 border-t-transparent ${isDark ? 'border-sky-200' : 'border-sky-900'}`} />
              <p className="text-center text-lg font-medium">Baya, ya eres un proveedor. ¡Te queremos!</p>
            </div>
          </div>
        </div>
      )}
  
      {showTermsDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className={modalCardClass}>
            <h3 className={modalTitleClass}>Verificacion de identidad</h3>
            <div className={modalBodyClass}>
              <p className="text-center text-sm">
            Al registrarte como proveedor P2P, deberás completar un proceso de verificación de identidad, durante el cual se solicitará información personal con 
            fines de autenticación y cumplimiento normativo.
              </p>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-400 text-blue-600 focus:ring-blue-500"
                />
                <span>Acepto los términos y condiciones.</span>
              </label>
              <button
                type="button"
                disabled={!termsAccepted}
                onClick={() => setShowTermsDialog(false)}
                className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 px-5 py-2 font-bold text-white shadow-sm transition hover:from-blue-600 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
