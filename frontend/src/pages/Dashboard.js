import React, { useState, useEffect } from "react";
import { Wallet, SwapHoriz, TrendingUp } from "../ui/icons";
import useAllWallets from "../hooks/useAllWallets";
import { useHistory } from "react-router-dom";
import { useThemeMode } from "../ui/styles";
import useTransitions from "../hooks/useTransactions";
import CoinTransactions from "../components/CoinTransactions";

const WalletIcon = Wallet;
const SwapIcon = SwapHoriz;
const TrendingIcon = TrendingUp;

const Dashboard = () => {
  const { allWalletInfo, walletBalance } = useAllWallets();
  const [loading, setLoading] = useState(true);
  const { transactions } = useTransitions(null);
  const history = useHistory();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const [isTablet, setIsTablet] = useState(() => window.innerWidth <= 768);
  const { mode } = useThemeMode();
  const isDark = mode === "dark";

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= 640);
      setIsTablet(window.innerWidth <= 768);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos dias";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const formatDate = () => {
    return new Date().toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div style={{ width: "100%", padding: "16px" }}>
        <div style={{ height: "4px", backgroundColor: isDark ? "#2D2D44" : "#E5E7EB", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: "100%", backgroundColor: "#2186EB", animation: "loading 1.5s infinite" }} />
        </div>
        <style>{`@keyframes loading { 0% { width: 0% } 50% { width: 70% } 100% { width: 100% } }`}</style>
      </div>
    );
  }

  const containerStyle = {
    padding: isMobile ? "4px" : isTablet ? "12px" : "32px",
    maxWidth: "1400px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
    overflowX: "hidden",
  };

  const headerStyle = {
    marginBottom: isMobile ? "12px" : "32px",
  };

  const statsGridStyle = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(240px, 1fr))",
    gap: isMobile ? "10px" : "24px",
    marginBottom: isMobile ? "12px" : "32px",
  };

  const statCardStyle = (color) => ({
    backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
    borderRadius: "16px",
    padding: isMobile ? "12px" : "24px",
    border: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
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
    backgroundColor: `${color}15`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  const sectionStyle = {
    backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
    borderRadius: "16px",
    padding: isMobile ? "0" : "24px",
    border: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
    overflow: "hidden",
  };

  return (
    <div className="mx-auto w-full" style={containerStyle}>
      {/* Header */}
      <div className="mb-3 md:mb-8" style={headerStyle}>
        <h1
          style={{ 
            color: isDark ? "#FFFFFF" : "#111827", 
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
            color: isDark ? "#9CA3AF" : "#6B7280", 
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
        <div style={statCardStyle("#2186EB")}>
          <div>
            <p
              style={{ 
                color: isDark ? "#9CA3AF" : "#6B7280", 
                fontSize: isMobile ? "13px" : "14px",
                fontWeight: 500,
                marginBottom: "8px",
                marginTop: 0,
              }}
            >
              Balance Total
            </p>
            <p
              style={{ 
                color: isDark ? "#FFFFFF" : "#111827", 
                fontSize: isMobile ? "22px" : "28px", 
                fontWeight: 700,
                margin: 0,
              }}
            >
              ${parseFloat(walletBalance || 0).toFixed(2)}
            </p>
          </div>
          <div style={iconContainerStyle("#2186EB")}>
            <WalletIcon style={{ color: "#2186EB", fontSize: 24 }} />
          </div>
        </div>

        <div style={statCardStyle("#4CAF50")}>
          <div>
            <p
              style={{ 
                color: isDark ? "#9CA3AF" : "#6B7280", 
                fontSize: isMobile ? "13px" : "14px",
                fontWeight: 500,
                marginBottom: "8px",
                marginTop: 0,
              }}
            >
              Billeteras Activas
            </p>
            <p
              style={{ 
                color: isDark ? "#FFFFFF" : "#111827", 
                fontSize: isMobile ? "22px" : "28px", 
                fontWeight: 700,
                margin: 0,
              }}
            >
              {allWalletInfo.length}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <div style={iconContainerStyle("#4CAF50")}>
              <TrendingIcon style={{ color: "#4CAF50", fontSize: 24 }} />
            </div>
            <button
              onClick={() => history.push("/wallets")}
              style={{
                background: "none",
                border: "none",
                color: "#4CAF50",
                fontSize: isMobile ? "11px" : "12px",
                cursor: "pointer",
                fontWeight: 500,
                padding: 0,
                lineHeight: 1,
              }}
            >
              Ver mas
            </button>
          </div>
        </div>

        <div style={statCardStyle("#F6851B")}>
          <div>
            <p
              style={{ 
                color: isDark ? "#9CA3AF" : "#6B7280", 
                fontSize: isMobile ? "13px" : "14px",
                fontWeight: 500,
                marginBottom: "8px",
                marginTop: 0,
              }}
            >
              Transacciones Recientes
            </p>
            <p
              style={{ 
                color: isDark ? "#FFFFFF" : "#111827", 
                fontSize: isMobile ? "22px" : "28px", 
                fontWeight: 700,
                margin: 0,
              }}
            >
              {transactions.length}
            </p>
          </div>
          <div style={iconContainerStyle("#F6851B")}>
            <SwapIcon style={{ color: "#F6851B", fontSize: 24 }} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="rounded-2xl" style={sectionStyle}>
        <CoinTransactions
          transactions={transactions}
          title="Transacciones Recientes"
          hideDateOnMobile
          compactMobile
          fixedHeight
          desktopHeight={420}
          mobileHeight={280}
        />
      </div>
    </div>
  );
};

export default Dashboard;
