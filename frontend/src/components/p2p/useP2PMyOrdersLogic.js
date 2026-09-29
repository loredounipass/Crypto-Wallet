import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
  funded: '#F59E0B', buyer_paid: '#3B82F6', released: '#8B5CF6',
  completed: '#10B981', disputed: '#EF4444', refunded: '#6B7280',
  cancelled: '#6B7280', expired: '#6B7280', pending: '#94A3B8',
};



// CUSTOM HOOK THAT MANAGES THE STATE AND FORMATTING LOGIC FOR THE MY ORDERS LIST
export default function useP2PMyOrdersLogic() {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const navigate = useNavigate();

  const STATUS_LABELS = {
    pending: t('p2p_status_pending'), funded: t('p2p_status_funded'), buyer_paid: t('p2p_status_buyer_paid'),
    released: t('p2p_status_released'), completed: t('p2p_status_completed'), disputed: t('p2p_status_disputed'),
    refunded: t('p2p_status_refunded'), cancelled: t('p2p_status_cancelled'), expired: t('p2p_status_expired'),
  };
  


  // EFFECT THAT LISTENS FOR WINDOW RESIZE EVENTS TO UPDATE MOBILE VIEW STATE
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  // FORMATS A GIVEN NAME STRING BY CAPITALIZING EACH WORD
  const formatName = (nameStr) => {
    if (!nameStr || nameStr.includes('@')) return nameStr;
    return nameStr.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return {
    t,
    isMobile,
    navigate,
    STATUS_COLORS,
    STATUS_LABELS,
    formatName
  };
}
