import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import useEscrow from '../hooks/useEscrow';
import useProviders from '../hooks/useProviders';
import P2PProviderList from '../components/p2p/P2PProviderList';
import P2PCreateOrderModal from '../components/p2p/P2PCreateOrderModal';
import P2PMyOrders from '../components/p2p/P2PMyOrders';

const TABS = [
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'my-orders', label: 'Mis Órdenes' },
  { key: 'provider-orders', label: 'Órdenes como Proveedor' },
];

export default function P2P() {
  const history = useHistory();

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
    <div>
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

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0,
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
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              backgroundColor: activeTab === tab.key
                ? ('#2186EB')
                : 'transparent',
              color: activeTab === tab.key ? '#FFF' : '#64748B',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
            {tab.key === 'my-orders' && orders.length > 0 && (
              <span style={{
                marginLeft: 6, padding: '2px 7px', borderRadius: 10, fontSize: 11,
                backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'rgba(33,134,235,0.15)',
                color: activeTab === tab.key ? '#FFF' : '#2186EB',
              }}>
                {orders.length}
              </span>
            )}
            {tab.key === 'provider-orders' && providerOrders.length > 0 && (
              <span style={{
                marginLeft: 6, padding: '2px 7px', borderRadius: 10, fontSize: 11,
                backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'rgba(33,134,235,0.15)',
                color: activeTab === tab.key ? '#FFF' : '#2186EB',
              }}>
                {providerOrders.length}
              </span>
            )}
          </button>
        ))}
      </div>

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
    </div>
  );
}
