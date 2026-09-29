import React from 'react';

export const TxIconBase = ({ children, size = 16, color = "currentColor" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {children}
    </svg>
);

export const CopyIcon = ({ size = 16, color = "currentColor" }) => (
    <TxIconBase size={size} color={color}>
        <rect x="9" y="9" width="10" height="12" rx="2" />
        <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </TxIconBase>
);

export const CheckIcon = ({ size = 16, color = "currentColor" }) => (
    <TxIconBase size={size} color={color}>
        <path d="M5 12l4 4L19 6" />
    </TxIconBase>
);

export const CloseIcon = ({ size = 18, color = "currentColor" }) => (
    <TxIconBase size={size} color={color}>
        <path d="M6 6l12 12" />
        <path d="M18 6L6 18" />
    </TxIconBase>
);
