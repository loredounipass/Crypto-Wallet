import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import useEscrow from '../hooks/useEscrow';
import useProviders from '../hooks/useProviders';
import P2PProviderList from '../components/p2p/P2PProviderList';
import P2PCreateOrderModal from '../components/p2p/P2PCreateOrderModal';
import P2PMyOrders from '../components/p2p/P2PMyOrders';

const StorefrontIcon = (props) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const FileTextIcon = (props) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const BriefcaseIcon = (props) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const TABS = [
  { key: 'marketplace', label: 'Marketplace', icon: StorefrontIcon },
  { key: 'my-orders', label: 'Mis Órdenes', icon: FileTextIcon },
  { key: 'provider-orders', label: 'Proveedor', icon: BriefcaseIcon },
];

export default function P2P() {
  const history = useHistory();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { getAllProviders } = useProviders();
  const { orders, providerOrders, getMyOrders, getProviderOrders, createOrder, isLoading: escrowLoading } = useEscrow();
  const [providers, setProviders] = useState([]);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await getAllProviders();
      if (Array.isArray(res)) setProviders(res);
    } catch (e) { /* handled by hook */ }
  }, [getAllProviders]);

  useEffect(() => {
    fetchProviders();
    getMyOrders();
    getProviderOrders();
  }, [fetchProviders, getMyOrders, getProviderOrders]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectProvider = (provider) => {
    setSelectedProvider(provider);
    setShowCreateModal(true);
  };

  const handleCreateOrder = async (body) => {
    try {
      const result = await createOrder(body);
      setShowCreateModal(false);
      if (result?.orderId) {
        history.push(`/p2p/order/${result.orderId}`);
      }
    } catch (e) { /* handled by hook */ }
  };

  return (
    <div style={{ paddingBottom: isMobile ? 80 : 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          margin: 0, fontSize: 28, fontWeight: 800,
          color: '#F1F5F9',
          letterSpacing: '-0.5px',
        }}>
          P2P Trading
        </h1>
        <p style={{
          margin: '6px 0 0', fontSize: 14, color: '#94A3B8',
        }}>
          Vende tu crypto directamente a proveedores verificados con protección escrow
        </p>
      </div>

      {/* Tabs Desktop */}
      {!isMobile && (
        <div style={{
          display: 'flex', 
          flexDirection: 'row',
          borderRadius: 12, overflow: 'hidden',
          border: '1px solid #2D2D44',
          backgroundColor: '#0F0F1A',
          marginBottom: 20,
        }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '12px 20px', border: 'none',
                borderRadius: 0,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                backgroundColor: 'transparent',
                background: activeTab === tab.key ? 'linear-gradient(90deg, #8B5CF6, #6366F1)' : 'transparent',
                color: activeTab === tab.key ? '#FFF' : '#64748B',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
              {tab.key === 'my-orders' && orders.length > 0 && (
                <span style={{
                  marginLeft: 6, padding: '2px 7px', borderRadius: 10, fontSize: 11,
                  backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'rgba(139,92,246,0.15)',
                  color: activeTab === tab.key ? '#FFF' : '#8B5CF6',
                }}>
                  {orders.length}
                </span>
              )}
              {tab.key === 'provider-orders' && providerOrders.length > 0 && (
                <span style={{
                  marginLeft: 6, padding: '2px 7px', borderRadius: 10, fontSize: 11,
                  backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'rgba(139,92,246,0.15)',
                  color: activeTab === tab.key ? '#FFF' : '#8B5CF6',
                }}>
                  {providerOrders.length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content Card */}
      <div style={{
        borderRadius: 16,
        border: '1px solid #2D2D44',
        backgroundColor: '#1A1A2E',
        overflow: 'hidden',
        boxShadow: 'none',
      }}>
        {activeTab === 'marketplace' && (
          <P2PProviderList
            providers={providers}
            onSelectProvider={handleSelectProvider}
          />
        )}

        {activeTab === 'my-orders' && (
          <P2PMyOrders orders={orders} role="seller" />
        )}

        {activeTab === 'provider-orders' && (
          <P2PMyOrders orders={providerOrders} role="provider" />
        )}
      </div>

      {/* Create Order Modal */}
      <P2PCreateOrderModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        provider={selectedProvider}
        onSubmit={handleCreateOrder}
        isLoading={escrowLoading}
      />

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          backgroundColor: '#1A1A2E', borderTop: '1px solid #2D2D44',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          padding: '10px 0', zIndex: 100, margin: 0,
        }}>
          {TABS.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button 
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: 'none', border: 'none', color: isActive ? '#8B5CF6' : '#94A3B8',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer',
                  flex: 1, position: 'relative'
                }}>
                <IconComponent />
                <span style={{ fontSize: 11, fontWeight: 600 }}>{tab.label}</span>
                {tab.key === 'my-orders' && orders.length > 0 && (
                  <span style={{
                    position: 'absolute', top: -5, right: '15%',
                    padding: '2px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                    backgroundColor: '#EF4444', color: '#FFF',
                  }}>{orders.length}</span>
                )}
                {tab.key === 'provider-orders' && providerOrders.length > 0 && (
                  <span style={{
                    position: 'absolute', top: -5, right: '15%',
                    padding: '2px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                    backgroundColor: '#EF4444', color: '#FFF',
                  }}>{providerOrders.length}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
