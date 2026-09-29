import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useEscrow from '../../hooks/useEscrow';



// FORMATS A NAME BY CAPITALIZING THE FIRST LETTER OF EACH WORD
const formatName = (nameStr) => {
  if (!nameStr || nameStr.includes('@')) return nameStr;
  return nameStr.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};



// CUSTOM HOOK THAT MANAGES THE STATE AND LOGIC FOR THE PROVIDER DASHBOARD
export default function useProviderDashboardLogic() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { providerOrders, getProviderOrders, isLoading, error } = useEscrow();

  const STATUS_CONFIG = {
    pending:    { label: t('p2p_status_pending'), color: '#94A3B8', bg: 'rgba(148,163,184,0.10)', icon: '⏳' },
    funded:     { label: t('p2p_status_funded'), color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', icon: '🔒' },
    buyer_paid: { label: t('p2p_status_buyer_paid'), color: '#3B82F6', bg: 'rgba(59,130,246,0.10)', icon: '✅' },
    released:   { label: t('p2p_status_released'), color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)', icon: '🚀' },
    completed:  { label: t('p2p_status_completed'), color: '#10B981', bg: 'rgba(16,185,129,0.10)', icon: '🎉' },
    disputed:   { label: t('p2p_status_disputed'), color: '#EF4444', bg: 'rgba(239,68,68,0.10)', icon: '⚠️' },
    refunded:   { label: t('p2p_status_refunded'), color: '#6B7280', bg: 'rgba(107,114,128,0.10)', icon: '↩️' },
    cancelled:  { label: t('p2p_status_cancelled'), color: '#6B7280', bg: 'rgba(107,114,128,0.10)', icon: '❌' },
    expired:    { label: t('p2p_status_expired'), color: '#6B7280', bg: 'rgba(107,114,128,0.10)', icon: '⏰' },
  };

  const [settingsOpen, setSettingsOpen] = useState(false);

  const FILTER_TABS = [
    { key: 'all', label: t('p2p_all') },
    { key: 'active', label: t('p2p_active') },
    { key: 'completed', label: t('p2p_completed_orders') },
    { key: 'other', label: t('p2p_other') },
  ];
  const [activeFilter, setActiveFilter] = useState('all');



  // EFFECT TO LOAD PROVIDER ORDERS ON MOUNT
  useEffect(() => {
    getProviderOrders();
  }, [getProviderOrders]);



  // FILTERS THE ORDERS BASED ON THE CURRENTLY ACTIVE FILTER TAB
  const filteredOrders = providerOrders.filter(order => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return ['funded', 'buyer_paid', 'released', 'pending'].includes(order.status);
    if (activeFilter === 'completed') return order.status === 'completed';
    return ['cancelled', 'expired', 'refunded', 'disputed'].includes(order.status);
  });



  // CALCULATES THE NUMBER OF ACTIVE ORDERS
  const activeCount = providerOrders.filter(o => ['funded', 'buyer_paid', 'released', 'pending'].includes(o.status)).length;

  return {
    t,
    navigate,
    providerOrders,
    getProviderOrders,
    isLoading,
    error,
    STATUS_CONFIG,
    settingsOpen,
    setSettingsOpen,
    FILTER_TABS,
    activeFilter,
    setActiveFilter,
    filteredOrders,
    activeCount,
    formatName
  };
}
