import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';




// CUSTOM HOOK THAT MANAGES THE STATE AND LOGIC FOR TOKEN VERIFICATION
export default function useVerifyTokenLogic() {
  const [formValues, setFormValues] = useState({ token: '' });
  const { verifyToken, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const isMounted = useRef(true);




  // EFFECT THAT TRACKS COMPONENT MOUNT STATUS TO PREVENT MEMORY LEAKS
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);




  // HANDLES INPUT CHANGES FOR THE TOKEN FORM FIELDS
  const handleChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
    setToast(null);
  };




  // SUBMITS THE TOKEN FOR VERIFICATION AND HANDLES THE BACKEND RESPONSE
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) {
      setToast({ kind: 'error', message: 'No se encontró el correo electrónico. Por favor, inicia sesión nuevamente.' });
      return;
    }
    if (!formValues.token || formValues.token.trim().length === 0) {
      setToast({ kind: 'error', message: 'Por favor, ingresa el código de verificación.' });
      return;
    }
    if (formValues.token.length < 6) {
      setToast({ kind: 'error', message: 'El código debe tener al menos 6 dígitos.' });
      return;
    }
    setLoading(true);
    setToast(null);
    try {
      const result = await verifyToken({ email, token: formValues.token });
      if (!isMounted.current) return;
      if (result === true) {
        setToast({ kind: 'success', message: '¡Verificación exitosa! Redirigiendo...' });
      } else if (result && (result.msg || result.message)) {
        setToast({ kind: 'success', message: result.message || result.msg });
      } else if (result && result.error) {
        setToast({ kind: 'error', message: result.error });
      } else if (result === false) {
        setToast({ kind: 'error', message: authError || 'Error al verificar el token' });
      }
    } catch (err) {
      if (isMounted.current) {
        setToast({ kind: 'error', message: err.message });
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };




  // REDIRECTS THE USER TO THE RESEND TOKEN PAGE
  const handleResend = () => {
    navigate('/resendtoken', { state: { email } });
  };

  return {
    formValues,
    loading,
    toast,
    setToast,
    handleChange,
    handleSubmit,
    handleResend
  };
}
