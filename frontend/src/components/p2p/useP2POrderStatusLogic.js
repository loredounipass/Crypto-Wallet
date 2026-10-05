import { useTranslation } from 'react-i18next';



// CUSTOM HOOK THAT MANAGES THE STATUS CONFIGURATION AND STEPS FOR A P2P ORDER
export default function useP2POrderStatusLogic(status) {
  const { t } = useTranslation();

  const STATUS_CONFIG = {
    pending:    { label: t('p2p_status_pending'), color: '#9CA3AF', bg: 'rgba(156,163,175,0.10)', step: 0 },
    funded:     { label: t('p2p_status_funded'), color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', step: 1 },
    buyer_paid: { label: t('p2p_status_buyer_paid'), color: '#60A5FA', bg: 'rgba(96,165,250,0.10)', step: 2 },
    released:   { label: t('p2p_status_released'), color: '#A855F7', bg: 'rgba(168,85,247,0.10)', step: 3 },
    completed:  { label: t('p2p_status_completed'), color: '#34D399', bg: 'rgba(52,211,153,0.10)', step: 4 },
    disputed:   { label: t('p2p_status_disputed'), color: '#F87171', bg: 'rgba(248,113,113,0.10)', step: -1 },
    resolved:   { label: t('p2p_status_resolved'), color: '#34D399', bg: 'rgba(52,211,153,0.10)', step: -1 },
    refunded:   { label: t('p2p_status_refunded'), color: '#6B7280', bg: 'rgba(107,114,128,0.10)', step: -1 },
    cancelled:  { label: t('p2p_status_cancelled'), color: '#6B7280', bg: 'rgba(107,114,128,0.10)', step: -1 },
    expired:    { label: t('p2p_status_expired'), color: '#6B7280', bg: 'rgba(107,114,128,0.10)', step: -1 },
  };

  const STEPS = [t('p2p_step_escrow'), t('p2p_step_payment'), t('p2p_step_release'), t('p2p_step_completed')];

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const isTerminal = config.step === -1;
  const activeStep = isTerminal ? -1 : config.step;

  return {
    config,
    STEPS,
    isTerminal,
    activeStep
  };
}
