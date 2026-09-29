import { useState, useEffect, use } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../hooks/AuthContext';
import User from '../../services/user';
import useAuth from '../../hooks/useAuth';



// CUSTOM HOOK THAT MANAGES TWO FACTOR AUTHENTICATION STATUS AND TOGGLING
export default function useTwoFactorAuthLogic() {
  const { t } = useTranslation();
  const { auth } = use(AuthContext);
  const { updateTokenStatus, error: authError } = useAuth();
  
  const [isTokenEnabled, setIsTokenEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [toast, setToast] = useState(null);



  // EFFECT TO FETCH THE INITIAL TOKEN STATUS ON COMPONENT MOUNT
  useEffect(() => {
    const controller = new AbortController();
    const fetchTokenStatus = async () => {
      if (!auth) {
        setLoading(false);
        return;
      }
      try {
        const response = await User.getTokenStatus({ signal: controller.signal });
        // Handle both { isTokenEnabled: boolean } and { data: { isTokenEnabled: boolean } }
        const tokenStatus = response?.data?.isTokenEnabled ?? response?.data?.data?.isTokenEnabled;
        setIsTokenEnabled(Boolean(tokenStatus));
      } catch (err) {
        // Ignore cancellation errors - these are expected when component unmounts
        const isCanceled = err.name === 'CanceledError' || 
                          err.name === 'AbortError' || 
                          err.code === 'ERR_CANCELED' ||
                          err.message?.includes('canceled');
        if (!isCanceled) {
          setToast({ kind: 'error', message: err.message });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTokenStatus();
    return () => controller.abort();
  }, [auth]);



  // INITIATES THE TOGGLE PROCESS, SHOWING WARNING IF DISABLING
  const toggleTwoFactorAuth = () => {
    if (isTokenEnabled) {
      setShowWarning(true);
      setConfirmDialogOpen(true);
    } else {
      updateTokenStatusOnly(true);
    }
  };



  // UPDATES THE TOKEN STATUS DIRECTLY WITH THE API
  const updateTokenStatusOnly = async (newStatus) => {
    const previousStatus = isTokenEnabled;
    setIsTokenEnabled(newStatus);
    setShowWarning(!newStatus);
    setLoading(true);
    try {
      const res = await updateTokenStatus({ isTokenEnabled: newStatus });
      if (res && !res.error) {
        setToast({ 
          kind: 'success', 
          message: res.message || res.msg 
        });
      } else {
        setIsTokenEnabled(previousStatus);
        setShowWarning(!previousStatus);
        if (res?.error) setToast({ kind: 'error', message: res.error });
        if (!res && authError) setToast({ kind: 'error', message: authError });
      }
      return res;
    } finally {
      setLoading(false);
    }
  };



  // HANDLES THE CLOSING OF THE CONFIRMATION DIALOG WHEN DISABLING 2FA
  const handleConfirmDialogClose = (confirm) => {
    setConfirmDialogOpen(false);
    if (confirm) {
      updateTokenStatusOnly(false);
    }
  };

  return {
    t,
    auth,
    isTokenEnabled,
    loading,
    showWarning,
    confirmDialogOpen,
    toast,
    setToast,
    toggleTwoFactorAuth,
    handleConfirmDialogClose
  };
}
