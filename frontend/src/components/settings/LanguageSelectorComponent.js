import React from 'react';
import { Language as LanguageIcon } from '../../ui/icons';
import { TransactionToast } from '../toasts/Toast';
import useLanguageSelectorLogic from './useLanguageSelectorLogic';

import './Settings.css';

const Switch = ({ checked, onChange, disabled }) => (
  <button
    onClick={disabled ? null : onChange}
    className={`relative h-6 w-12 rounded-xl border-0 p-[2px] transition-colors ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    style={{ backgroundColor: checked ? 'var(--settings-primary)' : 'var(--settings-border)' }}
    role="switch"
    aria-checked={checked}
  >
    <span
      className={`block h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`}
    />
  </button>
);


function LanguageSelectorComponent() {
    const {
        t,
        toast,
        setToast,
        language,
        languageOptions,
        handleToggle
    } = useLanguageSelectorLogic();

    return (
        <div className="w-full">
             <div className="mb-6 flex items-center gap-4 border-b pb-4" style={{ borderColor: 'var(--settings-border)' }}>
                 <div className="flex items-center justify-center rounded-xl bg-[rgba(33,134,235,0.1)] p-3">
                     <LanguageIcon className="text-[28px]" style={{ color: 'var(--settings-primary)' }} />
                 </div>
                 <h2 className="m-0 text-[20px] font-semibold" style={{ color: 'var(--settings-text)' }}>
                     {t('language_selection')}
                 </h2>
             </div>

            <div className="flex flex-col gap-3">
                {languageOptions.map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                        <div
                            key={lang.code}
                            className="flex w-full items-center justify-between rounded-xl border px-5 py-4 transition-all"
                            style={{
                              borderColor: isSelected ? 'var(--settings-primary)' : 'var(--settings-border)',
                              backgroundColor: isSelected ? 'rgba(33,134,235,0.05)' : 'var(--settings-card)',
                              color: 'var(--settings-text)'
                            }}
                        >
                            <span className="text-lg">{lang.nativeName || lang.name}</span>
                            <Switch
                                checked={isSelected}
                                onChange={() => handleToggle(lang.code)}
                            />
                        </div>
                    );
                })}
            </div>
            <TransactionToast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
}

export default LanguageSelectorComponent;
