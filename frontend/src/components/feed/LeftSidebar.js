import React, { use, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../hooks/AuthContext';
import UserAvatar from '../common/UserAvatar';
import donationsService from '../../services/donations';

const styles = {
  wrapper: {
    padding: "0.5rem",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#E2E8F0",
  },
  profileBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: 0,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "inherit",
    textAlign: "left",
  },
  name: {
    fontWeight: 700,
    color: "#F1F5F9",
    fontSize: 14,
  },
  divider: {
    border: "none",
    borderTop: "1px solid #2D2D44",
    margin: 0,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 10px",
    background: "transparent",
    border: "none",
    color: "#E2E8F0",
    cursor: "pointer",
    borderRadius: 8,
    textAlign: "left",
    width: "100%",
    fontFamily: "inherit",
    fontSize: 15,
    fontWeight: 600,
    transition: "background 0.15s",
  },
  iconBox: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  donationLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: 600,
  },
  donationDesc: {
    fontSize: 12,
    color: "#64748B",
  },
  walletCard: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0.45rem",
    borderRadius: 8,
    border: "1px solid #2D2D44",
    backgroundColor: "#1A1A2E",
  },
  walletBadge: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  walletName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#F1F5F9",
  },
  walletAddress: {
    fontSize: 12,
    color: "#64748B",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 120,
  },
  copyBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#64748B",
    display: "inline-flex",
    padding: 2,
  },
  copied: {
    fontSize: 12,
    color: "#10B981",
  },
}

const IconExplore = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
);
const IconSettings = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);

export default function LeftSidebar() {
  const { auth } = use(AuthContext);
  const [copied, setCopied] = useState({ btc: false, usdt: false });
  const [wallets, setWallets] = useState({ btc: '', usdt: '' });
  const navigate = useNavigate();

  useEffect(() => {
    donationsService.getWallets()
      .then(resp => {
        const data = resp?.data;
        if (data) setWallets({ btc: data.btc || '', usdt: data.usdt || '' });
      })
      .catch(() => {});
  }, []);

  const btcAddress = wallets.btc;
  const usdtAddress = wallets.usdt;

  const copyToClipboard = async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied((p) => ({ ...p, [key]: true }));
      setTimeout(() => setCopied((p) => ({ ...p, [key]: false })), 2000);
    } catch (err) {}
  };

  const first = auth?.firstName || '';
  const last = auth?.lastName || '';
  const name = `${first} ${last}`.trim() || auth?.username || 'Usuario';

  const nav = (path) => {
    try { navigate(path); } catch (_) {}
  };

  const navItems = [
    { icon: <IconExplore />, label: 'Activity', path: '/activity' },
    { icon: <IconSettings />, label: 'Settings', path: '/settings' },
  ];

  return (
    <div style={styles.wrapper}>
      <button type="button" onClick={() => nav('/profile')} style={styles.profileBtn} aria-label="Ir a mi perfil">
        <UserAvatar user={auth} size={40} />
        <div>
          <div style={styles.name}>{name}</div>
        </div>
      </button>

      <hr style={styles.divider} />

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {navItems.map(item => (
          <button
            key={item.path}
            onClick={() => nav(item.path)}
            style={styles.navItem}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(33,134,235,0.04)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label={item.label}
          >
            <span style={{ ...styles.iconBox, color: "#2186EB" }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <hr style={styles.divider} />

      <div style={{ padding: "0 0.25rem", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={styles.donationLabel}>Apoya a la comunidad crypto</div>
        <div style={styles.donationDesc}>Contribuye con una donación para mantener la plataforma.</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
          {/* BTC */}
          <div style={styles.walletCard}>
            <div style={{ ...styles.walletBadge, background: "linear-gradient(180deg,#F7931A,#E2761B)" }}>
              <span style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>BTC</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
              <div style={styles.walletName}>Bitcoin</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={styles.walletAddress}>{btcAddress || 'No configurado'}</div>
                {btcAddress && (
                  <button onClick={() => copyToClipboard(btcAddress, 'btc')} aria-label="copy-btc" style={styles.copyBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="9" y="9" width="11" height="11" rx="2" ry="2"/><path d="M15 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /></svg>
                  </button>
                )}
                {copied.btc && <span style={styles.copied}>Copiado</span>}
              </div>
            </div>
          </div>

          {/* USDT */}
          <div style={styles.walletCard}>
            <div style={{ ...styles.walletBadge, background: "linear-gradient(180deg,#22c1c3,#1e90ff)" }}>
              <span style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>USDT</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
              <div style={styles.walletName}>USDT</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={styles.walletAddress}>{usdtAddress || 'No configurado'}</div>
                {usdtAddress && (
                  <button onClick={() => copyToClipboard(usdtAddress, 'usdt')} aria-label="copy-usdt" style={styles.copyBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="9" y="9" width="11" height="11" rx="2" ry="2"/><path d="M15 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /></svg>
                  </button>
                )}
                {copied.usdt && <span style={styles.copied}>Copiado</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
