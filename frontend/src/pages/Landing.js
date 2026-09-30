import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

import p2pSecurityImg from '../assets/p2p_security_lock_1780904458349.png';
import web3NetworkImg from '../assets/web3_network_nodes_1780904477811.png';
import chartUiImg from '../assets/trading_chart_ui_1780904602514.png';

const EcoIcon = ({ children }) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
    </svg>
);

const IconWallet = () => (
    <EcoIcon>
        <rect x="3" y="6" width="18" height="13" rx="2.5" />
        <path d="M3 10h18" />
        <circle cx="17" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
    </EcoIcon>
);

const IconDeposit = () => (
    <EcoIcon>
        <path d="M12 3v11" />
        <path d="M7.5 10.5 12 15l4.5-4.5" />
        <path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" />
    </EcoIcon>
);

const IconWithdraw = () => (
    <EcoIcon>
        <path d="M12 14V3" />
        <path d="M7.5 7.5 12 3l4.5 4.5" />
        <path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" />
    </EcoIcon>
);

const IconP2P = () => (
    <EcoIcon>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 20c.9-3.2 2.9-4.8 5.5-4.8s4.6 1.6 5.5 4.8" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M16.2 15.3c2.1.4 3.6 1.7 4.3 4.2" />
    </EcoIcon>
);

const IconSwap = () => (
    <EcoIcon>
        <path d="M4 7h13" />
        <path d="M14 4l3 3-3 3" />
        <path d="M20 17H7" />
        <path d="M10 14l-3 3 3 3" />
    </EcoIcon>
);

