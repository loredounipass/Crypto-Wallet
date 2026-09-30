import { useState } from 'react';
import { useTranslation } from 'react-i18next';



// CUSTOM HOOK THAT MANAGES THE STATE AND LOGIC FOR THE RIGHT SIDEBAR
export default function useRightSidebarLogic() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');



  // MOCK DATA FOR CONTACTS (TO BE IMPLEMENTED)
  const contacts = [];



  // MOCK DATA FOR SPONSORED LINKS
  const sponsored = [
    { id: 's1', title: 'Promoción local', image: '/assets/sponsored1.jpg', url: 'https://tuempresa.com', link: 'tuempresa.com' },
    { id: 's2', title: 'Ofertas cerca de ti', image: '/assets/sponsored2.jpg', url: 'https://ofertas.com', link: 'ofertas.com' },
    { id: 's3', title: 'Promoción local', image: '/assets/sponsored3.jpg', url: 'https://tutienda.com', link: 'tutienda.com' },
  ];


  return { t, searchQuery, setSearchQuery, contacts, sponsored };
}
