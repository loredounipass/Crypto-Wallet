import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';



// CUSTOM HOOK THAT MANAGES THE ROUTING AND HEADER LOGIC FOR THE P2P CHAT
export default function useP2PChatHeaderLogic({ counterpartName, isProvider }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const initial = counterpartName?.charAt(0)?.toUpperCase() || '?';



  // HANDLES THE BACK BUTTON NAVIGATION DEPENDING ON THE USER'S ROLE
  const handleBack = () => {
    if (isProvider) {
      navigate('/provider-dashboard');
    } else {
      navigate('/p2p');
    }
  };

  return {
    t,
    initial,
    handleBack
  };
}