export default function Landing() {
    useEffect(() => {
        window.scrollTo(0, 0);

        const handleMouseMove = (e) => {
            for (const card of document.querySelectorAll('.bv-card')) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            }
        };

        document.getElementById('products')?.addEventListener('mousemove', handleMouseMove);

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.reveal').forEach((el) => {
            revealObserver.observe(el);
        });

        return () => {
            document.getElementById('products')?.removeEventListener('mousemove', handleMouseMove);
            revealObserver.disconnect();
        };
    }, []);

    return (
        <div className="bv-landing">
            {/* ── Navbar ── */}
            <nav className="bv-navbar">
                <div className="bv-nav-inner">
                    <Link to="/landing" className="bv-logo-container">
                        <div className="bv-logo-icon">
                            <svg viewBox="0 0 40 40" className="bv-logo-hex">
                                <polygon points="20,2 37,12 37,28 20,38 3,28 3,12" fill="url(#logoGrad)" />
                                <text x="20" y="26" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>B</text>
                                <defs>
                                    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#6366F1" />
                                        <stop offset="50%" stopColor="#8B5CF6" />
                                        <stop offset="100%" stopColor="#2186EB" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div className="bv-logo-text">Brivo<span>Trust</span></div>
                    </Link>

                    <div className="bv-nav-links">
                        <a href="#exchange" className="bv-nav-link">Exchange</a>
                        <a href="#p2p" className="bv-nav-link">P2P</a>
                        <a href="#web3" className="bv-nav-link">Web3</a>
                        <a href="#products" className="bv-nav-link">Products</a>
                    </div>

                    <div className="bv-auth-buttons">
                        <Link to="/login" className="bv-nav-link" style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>Log In</Link>
                        <Link to="/register" className="bv-btn-gradient" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>Sign Up</Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <header className="bv-hero">
                <div className="bv-subtitle">BrivoTrust</div>
                <h1 className="bv-title">
                    Your Wallet for P2P Escrow,<br />
                    Deposits and On-Chain Swaps
                </h1>

                <div className="bv-hero-actions">
                    <Link to="/register" className="bv-btn-gradient">Start Trading Now</Link>
                    <a href="#web3" className="bv-btn-outline">Explore Web3 Ecosystem</a>
                </div>

                <div className="bv-hero-logo">
                    <div className="bv-logo-icon" style={{ width: '64px', height: '64px' }}>
                        <svg viewBox="0 0 40 40" className="bv-logo-hex">
                            <polygon points="20,2 37,12 37,28 20,38 3,28 3,12" fill="url(#logoGradHero)" />
                            <text x="20" y="26" textAnchor="middle" fill="white" fontSize="18" fontWeight="800">B</text>
                            <defs>
                                <linearGradient id="logoGradHero" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#6366F1" />
                                    <stop offset="50%" stopColor="#8B5CF6" />
                                    <stop offset="100%" stopColor="#2186EB" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div className="bv-logo-text" style={{ fontSize: '2rem' }}>Brivo<span>Trust</span></div>
                </div>
            </header>

            {/* ── About Us ── */}
            <section className="bv-ecosystem reveal" id="about">
                <h2 className="bv-section-title">About BrivoTrust</h2>
                <p className="bv-section-subtitle">Our mission is to make on-chain finance simple and safe — all in one platform.</p>
                <div className="bv-cards-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="bv-card">
                        <div className="bv-card-icon bv-icon-wallet"><IconWallet /></div>
                        <div className="bv-card-text-wrap">
                            <h3 className="bv-card-title">Secure Wallets</h3>
                            <p className="bv-card-desc">One EVM wallet per network to hold native coins and ERC-20 tokens like USDT/USDC.</p>
                        </div>
                    </div>
                    <div className="bv-card">
                        <div className="bv-card-icon bv-icon-deposit"><IconDeposit /></div>
                        <div className="bv-card-text-wrap">
                            <h3 className="bv-card-title">Transparent Funds</h3>
                            <p className="bv-card-desc">Deposits and withdrawals tracked on-chain across supported networks after confirmations.</p>
                        </div>
                    </div>
                    <div className="bv-card">
                        <div className="bv-card-icon bv-icon-p2p"><IconP2P /></div>
                        <div className="bv-card-text-wrap">
                            <h3 className="bv-card-title">Protected Trading</h3>
                            <p className="bv-card-desc">P2P with verified providers, smart-contract escrow, disputes and auto-refund.</p>
                        </div>
                    </div>
                    <div className="bv-card">
                        <div className="bv-card-icon bv-icon-swap"><IconSwap /></div>
                        <div className="bv-card-text-wrap">
                            <h3 className="bv-card-title">Open Swaps</h3>
                            <p className="bv-card-desc">Swaps routed on-chain via Uniswap with transparent settlement, no intermediaries.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Ecosystem Catalog ── */}
            <section className="bv-ecosystem reveal" id="products">
                <h2 className="bv-section-title">Our Ecosystem</h2>
                <p className="bv-section-subtitle">Everything you need to trade, store, and grow your crypto portfolio — all in one platform.</p>
                <div className="bv-cards-grid">
                    <div className="bv-card">
                        <div className="bv-card-icon bv-icon-wallet"><IconWallet /></div>
                        <div className="bv-card-text-wrap">
                            <h3 className="bv-card-title">Wallet</h3>
                            <p className="bv-card-desc">Custodial EVM wallets per network with native + ERC-20 (USDT/USDC) balances.</p>
                        </div>
                    </div>
                    <div className="bv-card">
                        <div className="bv-card-icon bv-icon-deposit"><IconDeposit /></div>
                        <div className="bv-card-text-wrap">
                            <h3 className="bv-card-title">Deposits</h3>
                            <p className="bv-card-desc">On-chain crypto deposits tracked across supported EVM networks after confirmations.</p>
                        </div>
                    </div>
                    <div className="bv-card">
                        <div className="bv-card-icon bv-icon-withdraw"><IconWithdraw /></div>
                        <div className="bv-card-text-wrap">
                            <h3 className="bv-card-title">Withdrawals</h3>
                            <p className="bv-card-desc">Queued on-chain withdrawals with network gas fees, minimums and confirmation tracking.</p>
                        </div>
                    </div>
                    <div className="bv-card">
                        <div className="bv-card-icon bv-icon-p2p"><IconP2P /></div>
                        <div className="bv-card-text-wrap">
                            <h3 className="bv-card-title">P2P Trading</h3>
                            <p className="bv-card-desc">P2P with on-chain escrow, admin dispute resolution and per-order chat.</p>
                        </div>
                    </div>
                    <div className="bv-card">
                        <div className="bv-card-icon bv-icon-swap"><IconSwap /></div>
                        <div className="bv-card-text-wrap">
                            <h3 className="bv-card-title">Swap</h3>
                            <p className="bv-card-desc">Swaps routed on-chain via Uniswap router with transparent settlement.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features Title ── */}
            <section className="bv-ecosystem reveal" id="features" style={{ marginBottom: '3rem' }}>
                <h2 className="bv-section-title">Why BrivoTrust</h2>
                <p className="bv-section-subtitle">P2P protected by escrow, multi-chain wallets with ERC-20 support, and on-chain swaps — built for security and speed.</p>
            </section>

            {/* ── P2P Feature ── */}
            <section className="bv-features-split reveal" id="p2p">
                <div className="bv-feature-block">
                    <div className="bv-feature-content">
                        <h3 className="bv-feature-title">Secure P2P Trading with On-Chain Escrow</h3>
                        <p className="bv-feature-desc">Choose a verified provider and payment method — your crypto is locked in escrow, the provider confirms fiat payment, then you release. Every order has its own chat, expiry with auto-refund, and admin arbitration if disputed.</p>
                        <ul className="bv-feature-list">
                            <li>Verified Providers with Wallets & Fiat Methods</li>
                            <li>On-Chain Escrow, Expiry & Auto-Refund</li>
                            <li>Order Chat, Live Tracking & Admin Disputes</li>
                        </ul>
                    </div>
                </div>
                <div className="bv-feature-block">
                    <img src={p2pSecurityImg} alt="P2P Security" className="bv-feature-image" />
                </div>
            </section>

            {/* ── Web3 Feature ── */}
            <section className="bv-features-split reveal" id="web3" style={{ direction: 'rtl' }}>
                <div className="bv-feature-block" style={{ direction: 'ltr' }}>
                    <div className="bv-feature-content">
                        <h3 className="bv-feature-title">Web3 Connectivity</h3>
                        <p className="bv-feature-desc">Connect to decentralized networks to manage EVM wallets, track ERC-20 and native on-chain activity, and interact with smart contracts — all from one place.</p>
                        <ul className="bv-feature-list">
                            <li>Multi-Chain EVM Support</li>
                            <li>ERC-20 Token Support</li>
                            <li>On-Chain Wallet Management</li>
                            <li>Smart Contract Interaction</li>
                        </ul>
                    </div>
                </div>
                <div className="bv-feature-block" style={{ direction: 'ltr' }}>
                    <img src={web3NetworkImg} alt="Web3 Network" className="bv-feature-image" />
                </div>
            </section>

            {/* ── Exchange Chart ── */}
            <section className="bv-chart-preview reveal" id="exchange">
                <div className="bv-chart-content">
                    <div className="bv-chart-text">
                        <h3 className="bv-chart-title">On-Chain Swaps via Uniswap Router</h3>
                        <p className="bv-chart-desc">BrivoTrust connects directly to the Uniswap router for decentralized swaps. Trade tokens from your wallet with transparent on-chain execution — no intermediaries, no custodial order books.</p>
                        <ul className="bv-chart-list">
                            <li>Direct Uniswap Router Integration</li>
                            <li>Decentralized Non-Custodial Swaps</li>
                            <li>Transparent On-Chain Settlement</li>
                        </ul>
                    </div>
                    <div className="bv-chart-visual">
                        <img src={chartUiImg} alt="Trading Interface" className="bv-chart-image" />
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="bv-footer">
                <div className="bv-footer-hero">
                    <Link to="/landing" className="bv-logo-container">
                        <div className="bv-logo-icon">
                            <svg viewBox="0 0 40 40" className="bv-logo-hex">
                                <polygon points="20,2 37,12 37,28 20,38 3,28 3,12" fill="url(#logoGradFooter)" />
                                <text x="20" y="26" textAnchor="middle" fill="white" fontSize="18" fontWeight="800">B</text>
                                <defs>
                                    <linearGradient id="logoGradFooter" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#6366F1" />
                                        <stop offset="50%" stopColor="#8B5CF6" />
                                        <stop offset="100%" stopColor="#2186EB" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div className="bv-logo-text">Brivo<span>Trust</span></div>
                    </Link>
                    <p className="bv-footer-tagline">Wallet, P2P escrow and on-chain swaps — secure EVM finance in one place.</p>
                    <div className="bv-footer-cta">
                        <Link to="/register" className="bv-btn-gradient" style={{ padding: '0.55rem 1.4rem', fontSize: '0.85rem' }}>Start Trading Now</Link>
                        <a href="#features" className="bv-btn-outline">Why BrivoTrust</a>
                    </div>
                </div>
                <div className="bv-footer-grid">
                    <div className="bv-footer-col">
                        <h4>Platform</h4>
                        <ul className="bv-footer-links">
                            <li><a href="#p2p">P2P Trading</a></li>
                            <li><a href="#exchange">Swaps via Uniswap</a></li>
                            <li><a href="#web3">Web3 Wallets</a></li>
                            <li><a href="#products">Ecosystem</a></li>
                        </ul>
                    </div>
                    <div className="bv-footer-col">
                        <h4>Company</h4>
                        <ul className="bv-footer-links">
                            <li><a href="#about">About Us</a></li>
                            <li><a href="#features">Why BrivoTrust</a></li>
                            <li><a href="#products">Products</a></li>
                        </ul>
                    </div>
                    <div className="bv-footer-col">
                        <h4>Support</h4>
                        <ul className="bv-footer-links">
                            <li><a href="#help">Help Center</a></li>
                            <li><a href="#contact">Contact</a></li>
                            <li><Link to="/terms">Terms & Conditions</Link></li>
                            <li><Link to="/privacy">Privacy Policy</Link></li>
                        </ul>
                    </div>
                    <div className="bv-footer-col">
                        <h4>Community</h4>
                        <ul className="bv-footer-links">
                            <li><a href="#twitter">X (Twitter)</a></li>
                            <li><a href="#discord">Discord</a></li>
                            <li><a href="#telegram">Telegram</a></li>
                            <li><a href="#linkedin">LinkedIn</a></li>
                        </ul>
                    </div>
                </div>

                <div className="bv-footer-bottom">
                    <p>&copy; {new Date().getFullYear()} BrivoTrust. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
