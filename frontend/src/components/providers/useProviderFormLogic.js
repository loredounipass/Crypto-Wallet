import { useState, use, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useTranslation } from 'react-i18next';
import useProvider from '../../hooks/useProviders';
import { AuthContext } from '../../hooks/AuthContext';
import useAllWallets from '../../hooks/useAllWallets';



// CUSTOM HOOK THAT MANAGES THE MULTI-STEP REGISTRATION FORM FOR A NEW PROVIDER
export default function useProviderFormLogic() {
  const { t } = useTranslation();
  const { createNewProvider, findByEMail, checkTerms, acceptTerms } = useProvider();
  const AVAILABLE_PAYMENT_METHODS = [t('p2p_bank_transfer'), t('p2p_in_person')];
  const { auth } = use(AuthContext);
  const navigate = useNavigate();
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



  // EFFECT TO SYNC AUTHENTICATED USER DETAILS WITH THE FORM STATE
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
  const hasCheckedProvider = useRef(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);



  // HANDLES INPUT CHANGES FOR THE FORM FIELDS
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };



  // VALIDATES THE CURRENT STEP AND ADVANCES TO THE NEXT ONE
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



  // RETURNS TO THE PREVIOUS STEP IN THE REGISTRATION PROCESS
  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };



  // SUBMITS THE COMPLETE REGISTRATION FORM TO CREATE A NEW PROVIDER
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
        navigate('/provider-dashboard');
      }, 1500);
    } catch (err) {
      setToast({ 
        kind: 'withdraw', 
        message: err.message
      });
    }
  };



  // TOGGLES THE SELECTION OF A SPECIFIC PAYMENT METHOD
  const togglePaymentMethod = (pm) => {
    setSelectedPaymentMethods((prev) =>
      prev.includes(pm) ? prev.filter((p) => p !== pm) : [...prev, pm]
    );
  };



  // TOGGLES THE SELECTION OF A DESTINATION WALLET FOR OPERATIONS
  const toggleWallet = (wallet) => {
    setDestinationWallets((prev) => {
      const exists = prev.find(w => w.address === wallet.address && w.coin === wallet.coin);
      if (exists) {
        return prev.filter(w => w.address !== wallet.address || w.coin !== wallet.coin);
      }
      return [...prev, { address: wallet.address, coin: wallet.coin, chainId: wallet.chainId, enabled: true }];
    });
  };



  // EFFECT TO CHECK IF THE USER IS ALREADY A PROVIDER AND HANDLES KYC TERMS
  useEffect(() => {
    const fetchProvider = async () => {
      if (!hasCheckedProvider.current && auth?.email) {
        hasCheckedProvider.current = true;
        try {
          const response = await findByEMail(auth.email);
          if (response) {
            navigate('/provider-dashboard');
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
  }, [auth?.email, findByEMail, checkTerms, navigate]);



  // RECORDS THE USER'S ACCEPTANCE OF KYC TERMS
  const handleAcceptTerms = async () => {
    try {
      await acceptTerms();
      setShowTermsDialog(false);
    } catch (err) {
      setToast({ kind: 'withdraw', message: err.message });
    }
  };

  return {
    t,
    navigate,
    toast,
    setToast,
    step,
    form,
    auth,
    allWalletInfo,
    destinationWallets,
    selectedPaymentMethods,
    AVAILABLE_PAYMENT_METHODS,
    showTermsDialog,
    termsAccepted,
    setTermsAccepted,
    handleChange,
    handleNextStep,
    handlePrevStep,
    handleSubmit,
    togglePaymentMethod,
    toggleWallet,
    handleAcceptTerms
  };
}
