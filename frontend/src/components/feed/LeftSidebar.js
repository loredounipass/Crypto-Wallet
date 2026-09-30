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
      .catch(() => { });
  }, []);

  const btcAddress = wallets.btc;
  const usdtAddress = wallets.usdt;

  const copyToClipboard = async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied((p) => ({ ...p, [key]: true }));
      setTimeout(() => setCopied((p) => ({ ...p, [key]: false })), 2000);
    } catch (err) { }
  };

  const first = auth?.firstName || '';
  const last = auth?.lastName || '';
  const name = `${first} ${last}`.trim() || auth?.username || 'Usuario';

  const nav = (path) => {
    try { navigate(path); } catch (_) { }
  };

  return (
    <div style={styles.wrapper}>
      <button type="button" onClick={() => nav('/profile')} style={styles.profileBtn} aria-label="Ir a mi perfil">
        <UserAvatar user={auth} size={40} />
        <div>
          <div style={styles.name}>{name}</div>
        </div>
      </button>

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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="9" y="9" width="11" height="11" rx="2" ry="2" /><path d="M15 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /></svg>
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="9" y="9" width="11" height="11" rx="2" ry="2" /><path d="M15 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /></svg>
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
