import React, { useState, useEffect, useMemo, useRef } from 'react';
import useAllWallets from '../hooks/useAllWallets';
import useCoinPrice from '../hooks/useCoinPrice';
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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  LineController
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  LineController
);

const Wallets = () => {
    const history = useHistory();
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
    const [isTablet, setIsTablet] = useState(() => window.innerWidth <= 768);

    const { walletBalance, allWalletInfo } = useAllWallets();
    const defaultCoin = getDefaultCoin();
    const [selectedCoin, setSelectedCoin] = useState(defaultCoin);
    const { coinPrice } = useCoinPrice(selectedCoin);
    const [isCoinMenuOpen, setIsCoinMenuOpen] = useState(false);
    const coinMenuRef = useRef(null);

    const [chartDataValues, setChartDataValues] = useState([]);

    useEffect(() => {
        let isMounted = true;
        const fetchHistoricalData = async () => {
            try {
                const res = await fetch(`https://min-api.cryptocompare.com/data/v2/histohour?fsym=${selectedCoin.toUpperCase()}&tsym=USD&limit=24`);
                const json = await res.json();
                if (json && json.Data && json.Data.Data) {
                    const prices = json.Data.Data.map(item => item.close);
                    if (isMounted) setChartDataValues(prices);
                }
            } catch (err) {
                console.error("Failed to fetch historical chart data", err);
            }
        };
        fetchHistoricalData();
        return () => { isMounted = false; };
    }, [selectedCoin]);

    const chartData = useMemo(() => ({
        labels: Array.from({ length: chartDataValues.length || 24 }, (_, i) => i.toString()),
        datasets: [
            {
                data: chartDataValues,
                fill: true,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                    gradient.addColorStop(0, "rgba(99, 102, 241, 0.4)");
                    gradient.addColorStop(1, "rgba(99, 102, 241, 0.0)");
                    return gradient;
                },
                borderColor: "#6366F1",
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 0,
                tension: 0.4
            }
        ]
    }), [chartDataValues]);

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        },
        scales: {
            x: { display: false },
            y: {
                display: false,
                min: chartDataValues.length > 0 ? Math.min(...chartDataValues) * 0.99 : 0,
                max: chartDataValues.length > 0 ? Math.max(...chartDataValues) * 1.01 : 100
            }
        },
        layout: {
            padding: 0
        }
    }), [chartDataValues]);

    const canvasRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (canvasRef.current) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            chartInstance.current = new ChartJS(canvasRef.current, {
                type: 'line',
                data: chartData,
                options: chartOptions
            });
        }
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [chartData, chartOptions]);

    const handleCreateWallet = () => history.push(`/wallet/${selectedCoin}`);
    const handleBack = () => history.push('/');
    const handleWalletClick = (coin) => history.push(`/wallet/${coin.toLowerCase()}`);
    const selectedWalletExists = allWalletInfo.some(
        (wallet) => String(wallet.coin || '').toLowerCase() === String(selectedCoin || '').toLowerCase()
    );

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
            color: "#FFFFFF",
        },
        statsGrid: {
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))",
            gap: isMobile ? "10px" : "24px",
            marginBottom: isMobile ? "12px" : "32px",
        },
        section: {
            backgroundColor: "#1A1A2E",
            borderRadius: "16px",
            padding: isMobile ? "14px" : "24px",
            border: "1px solid #2D2D44",
            marginBottom: isMobile ? "12px" : "24px",
        },
        walletCard: {
            background: "linear-gradient(180deg, #111124 0%, #0B0B16 100%)",
            borderRadius: "16px",
            padding: isMobile ? "14px" : "18px",
            border: "1px solid #2D2D44",
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
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
            color: primary ? "white" : "#FFFFFF",
            border: primary ? "none" : "1px solid #2D2D44",
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
            border: "1px solid #2D2D44",
            backgroundColor: "#0F0F1A",
            color: "#FFFFFF",
            fontSize: isMobile ? "13px" : "14px",
            fontWeight: 500,
            outline: "none",
            marginBottom: isMobile ? "12px" : "20px",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            boxShadow: "0 0 0 1px rgba(45,45,68,0.2)",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            paddingRight: "36px",
        },
        gradientCard: {
            background: "linear-gradient(135deg, #2186EB 0%, #1A6BC7 100%)",
            borderRadius: "16px",
            padding: isMobile ? "14px" : "24px",
            minWidth: 0,
            boxSizing: "border-box",
        },
        createWalletCard: {
            background: "linear-gradient(180deg, #131327 0%, #0C0C17 100%)",
            borderRadius: "16px",
            padding: isMobile ? "14px" : "20px",
            border: "1px solid #2D2D44",
            boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
            minWidth: 0,
            boxSizing: "border-box",
        },
        sectionSubtleText: {
            color: "#9CA3AF",
            fontSize: "13px",
            marginBottom: "14px",
            marginTop: 0,
        },
        coinPickerWrap: {
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: isMobile ? "12px" : "20px",
            backgroundColor: "#0F0F1A",
            border: "1px solid #2D2D44",
            borderRadius: "14px",
            padding: isMobile ? "10px" : "12px",
        },
        coinMenuButton: {
            width: "100%",
            border: "1px solid #2D2D44",
            backgroundColor: "#141427",
            color: "#FFFFFF",
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
            backgroundColor: "#141427",
            border: "1px solid #2D2D44",
            borderRadius: "12px",
            boxShadow: "0 12px 28px rgba(0,0,0,0.4)",
            maxHeight: "230px",
            overflowY: "auto",
        },
        coinMenuItem: (isActive) => ({
            width: "100%",
            border: "none",
            backgroundColor: isActive ? "#1F2A44" : "transparent",
            color: "#FFFFFF",
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
                e.currentTarget.style.boxShadow = "0 14px 26px rgba(0,0,0,0.35)";
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
                    <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: isMobile ? "14px" : "16px" }}>
                        {String(wallet.coin || "").toUpperCase()}
                    </div>
                    <div style={{ color: "#9CA3AF", fontSize: "12px" }}>
                        {getDisplayableAddress(wallet.address)}
                    </div>
                </div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: "999px", backgroundColor: "#22C55E" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ color: "#9CA3AF", fontSize: "12px" }}>Balance</div>
                    <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: isMobile ? "16px" : "18px" }}>
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
                <h1 style={{ color: "#FFFFFF", fontSize: isMobile ? "22px" : "32px", fontWeight: 700, margin: 0 }}>
                    Mis Billeteras
                </h1>
            </div>

            {/* Stats */}
            <div className="grid gap-3 md:gap-6" style={styles.statsGrid}>
                <div style={styles.section}>
                    <div style={{ color: "#9CA3AF", fontSize: "14px", marginBottom: "8px" }}>
                        Balance Total
                    </div>
                    <div style={{ color: "#FFFFFF", fontSize: isMobile ? "24px" : "32px", fontWeight: 700 }}>
                        ${parseFloat(walletBalance || 0).toFixed(2)}
                    </div>
                </div>
                <div style={styles.section}>
                    <div style={{ color: "#9CA3AF", fontSize: "14px", marginBottom: "8px" }}>
                        Total Billeteras
                    </div>
                    <div style={{ color: "#FFFFFF", fontSize: isMobile ? "24px" : "32px", fontWeight: 700 }}>
                        {allWalletInfo.length}
                    </div>
                </div>
            </div>

            {/* Create Wallet */}
            <div className="grid gap-3 md:gap-6" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "12px" : "24px", marginBottom: isMobile ? "12px" : "32px" }}>
                <div style={styles.createWalletCard}>
                    <h2 style={{ color: "#FFFFFF", fontSize: isMobile ? "18px" : "20px", fontWeight: 600, marginBottom: "8px" }}>
                        Crear Nueva Billetera
                    </h2>
                    <p style={{ ...styles.sectionSubtleText, marginBottom: "16px" }}>
                        Elige la red y crea tu wallet en segundos con configuracion segura.
                    </p>
                    
                    <label style={{ display: "block", color: "#9CA3AF", fontSize: "13px", marginBottom: "6px" }}>
                        Selecciona una moneda
                    </label>
                    <div style={styles.coinPickerWrap}>
                        <div ref={coinMenuRef} style={{ position: "relative", flex: 1, minWidth: 0 }}>
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
                                backgroundColor: "#0F0F1A",
                                border: "1px solid #2D2D44",
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
                            <span style={{ color: "#FFFFFF", fontSize: isMobile ? "12px" : "13px", fontWeight: 600 }}>
                                {selectedCoin.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        {selectedWalletExists ? (
                            <button onClick={handleCreateWallet} style={styles.button(true)}>
                                Depositar / Retirar
                            </button>
                        ) : (
                            <button onClick={handleCreateWallet} style={styles.button(true)}>
                                Crear
                            </button>
                        )}
                    </div>
                </div>

                <div style={{
                    background: "linear-gradient(180deg, #131327 0%, #0C0C17 100%)",
                    borderRadius: "16px",
                    border: "1px solid #2D2D44",
                    boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    minHeight: "200px"
                }}>
                    <div style={{
                        position: "absolute",
                        top: "-20%",
                        right: "-10%",
                        width: "200px",
                        height: "200px",
                        background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0,0,0,0) 70%)",
                        filter: "blur(20px)",
                        zIndex: 0
                    }} />
                    
                    <div style={{ padding: isMobile ? "16px" : "20px", paddingBottom: "0", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ color: "#9CA3AF", fontSize: isMobile ? "12px" : "13px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>
                                Mercado • {selectedCoin.toUpperCase()}
                            </span>
                            <span style={{ 
                                color: "white", 
                                fontSize: isMobile ? "24px" : "32px", 
                                fontWeight: 700,
                                background: "linear-gradient(135deg, #FFFFFF 0%, #E0E7FF 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent"
                            }}>
                                {coinPrice ? `$${coinPrice.toLocaleString()}` : '---'}
                            </span>
                        </div>
                    </div>
                    
                    <div style={{ flex: 1, width: "100%", height: "100%", position: "relative", zIndex: 1 }}>
                        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
                    </div>
                </div>
            </div>

            {/* Your Wallets */}
            <div style={styles.section}>
                <h2 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, marginBottom: "4px", textAlign: "center" }}>
                    Tus Billeteras
                </h2>
                <p style={{ color: "#9CA3AF", fontSize: "13px", textAlign: "center", marginTop: 0, marginBottom: "18px" }}>
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
                        <div style={{ color: "#9CA3AF", marginBottom: "16px" }}>
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
