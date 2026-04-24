import React from 'react';
import ProviderForm from '../components/providers/ProviderFom';
import { PersonAdd as PersonAddIcon } from '../ui/icons'; 

export default function CreateProvider() {
    return (
        <div className="mx-auto w-full max-w-[980px] px-2 pb-6 pt-2 sm:px-4">
            <div className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100">
                <PersonAddIcon style={{ color: '#22C55E' }} />
                <span className="text-sm font-semibold sm:text-base">
                    Registro de Proveedor P2P
                </span>
            </div>
            <ProviderForm />
        </div>
    );
}
