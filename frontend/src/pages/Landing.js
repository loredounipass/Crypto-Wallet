import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

// Importing generated assets
import heroCoinsImg from '../assets/hero_crypto_coins_1780904442089.png';
import p2pSecurityImg from '../assets/p2p_security_lock_1780904458349.png';
import web3NetworkImg from '../assets/web3_network_nodes_1780904477811.png';
import chartUiImg from '../assets/trading_chart_ui_1780904602514.png';

const coins = [
    { id: 'bitcoin', symbol: 'BTC', name: 'BTC/USD' },
    { id: 'ethereum', symbol: 'ETH', name: 'ETH/USD' },
    { id: 'solana', symbol: 'SOL', name: 'SOL/USD' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB/USD' },
];

export default function Landing() {
    const [prices, setPrices] = useState(null);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const ids = coins.map(c => c.id).join(',');
                const res = await fetch(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
                );
                const data = await res.json();
                setPrices(data);
            } catch {
                console.warn('Failed to fetch prices');
            }
        };
        fetchPrices();
        const interval = setInterval(fetchPrices, 60000);
        // Ensure scroll to top on mount
        window.scrollTo(0, 0);

        // Add mouse tracking for glowing cards
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

        // Intersection Observer for reveal animations
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
            clearInterval(interval);
            document.getElementById('products')?.removeEventListener('mousemove', handleMouseMove);
            revealObserver.disconnect();
        };
    }, []);

    return (
        <div className="bv-landing">
            {/* Navbar */}
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
                        <Link to="/login" className="bv-btn-outline">Sign in / Register</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="bv-hero">
                <div className="bv-subtitle">BrivoTrust</div>
                <h1 className="bv-title">
                    Unlock Your Financial Future<br />
                    in the Web3 Era
                </h1>
                
                <div className="bv-hero-actions">
                    <Link to="/register" className="bv-btn-gradient">Start Trading Now</Link>
                    <a href="#web3" className="bv-btn-outline">Explore Web3 Ecosystem</a>
                </div>

                <div className="bv-hero-image-container">
                    <img src={heroCoinsImg} alt="Crypto Coins" className="bv-hero-image" />
                </div>
            </header>

            {/* Tickers */}
            <section className="bv-tickers reveal">
                {coins.map((coin, i) => {
                    const data = prices?.[coin.id];
                    const usd = data?.usd ?? 0;
                    const change = data?.usd_24h_change ?? 0;
                    const isPositive = change >= 0;
                    const strokeColor = i % 2 === 0 ? '#00e6f0' : '#9d4edd';
                    return (
                        <div className="bv-ticker-card" key={coin.id}>
                            <div className="bv-ticker-info">
                                <div className="bv-ticker-name">{coin.name}</div>
                                <div className="bv-ticker-price">
                                    ${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    <span className={`bv-ticker-change ${isPositive ? 'positive' : 'negative'}`}>
                                        ({isPositive ? '+' : ''}{change.toFixed(2)}%)
                                    </span>
                                </div>
                            </div>
                            <svg className="bv-sparkline" viewBox="0 0 60 25">
                                <path d={['M0 20 Q 15 15, 30 10 T 60 5', 'M0 15 Q 15 20, 30 10 T 60 2', 'M0 22 Q 10 15, 20 18 T 40 8 T 60 4', 'M0 18 Q 20 22, 40 10 T 60 6'][i]} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                    );
                })}
            </section>

            {/* Ecosystem Cards */}
            <section className="bv-ecosystem reveal" id="products">
                <h2 className="bv-section-title">Our Ecosystem</h2>
                <div className="bv-cards-grid">
                    <div className="bv-card">
                        <div className="bv-card-icon">💰</div>
                        <h3 className="bv-card-title">Wallet</h3>
                        <p className="bv-card-desc">Store and manage your funds securely with multi-currency wallet support.</p>
                    </div>
                    <div className="bv-card">
                        <div className="bv-card-icon">📥</div>
                        <h3 className="bv-card-title">Deposits</h3>
                        <p className="bv-card-desc">Fast and secure deposits across multiple crypto networks and fiat gateways.</p>
                    </div>
                    <div className="bv-card">
                        <div className="bv-card-icon">📤</div>
                        <h3 className="bv-card-title">Withdrawals</h3>
                        <p className="bv-card-desc">Instant withdrawals with low fees and support for all major cryptocurrencies.</p>
                    </div>
                    <div className="bv-card">
                        <div className="bv-card-icon">🤝</div>
                        <h3 className="bv-card-title">P2P Trading</h3>
                        <p className="bv-card-desc">Peer-to-peer trading with escrow protection, dispute resolution, and encrypted chat.</p>
                    </div>
                </div>
            </section>

            {/* Split Features */}
            <section className="bv-features-split reveal" id="p2p">
                <div className="bv-feature-block">
                    <div className="bv-feature-content">
                        <h3 className="bv-feature-title">Secure P2P Trading with Escrow</h3>
                        <p className="bv-feature-desc">Trade directly with other users using our escrow system. Funds are held securely until both parties confirm the transaction.</p>
                        <ul className="bv-feature-list">
                            <li>Escrow Protection</li>
                            <li>Dispute Resolution</li>
                            <li>Instant Settlement</li>
                        </ul>
                    </div>
                </div>
                <div className="bv-feature-block">
                    <img src={p2pSecurityImg} alt="P2P Security" className="bv-feature-image" />
                </div>
            </section>

            <section className="bv-features-split reveal" id="web3" style={{ direction: 'rtl' }}>
                <div className="bv-feature-block" style={{ direction: 'ltr' }}>
                    <div className="bv-feature-content">
                        <h3 className="bv-feature-title">Web3 Connectivity</h3>
                        <p className="bv-feature-desc">Decentralized browser is interact with the decentralized network, smart contracts, and dApps seamlessly.</p>
                        <ul className="bv-feature-list">
                            <li>Connect dApps</li>
                            <li>NFT Marketplace integration</li>
                            <li>Cross-Chain Bridge</li>
                        </ul>
                    </div>
                </div>
                <div className="bv-feature-block" style={{ direction: 'ltr' }}>
                    <img src={web3NetworkImg} alt="Web3 Network" className="bv-feature-image" />
                </div>
            </section>

            {/* Chart Preview */}
            <section className="bv-chart-preview reveal" id="exchange">
                <div className="bv-chart-content">
                    <div className="bv-chart-text">
                        <h3 className="bv-chart-title">Multi-Currency Exchange</h3>
                        <p className="bv-chart-desc">Trade cryptocurrencies with real-time order books, deep liquidity, and seamless wallet integration. BrivoTrust connects you to global markets with institutional-grade execution.</p>
                        <ul className="bv-chart-list">
                            <li>Real-time Order Books</li>
                            <li>Multi-Currency Wallet</li>
                            <li>Instant Settlements</li>
                        </ul>
                    </div>
                    <div className="bv-chart-visual">
                        <img src={chartUiImg} alt="Trading Interface" className="bv-chart-image" />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bv-footer">
                <div className="bv-footer-grid">
                    <div className="bv-footer-col">
                        <h4>About</h4>
                        <ul className="bv-footer-links">
                        <li><a href="#about">About Us</a></li>
                        <li><a href="#careers">Careers</a></li>
                    </ul>
                </div>
                <div className="bv-footer-col">
                    <h4>Support</h4>
                    <ul className="bv-footer-links">
                        <li><a href="#help">Help Center</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </div>
                <div className="bv-footer-col">
                    <h4>Products</h4>
                    <ul className="bv-footer-links">
                        <li><a href="#p2p">P2P Trading</a></li>
                        <li><a href="#wallet">Wallet</a></li>
                        <li><a href="#deposits">Deposits</a></li>
                        <li><a href="#withdrawals">Withdrawals</a></li>
                    </ul>
                </div>
                <div className="bv-footer-col">
                    <h4>Community</h4>
                    <ul className="bv-footer-links">
                        <li><a href="#twitter">Twitter</a></li>
                        <li><a href="#discord">Discord</a></li>
                        <li><a href="#telegram">Telegram</a></li>
                        <li><a href="#linkedin">LinkedIn</a></li>
                    </ul>
                </div>
                </div>
                
                <div className="bv-footer-bottom">
                    <div className="bv-footer-legal">
                        <Link to="/privacy">Privacy Policy</Link>
                        <Link to="/terms">Terms & Conditions</Link>
                    </div>
                    <p>&copy; {new Date().getFullYear()} BrivoTrust. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
