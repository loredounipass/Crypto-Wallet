import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import i18n from '../languages/i18n';
import { Wallet, SwapHoriz, TrendingUp } from "../ui/icons";
import useAllWallets from "../hooks/useAllWallets";
import useTokenBalances from "../hooks/useTokenBalances";
import { useNavigate } from "react-router-dom";
import useTransitions from "../hooks/useTransactions";
import CoinTransactions from "../components/coin-transactions/CoinTransactions";
import { TransactionToast } from "../components/toasts/Toast";

const WalletIcon = Wallet;
const SwapIcon = SwapHoriz;
const TrendingIcon = TrendingUp;

const Dashboard = () => {
  const { t } = useTranslation();
  const { allWalletInfo, walletBalance } = useAllWallets();
  const { tokenUsdValue } = useTokenBalances();
  const totalBalance = parseFloat(walletBalance || 0) + tokenUsdValue;
  const [loading, setLoading] = useState(true);
  const { transactions, toast, dismissToast } = useTransitions(null);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard_greeting_morning');
    if (hour < 18) return t('dashboard_greeting_afternoon');
    return t('dashboard_greeting_evening');
  };

  const formatDate = () => {
    return new Date().toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div style={{ width: "100%", padding: "16px" }}>
        <div style={{ height: "4px", backgroundColor: "#23233A", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: "100%", background: "linear-gradient(90deg, #A855F7 0%, #6366F1 60%, #3B82F6 100%)", animation: "loading 1.5s infinite" }} />
        </div>
        <style>{`@keyframes loading { 0% { width: 0% } 50% { width: 70% } 100% { width: 100% } }`}</style>
      </div>
    );
  }

  const containerStyle = {
    padding: isMobile ? "12px 12px 32px" : "20px 28px 40px",
    maxWidth: "1080px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
    overflowX: "hidden",
  };

  const headerStyle = {
    marginBottom: isMobile ? "14px" : "18px",
  };

  const statsGridStyle = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(240px, 1fr))",
    gap: isMobile ? "14px" : "20px",
    marginBottom: isMobile ? "14px" : "20px",
  };

  const statCardStyle = (color) => ({
    background: "#12121E",
    borderRadius: "16px",
    padding: isMobile ? "18px 16px" : "24px",
    border: "1px solid #1F1F2E",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  });

  const iconContainerStyle = (color) => ({
    width: isMobile ? "42px" : "56px",
    height: isMobile ? "42px" : "56px",
    borderRadius: "12px",
    backgroundColor: `${color}1F`,
    border: `1px solid ${color}33`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  return (
    <div className="mx-auto w-full" style={containerStyle}>
      {/* Header */}
      <div className="mb-3 md:mb-8" style={headerStyle}>
        <h1
          style={{ 
            color: "#FFFFFF", 
            fontWeight: 700, 
            fontSize: isMobile ? "20px" : "32px",
            marginBottom: "8px",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {getGreeting()}!
        </h1>
        <p
          style={{ 
            color: "#9CA3AF", 
            fontSize: isMobile ? "13px" : "14px",
            textTransform: "capitalize",
            margin: 0,
          }}
        >
          {formatDate()}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:gap-6" style={statsGridStyle}>
        <div style={statCardStyle("#A855F7")}>
          <div>
            <p
              style={{ 
                color: "#9CA3AF", 
                fontSize: isMobile ? "13px" : "14px",
                fontWeight: 500,
                marginBottom: "8px",
                marginTop: 0,
              }}
            >
              {t('dashboard_total_balance')}
            </p>
            <p
              style={{ 
                color: "#FFFFFF", 
                fontSize: isMobile ? "22px" : "28px", 
                fontWeight: 800,
                margin: 0,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              ${totalBalance.toFixed(2)}
            </p>
          </div>
          <div style={iconContainerStyle("#A855F7")}>
            <WalletIcon style={{ color: "#A855F7", fontSize: 24 }} />
          </div>
        </div>

        <div style={statCardStyle("#34D399")}>
          <div>
            <p
              style={{ 
                color: "#9CA3AF", 
                fontSize: isMobile ? "13px" : "14px",
                fontWeight: 500,
                marginBottom: "8px",
                marginTop: 0,
              }}
            >
              {t('dashboard_active_wallets')}
            </p>
            <p
              style={{ 
                color: "#FFFFFF", 
                fontSize: isMobile ? "22px" : "28px", 
                fontWeight: 700,
                margin: 0,
              }}
            >
              {allWalletInfo.length}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <div style={iconContainerStyle("#34D399")}>
              <TrendingIcon style={{ color: "#34D399", fontSize: 24 }} />
            </div>
            <button
              onClick={() => navigate("/wallets")}
              style={{
                background: "none",
                border: "none",
                color: "#34D399",
                fontSize: isMobile ? "11px" : "12px",
                cursor: "pointer",
                fontWeight: 700,
                padding: 0,
                lineHeight: 1,
              }}
            >
              {t('dashboard_view_more')}
            </button>
          </div>
        </div>

        <div style={statCardStyle("#60A5FA")}>
          <div>
            <p
              style={{ 
                color: "#9CA3AF", 
                fontSize: isMobile ? "13px" : "14px",
                fontWeight: 500,
                marginBottom: "8px",
                marginTop: 0,
              }}
            >
              {t('dashboard_recent_transactions')}
            </p>
            <p
              style={{ 
                color: "#FFFFFF", 
                fontSize: isMobile ? "22px" : "28px", 
                fontWeight: 800,
                margin: 0,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {transactions.length}
            </p>
          </div>
          <div style={iconContainerStyle("#60A5FA")}>
            <SwapIcon style={{ color: "#60A5FA", fontSize: 24 }} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <CoinTransactions
        transactions={transactions}
        title={t('dashboard_recent_transactions')}
        hideDateOnMobile
        compactMobile
        fixedHeight
        desktopHeight={360}
        mobileHeight={230}
      />
      <TransactionToast toast={toast} onClose={dismissToast} />
    </div>
  );
};

export default Dashboard;
