import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const CloseIcon = ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const CameraFlipIcon = ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2v6h-6"></path>
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
        <path d="M3 22v-6h6"></path>
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
    </svg>
);

const QRScannerModal = ({ isOpen, onClose, onScan }) => {
    const [facingMode, setFacingMode] = useState("environment");
    const [error, setError] = useState("");
    const [scanSuccess, setScanSuccess] = useState(false);
    const html5QrCodeRef = useRef(null);
    const onScanRef = useRef(onScan);
    const onCloseRef = useRef(onClose);
    const successTriggeredRef = useRef(false);

    useEffect(() => {
        onScanRef.current = onScan;
        onCloseRef.current = onClose;
    }, [onScan, onClose]);

    useEffect(() => {
        if (!isOpen) {
            setScanSuccess(false);
            successTriggeredRef.current = false;
            return;
        }

        let isComponentMounted = true;
        successTriggeredRef.current = false;
        
        const initScanner = async () => {
            // Give any previous scanner a moment to clean up
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (!isComponentMounted) return;

            try {
                if (!html5QrCodeRef.current) {
                    html5QrCodeRef.current = new Html5Qrcode("qr-reader");
                }
                
                // If it's currently scanning, stop it first
                if (html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop();
                    html5QrCodeRef.current.clear();
                }

                if (!isComponentMounted) return;

                await html5QrCodeRef.current.start(
                    { facingMode: facingMode },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        if (isComponentMounted && !successTriggeredRef.current) {
                            successTriggeredRef.current = true;
                            setScanSuccess(true);
                            try {
                                if (html5QrCodeRef.current && html5QrCodeRef.current.pause) {
                                    html5QrCodeRef.current.pause(true);
                                }
                            } catch(e) {}
                            
                            setTimeout(() => {
                                if (!isComponentMounted) return;
                                if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                                    html5QrCodeRef.current.stop().then(() => {
                                        html5QrCodeRef.current.clear();
                                        if (onScanRef.current) onScanRef.current(decodedText);
                                        if (onCloseRef.current) onCloseRef.current();
                                    }).catch(err => console.error("Error stopping scanner on success", err));
                                } else {
                                    if (onScanRef.current) onScanRef.current(decodedText);
                                    if (onCloseRef.current) onCloseRef.current();
                                }
                            }, 600);
                        }
                    },
                    (errorMessage) => {
                        // ignore scan errors
                    }
                );
                if (isComponentMounted) setError("");
            } catch (err) {
                console.error("Camera access error:", err);
                if (isComponentMounted) {
                    setError("No se pudo acceder a la cámara o cambiar de lente. Asegúrate de dar permisos.");
                }
            }
        };

        initScanner();

        return () => {
            isComponentMounted = false;
            if (html5QrCodeRef.current) {
                if (html5QrCodeRef.current.isScanning) {
                    html5QrCodeRef.current.stop().then(() => {
                        html5QrCodeRef.current.clear();
                    }).catch(err => console.error("Error stopping scanner during cleanup", err));
                } else {
                    try { html5QrCodeRef.current.clear(); } catch(e) {}
                }
            }
        };
    }, [isOpen, facingMode]);

    const toggleCamera = () => {
        setFacingMode(prev => prev === "environment" ? "user" : "environment");
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9999,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(4px)"
        }}>
            <style>
                {`
                @keyframes scanline {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes pulseSuccess {
                    0% { transform: scale(0.9); opacity: 0; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .web3-container {
                    position: relative; width: 100%; max-width: 400px;
                    background-color: #1A1A2E; border-radius: 20px; overflow: hidden;
                    border: 1px solid #2D2D44; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .web3-scanner {
                    position: relative;
                    border-radius: 16px;
                    overflow: hidden;
                    background-color: #0F0F1A;
                    min-height: 250px;
                    border: 1px solid #2D2D44;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .scanner-reticle {
                    position: absolute;
                    width: 220px;
                    height: 220px;
                    z-index: 10;
                    pointer-events: none;
                    transition: all 0.3s ease;
                }
                .corner {
                    position: absolute;
                    width: 30px;
                    height: 30px;
                    border: 3px solid ${scanSuccess ? '#4CAF50' : '#2186EB'};
                    transition: border-color 0.3s ease;
                    border-radius: 6px;
                }
                .corner.top-left { top: 0; left: 0; border-right: none; border-bottom: none; border-bottom-right-radius: 0; }
                .corner.top-right { top: 0; right: 0; border-left: none; border-bottom: none; border-bottom-left-radius: 0; }
                .corner.bottom-left { bottom: 0; left: 0; border-right: none; border-top: none; border-top-right-radius: 0; }
                .corner.bottom-right { bottom: 0; right: 0; border-left: none; border-top: none; border-top-left-radius: 0; }
                
                .scan-laser {
                    position: absolute;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background-color: #2186EB;
                    box-shadow: 0 0 8px rgba(33, 134, 235, 0.6);
                    z-index: 20;
                    animation: scanline 2.5s ease-in-out infinite;
                    display: ${scanSuccess ? 'none' : 'block'};
                }
                
                .success-square {
                    position: absolute;
                    width: 180px;
                    height: 180px;
                    border: 2px solid #4CAF50;
                    background-color: rgba(76, 175, 80, 0.15);
                    border-radius: 16px;
                    z-index: 15;
                    animation: pulseSuccess 0.3s ease-out forwards;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(2px);
                }
                .success-square svg {
                    color: #4CAF50;
                    width: 64px;
                    height: 64px;
                    filter: drop-shadow(0 0 8px rgba(76, 175, 80, 0.5));
                }

                .web3-title {
                    color: #FFFFFF;
                    font-size: 18px;
                    font-weight: 600;
                    margin: 0;
                }
                .web3-text {
                    color: ${scanSuccess ? '#4CAF50' : '#9CA3AF'};
                    text-align: center;
                    margin-top: 16px;
                    font-size: 14px;
                    margin-bottom: 0;
                    transition: color 0.3s ease;
                    font-weight: 500;
                }
                #qr-reader video {
                    object-fit: cover !important;
                    border-radius: 16px;
                }
                `}
            </style>
            <div className="web3-container">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #2D2D44" }}>
                    <h3 className="web3-title">Escanear Dirección</h3>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button onClick={toggleCamera} style={{ background: "none", border: "1px solid #2D2D44", color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", backgroundColor: "#2D2D44", borderRadius: "8px" }}>
                            <CameraFlipIcon size={20} />
                        </button>
                        <button onClick={onClose} style={{ background: "none", border: "1px solid #2D2D44", color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", backgroundColor: "#2D2D44", borderRadius: "8px" }}>
                            <CloseIcon size={20} />
                        </button>
                    </div>
                </div>

                <div style={{ padding: "20px", position: "relative" }}>
                    {error && (
                        <div style={{ backgroundColor: "rgba(244, 67, 54, 0.1)", border: "1px solid rgba(244, 67, 54, 0.5)", color: "#F44336", padding: "12px", borderRadius: "10px", marginBottom: "16px", fontSize: "14px", textAlign: "center" }}>
                            {error}
                        </div>
                    )}
                    <div className="web3-scanner">
                        <div className="scanner-reticle">
                            <div className="corner top-left"></div>
                            <div className="corner top-right"></div>
                            <div className="corner bottom-left"></div>
                            <div className="corner bottom-right"></div>
                            <div className="scan-laser"></div>
                        </div>
                        {scanSuccess && (
                            <div className="success-square">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                        )}
                        <div id="qr-reader" style={{ width: "100%", border: "none", position: "relative", zIndex: 1 }}></div>
                    </div>
                    <p className="web3-text">
                        {scanSuccess ? "¡Código QR Encontrado!" : "Alinea el código QR dentro del marco"}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QRScannerModal;
