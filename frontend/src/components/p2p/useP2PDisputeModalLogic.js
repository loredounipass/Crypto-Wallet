import { useState } from 'react';
import { useTranslation } from 'react-i18next';



// CUSTOM HOOK THAT MANAGES THE STATE AND LOGIC FOR THE P2P DISPUTE MODAL
export default function useP2PDisputeModalLogic(onSubmit) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');



  // HANDLES THE SUBMISSION OF THE DISPUTE REASON
  const handleSubmit = () => {
    if (!reason.trim()) return;
    onSubmit(reason);
  };

  return {
    t,
    reason,
    setReason,
    handleSubmit
  };
}
