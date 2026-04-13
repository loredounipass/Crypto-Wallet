import React, { useState, useEffect, useMemo, useRef } from 'react';
import useAllWallets from '../hooks/useAllWallets';
import { ArrowBack } from '../ui/icons';
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
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
    const [isTablet, setIsTablet] = useState(() => window.innerWidth <= 768);
    const { mode } = useThemeMode();
    const isDark = mode === 'dark';
    const { walletBalance, allWalletInfo } = useAllWallets();
    const defaultCoin = getDefaultCoin();
    const [selectedCoin, setSelectedCoin] = useState(defaultCoin);
    const [isCoinMenuOpen, setIsCoinMenuOpen] = useState(false);
    const coinMenuRef = useRef(null);

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

    useEffect(() => {
        const onResize = () => {
            setIsMobile(window.innerWidth <= 640);
            setIsTablet(window.innerWidth <= 768);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        const onClickOutside = (event) => {
            if (coinMenuRef.current && !coinMenuRef.current.contains(event.target)) {
                setIsCoinMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

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
            background: isDark
                ? "linear-gradient(180deg, #111124 0%, #0B0B16 100%)"
                : "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
            borderRadius: "16px",
            padding: isMobile ? "14px" : "18px",
            border: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: isDark ? "0 10px 24px rgba(0,0,0,0.25)" : "0 8px 20px rgba(15,23,42,0.08)",
        },
        walletActionPill: {
            backgroundColor: "#2186EB",
            color: "white",
            padding: isMobile ? "7px 12px" : "8px 14px",
            borderRadius: "10px",
            fontSize: isMobile ? "11px" : "12px",
            fontWeight: 600,
            letterSpacing: "0.2px",
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
        createWalletCard: {
            background: isDark
                ? "linear-gradient(180deg, #131327 0%, #0C0C17 100%)"
                : "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
            borderRadius: "16px",
            padding: isMobile ? "14px" : "24px",
            border: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
            boxShadow: isDark ? "0 12px 28px rgba(0,0,0,0.22)" : "0 10px 24px rgba(15,23,42,0.08)",
        },
        sectionSubtleText: {
            color: isDark ? "#9CA3AF" : "#6B7280",
            fontSize: "13px",
            marginBottom: "14px",
            marginTop: 0,
        },
        coinPickerWrap: {
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: isMobile ? "12px" : "20px",
            backgroundColor: isDark ? "#0F0F1A" : "#F8FAFC",
            border: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
            borderRadius: "14px",
            padding: isMobile ? "10px" : "12px",
        },
        coinMenuButton: {
            width: "100%",
            border: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
            backgroundColor: isDark ? "#141427" : "#FFFFFF",
            color: isDark ? "#FFFFFF" : "#1A1A2E",
            borderRadius: "12px",
            padding: isMobile ? "10px 12px" : "11px 13px",
            fontSize: isMobile ? "13px" : "14px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            textAlign: "left",
        },
        coinMenuPanel: {
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            width: "100%",
            zIndex: 30,
            backgroundColor: isDark ? "#141427" : "#FFFFFF",
            border: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
            borderRadius: "12px",
            boxShadow: isDark ? "0 12px 28px rgba(0,0,0,0.4)" : "0 12px 28px rgba(15,23,42,0.12)",
            maxHeight: "230px",
            overflowY: "auto",
        },
        coinMenuItem: (isActive) => ({
            width: "100%",
            border: "none",
            backgroundColor: isActive ? (isDark ? "#1F2A44" : "#EFF6FF") : "transparent",
            color: isDark ? "#FFFFFF" : "#1A1A2E",
            padding: "10px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textAlign: "left",
            fontSize: "13px",
        }),
    };

    const WalletCard = ({ wallet }) => (
        <div 
            style={styles.walletCard}
            onClick={() => handleWalletClick(wallet.coin)}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = isDark ? "0 14px 26px rgba(0,0,0,0.35)" : "0 14px 26px rgba(15,23,42,0.14)";
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = styles.walletCard.boxShadow;
            }}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                        {String(wallet.coin || "").toUpperCase()}
                    </div>
                    <div style={{ color: isDark ? "#9CA3AF" : "#6B7280", fontSize: "12px" }}>
                        {getDisplayableAddress(wallet.address)}
                    </div>
                </div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: "999px", backgroundColor: "#22C55E" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ color: isDark ? "#9CA3AF" : "#6B7280", fontSize: "12px" }}>Balance</div>
                    <div style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontWeight: 600, fontSize: isMobile ? "16px" : "18px" }}>
                        {wallet.balance}
                    </div>
                </div>
                <div style={styles.walletActionPill}>
                    Ver
                </div>
            </div>
        </div>
    );

    return (
        <div className="mx-auto w-full" style={styles.container}>
            {/* Header */}
            <div className="mb-3 md:mb-8" style={styles.header}>
                <div style={styles.backLink} onClick={handleBack}>
                    <ArrowBack style={{ fontSize: 20 }} />
                    <span style={{ fontWeight: 500 }}>Volver al Dashboard</span>
                </div>
                <h1 style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontSize: isMobile ? "22px" : "32px", fontWeight: 700, margin: 0 }}>
                    Mis Billeteras
                </h1>
            </div>

            {/* Stats */}
            <div className="grid gap-3 md:gap-6" style={styles.statsGrid}>
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
            <div className="grid gap-3 md:gap-6" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "12px" : "24px", marginBottom: isMobile ? "12px" : "32px" }}>
                <div style={styles.createWalletCard}>
                    <h2 style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontSize: "20px", fontWeight: 600, marginBottom: "20px" }}>
                        Crear Nueva Billetera
                    </h2>
                    <p style={styles.sectionSubtleText}>
                        Elige la red y crea tu wallet en segundos con configuracion segura.
                    </p>
                    
                    <label style={{ display: "block", color: isDark ? "#9CA3AF" : "#6B7280", fontSize: "14px", marginBottom: "8px" }}>
                        Selecciona una moneda
                    </label>
                    <div style={styles.coinPickerWrap}>
                        <div ref={coinMenuRef} style={{ position: "relative", flex: 1 }}>
                            <button
                                type="button"
                                style={styles.coinMenuButton}
                                onClick={() => setIsCoinMenuOpen((prev) => !prev)}
                                aria-expanded={isCoinMenuOpen}
                            >
                                <span style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                                    <img
                                        src={getCoinLogo(selectedCoin)}
                                        alt={selectedCoin}
                                        onError={(e) => {
                                            e.currentTarget.src = getCoinFallbackLogo(selectedCoin);
                                        }}
                                        style={{ width: 18, height: 18, borderRadius: "999px" }}
                                    />
                                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {selectedCoin.toUpperCase()} - {getNetworkName(getDefaultNetworkId(selectedCoin))}
                                    </span>
                                </span>
                                <span style={{ opacity: 0.7 }}>{isCoinMenuOpen ? "▲" : "▼"}</span>
                            </button>

                            {isCoinMenuOpen && (
                                <div className="hide-scrollbar" style={styles.coinMenuPanel}>
                                    {getCoinList().map((coin) => (
                                        <button
                                            key={coin}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCoin(coin);
                                                setIsCoinMenuOpen(false);
                                            }}
                                            style={styles.coinMenuItem(coin === selectedCoin)}
                                        >
                                            <img
                                                src={getCoinLogo(coin)}
                                                alt={coin}
                                                onError={(e) => {
                                                    e.currentTarget.src = getCoinFallbackLogo(coin);
                                                }}
                                                style={{ width: 20, height: 20, borderRadius: "999px" }}
                                            />
                                            <span>{coin.toUpperCase()} - {getNetworkName(getDefaultNetworkId(coin))}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
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
                <h2 style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontSize: "20px", fontWeight: 700, marginBottom: "4px", textAlign: "center" }}>
                    Tus Billeteras
                </h2>
                <p style={{ color: isDark ? "#9CA3AF" : "#6B7280", fontSize: "13px", textAlign: "center", marginTop: 0, marginBottom: "18px" }}>
                    Administra tus activos y entra rapido a cada wallet.
                </p>
                
                {allWalletInfo.length > 0 ? (
                    <div className="grid gap-3 md:gap-4" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: isMobile ? "10px" : "16px" }}>
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
