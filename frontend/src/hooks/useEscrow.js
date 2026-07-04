import { useState, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import i18n from '../languages/i18n';
import Escrow from '../services/escrow';

export default function useEscrow() {
  const [orders, setOrders] = useState([]);
  const [providerOrders, setProviderOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const dismissToast = useCallback(() => setToast(null), []);

  // WebSocket Connection for Real-time Escrow Updates
  useEffect(() => {
    const socket = io(`${new URL(process.env.REACT_APP_API_BASE_URL).origin}/escrow`, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Escrow Socket] Conectado exitosamente');
    });

    socket.on('escrowStatusUpdated', (event) => {
      console.log('[Escrow Socket] Actualización recibida:', event);
      
      setToast({ kind: 'success', message: i18n.t('p2p_status_updated', { orderId: event.orderId, status: event.status }) });

      // Actualizar currentOrder si estamos viéndola
      setCurrentOrder((prev) => {
        if (prev && prev.orderId === event.orderId) {
          return { ...prev, ...event };
        }
        return prev;
      });

      // Actualizar lista de mis órdenes
      setOrders((prev) => 
        prev.map(o => o.orderId === event.orderId ? { ...o, ...event } : o)
      );

      // Actualizar lista de órdenes como proveedor
      setProviderOrders((prev) => 
        prev.map(o => o.orderId === event.orderId ? { ...o, ...event } : o)
      );
    });

    socket.on('error', (err) => {
      console.error('[Escrow Socket] Error de conexión:', err);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createOrder = async (body) => {
    setIsLoading(true);
    try {
      const res = await Escrow.createOrder(body);
      setError(null);
      setToast({ kind: 'success', message: i18n.t('escrow_order_created') });
      return res;
    } catch (err) {
      setError(err.message);
      setToast({ kind: 'error', message: err.message || i18n.t('escrow_error_create') });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getMyOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await Escrow.getMyOrders();
      setOrders(Array.isArray(res) ? res : []);
      setError(null);
      return res;
    } catch (err) {
      setError(err.message);
      setToast({ kind: 'error', message: err.message || i18n.t('escrow_error_my_orders') });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getProviderOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await Escrow.getProviderOrders();
      setProviderOrders(Array.isArray(res) ? res : []);
      setError(null);
      return res;
    } catch (err) {
      setError(err.message);
      setToast({ kind: 'error', message: err.message || i18n.t('escrow_error_provider_orders') });
      setProviderOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getOrder = useCallback(async (orderId) => {
    setIsLoading(true);
    try {
      const res = await Escrow.getOrder(orderId);
      setCurrentOrder(res);
      setError(null);
      return res;
    } catch (err) {
      setError(err.message);
      setToast({ kind: 'error', message: err.message || i18n.t('escrow_error_get_order') });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmPayment = async (orderId) => {
    setIsLoading(true);
    try {
      const res = await Escrow.confirmPayment(orderId);
      setError(null);
      setToast({ kind: 'success', message: i18n.t('escrow_payment_confirmed') });
      return res;
    } catch (err) {
      setError(err.message);
      setToast({ kind: 'error', message: err.message || i18n.t('escrow_error_confirm_payment') });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const releaseFunds = async (orderId) => {
    setIsLoading(true);
    try {
      const res = await Escrow.releaseFunds(orderId);
      setError(null);
      setToast({ kind: 'success', message: i18n.t('escrow_funds_released') });
      return res;
    } catch (err) {
      setError(err.message);
      setToast({ kind: 'error', message: err.message || i18n.t('escrow_error_release_funds') });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const openDispute = async (orderId, reason) => {
    setIsLoading(true);
    try {
      const res = await Escrow.openDispute(orderId, reason);
      setError(null);
      setToast({ kind: 'success', message: i18n.t('escrow_dispute_opened') });
      return res;
    } catch (err) {
      setError(err.message);
      setToast({ kind: 'error', message: err.message || i18n.t('escrow_error_open_dispute') });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    setIsLoading(true);
    try {
      const res = await Escrow.cancelOrder(orderId);
      setError(null);
      setToast({ kind: 'success', message: i18n.t('escrow_order_cancelled') });
      return res;
    } catch (err) {
      setError(err.message);
      setToast({ kind: 'error', message: err.message || i18n.t('escrow_error_cancel_order') });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getDisputedOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await Escrow.getDisputedOrders();
      setError(null);
      return res;
    } catch (err) {
      setError(err.message);
      setToast({ kind: 'error', message: err.message || i18n.t('escrow_error_get_disputed') });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resolveDispute = async (orderId, type) => {
    setIsLoading(true);
    try {
      const res = await Escrow.resolveDispute(orderId, type);
      setError(null);
      setToast({ kind: 'success', message: type === 'revert' ? i18n.t('escrow_dispute_resolved_revert') : i18n.t('escrow_dispute_resolved_release') });
      return res;
    } catch (err) {
      setError(err.message);
      setToast({ kind: 'error', message: err.message || i18n.t('escrow_error_resolve_dispute') });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    orders,
    providerOrders,
    currentOrder,
    error,
    isLoading,
    toast,
    dismissToast,
    createOrder,
    getMyOrders,
    getProviderOrders,
    getOrder,
    confirmPayment,
    releaseFunds,
    openDispute,
    cancelOrder,
    getDisputedOrders,
    resolveDispute,
  };
}
