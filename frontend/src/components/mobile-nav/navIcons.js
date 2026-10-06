// ICONOS SVG DE LA BARRA SUPERIOR MOVIL (20px, TRAZO 1.8 — MISMOS DEL SIDEBAR)
function Base({ children }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function FeedPanelIcon() {
  return (
    <Base>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </Base>
  );
}

export function ChatIcon() {
  return (
    <Base>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Base>
  );
}

export function MarketplaceIcon() {
  return (
    <Base>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </Base>
  );
}

export function SellP2PIcon() {
  return (
    <Base>
      <path d="M7 7h10" />
      <path d="M14 4l3 3-3 3" />
      <path d="M17 17H7" />
      <path d="M10 14l-3 3 3 3" />
    </Base>
  );
}

export function BuyP2PIcon() {
  return (
    <Base>
      <path d="M3 10h18" />
      <path d="M5 10V7l2-3h10l2 3v3" />
      <path d="M5 10v9h14v-9" />
      <path d="M10 19v-5h4v5" />
    </Base>
  );
}

export function SwapIcon() {
  return (
    <Base>
      <path d="M16 3l4 4-4 4" />
      <path d="M20 7H4" />
      <path d="M8 21l-4-4 4-4" />
      <path d="M4 17h16" />
    </Base>
  );
}

export function WalletIcon() {
  return (
    <Base>
      <path d="M3 7a2 2 0 0 1 2-2h14v4H5a2 2 0 1 0 0 4h14v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      <circle cx="16" cy="11" r="1" />
    </Base>
  );
}

export function DashboardIcon() {
  return (
    <Base>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Base>
  );
}

export function ForumIcon() {
  return (
    <Base>
      <rect width="6" height="6" x="3" y="4" rx="1" />
      <rect width="6" height="6" x="3" y="14" rx="1" />
      <path d="M13 5h8" />
      <path d="M13 9h5" />
      <path d="M13 15h8" />
      <path d="M13 19h5" />
    </Base>
  );
}

export function SupportIcon() {
  return (
    <Base>
      <path d="M4 12a8 8 0 0 1 16 0" />
      <rect x="3" y="12" width="4" height="6" rx="1" />
      <rect x="17" y="12" width="4" height="6" rx="1" />
      <path d="M7 18a5 5 0 0 0 10 0" />
    </Base>
  );
}

export function BellIcon() {
  return (
    <Base>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Base>
  );
}
