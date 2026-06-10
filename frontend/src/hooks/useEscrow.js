import { useState, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import Escrow from '../services/escrow';
import { apiOrigin } from '../api/http';

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
    // Extraemos la base sin /secure/api para conectarnos al gateway principal
    const socketOrigin = apiOrigin.replace('/secure/api', '');
    const socket = io(`${socketOrigin}/escrow`, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Escrow Socket] Conectado exitosamente');
    });

    socket.on('escrowStatusUpdated', (event) => {
      console.log('[Escrow Socket] Actualización recibida:', event);
      
      setToast({ kind: 'success', message: `Orden ${event.orderId} actualizada a ${event.status}` });

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
      setToast({ kind: 'success', message: 'Orden creada exitosamente' });
      return res;
    } catch (err) {
      setError(err.message);
      setToast({ kind: 'error', message: err.message || 'Error al crear orden' });
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
      setToast({ kind: 'error', message: err.message || 'Error al obtener mis órdenes' });
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
      setToast({ kind: 'error', message: err.message || 'Error al obtener órdenes del proveedor' });
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
      setToast({ kind: 'error', message: err.message || 'Error al obtener orden' });
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
      setToast({ kind: 'success', message: 'Pago confirmado' });
      return res;
    } catch (err) {
      setError(err.message);
      setToast({ kind: 'error', message: err.message || 'Error al confirmar pago' });
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
      setToast({ kind: 'success', message: 'Fondos liberados' });
      return res;
    } catch (err) {
      setError(err.message);
      setToast({ kind: 'error', message: err.message || 'Error al liberar fondos' });
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
      setToast({ kind: 'success', message: 'Disputa abierta' });
      return res;
    } catch (err) {
      setError(err.message);
      setToast({ kind: 'error', message: err.message || 'Error al abrir disputa' });
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
      setToast({ kind: 'success', message: 'Orden cancelada' });
      return res;
    } catch (err) {
      setError(err.message);
      setToast({ kind: 'error', message: err.message || 'Error al cancelar orden' });
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
  };
}
