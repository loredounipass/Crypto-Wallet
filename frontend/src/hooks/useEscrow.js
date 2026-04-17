import { useState, useCallback } from 'react';
import Escrow from '../services/escrow';

export default function useEscrow() {
  const [orders, setOrders] = useState([]);
  const [providerOrders, setProviderOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const createOrder = async (body) => {
    setIsLoading(true);
    try {
      const res = await Escrow.createOrder(body);
      setError(null);
      return res;
    } catch (err) {
      setError(err.response?.data || err);
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
      setError(err.response?.data || err);
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
      setError(err.response?.data || err);
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
      setError(err.response?.data || err);
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
      return res;
    } catch (err) {
      setError(err.response?.data || err);
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
      return res;
    } catch (err) {
      setError(err.response?.data || err);
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
      return res;
    } catch (err) {
      setError(err.response?.data || err);
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
      return res;
    } catch (err) {
      setError(err.response?.data || err);
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
