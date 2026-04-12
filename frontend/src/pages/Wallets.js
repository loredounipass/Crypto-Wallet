import React, { useState, useEffect, useMemo } from 'react';
import useAllWallets from '../hooks/useAllWallets';
import { ArrowBack } from '../ui/icons';
import { useMediaQuery, useTheme } from '../ui/material';
import {
    getCoinList,
    getDefaultCoin,
    getDefaultNetworkId,
    getNetworkName,
    getCoinLogo,
    getCoinFallbackLogo,
} from '../components/utils/Chains';
import { getDisplayableAddress } from '../components/utils/Display';
import { useHistory } from 'react-router-dom';
import robotImage from '../assets/robot.png';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../ui/styles';

const Wallets = () => {
    const { t } = useTranslation();
    const history = useHistory();
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
    const isTablet = useMediaQuery(muiTheme.breakpoints.down("md"));
    const { mode } = useThemeMode();
    const isDark = mode === 'dark';
    const { walletBalance, allWalletInfo } = useAllWallets();
    const defaultCoin = getDefaultCoin();
    const [selectedCoin, setSelectedCoin] = useState(defaultCoin);

    const handleCoinChange = (e) => setSelectedCoin(e.target.value);
    const handleCreateWallet = () => history.push(`/wallet/${selectedCoin}`);
    const handleBack = () => history.push('/');
    const handleWalletClick = (coin) => history.push(`/wallet/${coin.toLowerCase()}`);
    const selectedWalletExists = allWalletInfo.some(
        (wallet) => String(wallet.coin || '').toLowerCase() === String(selectedCoin || '').toLowerCase()
    );
    
    const texts = useMemo(() => [
        t('p2p_service_wallets'),
        t('rpc_description'),
        t('password_security_wallets'),
        t('evm_wallet_description')
    ], [t]);

    const [textIndex, setTextIndex] = useState(0);
    const [visibleText, setVisibleText] = useState(texts[0]);

    useEffect(() => {
        const displayDuration = textIndex === 1 ? 8000 : 5000;
        const timeout = setTimeout(() => {
            setTextIndex((prev) => (prev + 1) % texts.length);
        }, displayDuration);
        return () => clearTimeout(timeout);
    }, [textIndex, texts]);

    useEffect(() => {
        setVisibleText(texts[textIndex]);
    }, [textIndex, texts]);

    const styles = {
        container: {
            padding: isMobile ? "4px" : isTablet ? "12px" : "32px",
            maxWidth: "1200px",
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
            overflowX: "hidden",
        },
        header: {
            marginBottom: isMobile ? "12px" : "32px",
        },
        backLink: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: isMobile ? "12px" : "24px",
            cursor: "pointer",
            color: isDark ? "#FFFFFF" : "#1A1A2E",
        },
        statsGrid: {
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))",
            gap: isMobile ? "10px" : "24px",
            marginBottom: isMobile ? "12px" : "32px",
        },
        section: {
            backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
            borderRadius: "16px",
            padding: isMobile ? "14px" : "24px",
            border: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
            marginBottom: isMobile ? "12px" : "24px",
        },
        walletCard: {
            backgroundColor: isDark ? "#0F0F1A" : "#F8FAFC",
            borderRadius: "12px",
            padding: isMobile ? "14px" : "20px",
            border: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
            cursor: "pointer",
            transition: "all 0.2s",
        },
        button: (primary = false) => ({
            backgroundColor: primary ? "#2186EB" : "transparent",
            color: primary ? "white" : (isDark ? "#FFFFFF" : "#1A1A2E"),
            border: primary ? "none" : `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
            borderRadius: "12px",
            padding: isMobile ? "12px 16px" : "14px 24px",
            fontWeight: 600,
            cursor: "pointer",
            textTransform: "none",
            fontSize: isMobile ? "13px" : "14px",
        }),
        select: {
            width: "100%",
            padding: isMobile ? "12px 14px" : "14px 16px",
            borderRadius: "12px",
            border: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
            backgroundColor: isDark ? "#0F0F1A" : "#FFFFFF",
            color: isDark ? "#FFFFFF" : "#1A1A2E",
            fontSize: isMobile ? "13px" : "14px",
            fontWeight: 500,
            outline: "none",
            marginBottom: isMobile ? "12px" : "20px",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            boxShadow: isDark ? "0 0 0 1px rgba(45,45,68,0.2)" : "0 1px 2px rgba(17,24,39,0.05)",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            paddingRight: "36px",
        },
        gradientCard: {
            background: "linear-gradient(135deg, #2186EB 0%, #1A6BC7 100%)",
            borderRadius: "16px",
            padding: isMobile ? "14px" : "24px",
        },
    };

    const WalletCard = ({ wallet }) => (
        <div 
            style={styles.walletCard}
            onClick={() => handleWalletClick(wallet.coin)}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <img 
                    src={getCoinLogo(wallet.coin)} 
                    alt={wallet.coin}
                    onError={(e) => {
                        e.currentTarget.src = getCoinFallbackLogo(wallet.coin);
                    }}
                    style={{ width: isMobile ? 26 : 32, height: isMobile ? 26 : 32 }}
                />
                <div>
                    <div style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontWeight: 600, fontSize: isMobile ? "14px" : "16px" }}>
                        {wallet.coin}
                    </div>
                    <div style={{ color: isDark ? "#9CA3AF" : "#6B7280", fontSize: "12px" }}>
                        {getDisplayableAddress(wallet.address)}
                    </div>
                </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ color: isDark ? "#9CA3AF" : "#6B7280", fontSize: "12px" }}>Balance</div>
                    <div style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontWeight: 600, fontSize: isMobile ? "16px" : "18px" }}>
                        {wallet.balance}
                    </div>
                </div>
                <div style={{ 
                    backgroundColor: "#2186EB", 
                    color: "white", 
                    padding: isMobile ? "6px 12px" : "8px 16px", 
                    borderRadius: "8px",
                    fontSize: isMobile ? "11px" : "12px",
                    fontWeight: 500,
                }}>
                    Ver
                </div>
            </div>
        </div>
    );

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.backLink} onClick={handleBack}>
                    <ArrowBack style={{ fontSize: 20 }} />
                    <span style={{ fontWeight: 500 }}>Volver al Dashboard</span>
                </div>
                <h1 style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontSize: isMobile ? "22px" : "32px", fontWeight: 700, margin: 0 }}>
                    Mis Billeteras
                </h1>
            </div>

            {/* Stats */}
            <div style={styles.statsGrid}>
                <div style={styles.section}>
                    <div style={{ color: isDark ? "#9CA3AF" : "#6B7280", fontSize: "14px", marginBottom: "8px" }}>
                        Balance Total
                    </div>
                    <div style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontSize: isMobile ? "24px" : "32px", fontWeight: 700 }}>
                        ${parseFloat(walletBalance || 0).toFixed(2)}
                    </div>
                </div>
                <div style={styles.section}>
                    <div style={{ color: isDark ? "#9CA3AF" : "#6B7280", fontSize: "14px", marginBottom: "8px" }}>
                        Total Billeteras
                    </div>
                    <div style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontSize: isMobile ? "24px" : "32px", fontWeight: 700 }}>
                        {allWalletInfo.length}
                    </div>
                </div>
            </div>

            {/* Create Wallet */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "12px" : "24px", marginBottom: isMobile ? "12px" : "32px" }}>
                <div style={styles.section}>
                    <h2 style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontSize: "20px", fontWeight: 600, marginBottom: "20px" }}>
                        Crear Nueva Billetera
                    </h2>
                    
                    <label style={{ display: "block", color: isDark ? "#9CA3AF" : "#6B7280", fontSize: "14px", marginBottom: "8px" }}>
                        Selecciona una moneda
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: isMobile ? "12px" : "20px" }}>
                        <select 
                            value={selectedCoin}
                            onChange={handleCoinChange}
                            style={{ ...styles.select, marginBottom: 0, flex: 1 }}
                        >
                            {getCoinList().map((coin) => (
                                <option key={coin} value={coin}>
                                    {coin.toUpperCase()} - {getNetworkName(getDefaultNetworkId(coin))}
                                </option>
                            ))}
                        </select>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                backgroundColor: isDark ? "#0F0F1A" : "#F8FAFC",
                                border: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
                                borderRadius: "12px",
                                padding: isMobile ? "8px 10px" : "10px 12px",
                                minWidth: isMobile ? "92px" : "110px",
                                justifyContent: "center",
                            }}
                        >
                            <img
                                src={getCoinLogo(selectedCoin)}
                                alt={selectedCoin}
                                onError={(e) => {
                                    e.currentTarget.src = getCoinFallbackLogo(selectedCoin);
                                }}
                                style={{ width: isMobile ? 20 : 22, height: isMobile ? 20 : 22, borderRadius: "50%" }}
                            />
                            <span style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontSize: isMobile ? "12px" : "13px", fontWeight: 600 }}>
                                {selectedCoin.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        {selectedWalletExists ? (
                            <>
                                <button onClick={handleCreateWallet} style={styles.button(true)}>
                                    Depositar
                                </button>
                                <button onClick={handleCreateWallet} style={styles.button(true)}>
                                    Retirar
                                </button>
                            </>
                        ) : (
                            <button onClick={handleCreateWallet} style={styles.button(true)}>
                                Crear
                            </button>
                        )}
                    </div>
                </div>

                <div style={styles.gradientCard}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                        <img src={robotImage} alt="Robot" style={{ width: isMobile ? 56 : 80 }} />
                        <span style={{ color: "white", fontSize: isMobile ? "14px" : "16px", fontWeight: 500 }}>
                            {visibleText}
                        </span>
                    </div>
                </div>
            </div>

            {/* Your Wallets */}
            <div style={styles.section}>
                <h2 style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontSize: "20px", fontWeight: 600, marginBottom: "20px", textAlign: "center" }}>
                    Tus Billeteras
                </h2>
                
                {allWalletInfo.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: isMobile ? "10px" : "16px" }}>
                        {allWalletInfo.map((wallet, index) => (
                            <WalletCard key={index} wallet={wallet} />
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                        <div style={{ color: isDark ? "#9CA3AF" : "#6B7280", marginBottom: "16px" }}>
                            No tienes billeteras todavía
                        </div>
                        <button onClick={handleCreateWallet} style={styles.button(true)}>
                            Crear Primera Billetera
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wallets;
