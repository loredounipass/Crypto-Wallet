import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import useEscrow from '../../hooks/useEscrow';

const ProviderChatComponent = () => {
  const history = useHistory();
  const { providerOrders, getProviderOrders, isLoading, error } = useEscrow();

  useEffect(() => {
    getProviderOrders();
  }, [getProviderOrders]);

  return (
    <div className="mx-auto w-full max-w-[980px] rounded-xl border border-slate-200 bg-white p-5 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Órdenes P2P (Proveedor)</h2>
        <button
          type="button"
          onClick={getProviderOrders}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Recargar
        </button>
      </div>

      {isLoading && (
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Cargando órdenes...</p>
      )}

      {!isLoading && error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error.message || 'No se pudieron cargar las órdenes del proveedor.'}
        </p>
      )}

      {!isLoading && !error && providerOrders.length === 0 && (
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          Aún no tienes órdenes P2P asignadas.
        </p>
      )}

      {!isLoading && providerOrders.length > 0 && (
        <div className="space-y-3">
          {providerOrders.map((order) => (
            <div
              key={order.orderId}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Orden: {order.orderId}
                </p>
                <p className="text-sm text-slate-700">
                  Vendedor: {order.sellerEmail}
                </p>
                <p className="text-sm text-slate-700">
                  {order.amount} {order.coin} • {order.paymentMethod}
                </p>
                <p className="text-xs text-slate-500">
                  Estado: {order.status}
                </p>
              </div>

              <button
                type="button"
                onClick={() => history.push(`/p2p/order/${order.orderId}`)}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Abrir Chat de Orden
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderChatComponent;
