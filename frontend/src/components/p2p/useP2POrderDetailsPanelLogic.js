import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';



// CUSTOM HOOK THAT MANAGES THE ROUTING AND CONFIGURATION FOR THE ORDER DETAILS PANEL
export default function useP2POrderDetailsPanelLogic() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const borderColor = '#1F1F2E';

  return {
    t,
    navigate,
    borderColor
  };
}
