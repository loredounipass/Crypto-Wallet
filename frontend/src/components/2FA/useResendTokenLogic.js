import { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';




// CUSTOM HOOK THAT MANAGES THE LOGIC FOR THE RESEND TOKEN FORM
export default function useResendTokenLogic() {
  const { resendToken, error, successMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(() => location.state?.email || '');
  const [loading, setLoading] = useState(false);




  // HANDLES THE FORM SUBMISSION TO RESEND THE VERIFICATION TOKEN
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await resendToken({ email: email.trim() });
      if (res?.success && res.message.includes('código de verificación')) {
        navigate('/verifytoken', { state: { email } });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    loading,
    error,
    successMessage,
    handleSubmit
  };
}
