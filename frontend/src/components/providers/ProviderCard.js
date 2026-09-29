import React from 'react';
import useProviderCardLogic from './useProviderCardLogic';

export default function ProviderCard() {
  const {
    t,
    providers,
    error,
    isCreatingChat,
    handleCreateChat
  } = useProviderCardLogic();

  return (
    <div className="p-3">
      {error && (
        <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {providers.map((provider) => (
          <div key={provider._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  {provider.firstName} {provider.lastName}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {t('p2p_email_label')} {provider.email}
                </p>
                <div className="mt-3">
                  <button
                    className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={() => handleCreateChat(provider.email)}
                    disabled={isCreatingChat}
                    type="button"
                  >
                    {isCreatingChat ? (
                      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      t('p2p_sell_title')
                    )}
                  </button>
                </div>
          </div>
        ))}
      </div>
    </div>
  );
}
