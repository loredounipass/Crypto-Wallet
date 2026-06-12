import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

// Importing generated assets
import heroCoinsImg from '../assets/hero_crypto_coins_1780904442089.png';
import p2pSecurityImg from '../assets/p2p_security_lock_1780904458349.png';
import web3NetworkImg from '../assets/web3_network_nodes_1780904477811.png';
import chartUiImg from '../assets/trading_chart_ui_1780904602514.png';

export default function Landing() {
    useEffect(() => {
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
            document.getElementById('products')?.removeEventListener('mousemove', handleMouseMove);
            revealObserver.disconnect();
        };
    }, []);

    return (
        <div className="bv-landing">
            {/* Navbar */}
            <nav className="bv-navbar">
                <Link to="/landing" className="bv-logo-container">
                    <div className="bv-logo-icon">B</div>
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
            </nav>

            {/* Hero Section */}
            <header className="bv-hero">
                <div className="bv-subtitle">BrivoTrust Premium</div>
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
                <div className="bv-ticker-card">
                    <div className="bv-ticker-info">
                        <div className="bv-ticker-name">BTC/USD</div>
                        <div className="bv-ticker-price">$65,452.10 <span className="bv-ticker-change positive">(+5.5%)</span></div>
                    </div>
                    <svg className="bv-sparkline" viewBox="0 0 60 25">
                        <path d="M0 20 Q 15 15, 30 10 T 60 5" fill="none" stroke="#00e6f0" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </div>
                <div className="bv-ticker-card">
                    <div className="bv-ticker-info">
                        <div className="bv-ticker-name">ETH/USD</div>
                        <div className="bv-ticker-price">$3,456.76 <span className="bv-ticker-change positive">(+3.19%)</span></div>
                    </div>
                    <svg className="bv-sparkline" viewBox="0 0 60 25">
                        <path d="M0 15 Q 15 20, 30 10 T 60 2" fill="none" stroke="#9d4edd" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </div>
                <div className="bv-ticker-card">
                    <div className="bv-ticker-info">
                        <div className="bv-ticker-name">SOL/USD</div>
                        <div className="bv-ticker-price">$125.45 <span className="bv-ticker-change positive">(+6.2%)</span></div>
                    </div>
                    <svg className="bv-sparkline" viewBox="0 0 60 25">
                        <path d="M0 22 Q 10 15, 20 18 T 40 8 T 60 4" fill="none" stroke="#00e6f0" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </div>
                <div className="bv-ticker-card">
                    <div className="bv-ticker-info">
                        <div className="bv-ticker-name">BNB/USD</div>
                        <div className="bv-ticker-price">$456.78 <span className="bv-ticker-change positive">(+1.8%)</span></div>
                    </div>
                    <svg className="bv-sparkline" viewBox="0 0 60 25">
                        <path d="M0 18 Q 20 22, 40 10 T 60 6" fill="none" stroke="#9d4edd" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </div>
            </section>

            {/* Ecosystem Cards */}
            <section className="bv-ecosystem reveal" id="products">
                <h2 className="bv-section-title">Our Ecosystem</h2>
                <div className="bv-cards-grid">
                    <div className="bv-card">
                        <div className="bv-card-icon">🤝</div>
                        <h3 className="bv-card-title">Global P2P Network</h3>
                        <p className="bv-card-desc">Secure peer-to-peer trading with escrow and encrypted communication across multiple crypto networks.</p>
                    </div>
                    <div className="bv-card">
                        <div className="bv-card-icon">🌐</div>
                        <h3 className="bv-card-title">Direct Web3 Access</h3>
                        <p className="bv-card-desc">Node connection and network adherence connection to access wallet integration and multi-chain features.</p>
                    </div>
                    <div className="bv-card">
                        <div className="bv-card-icon">🛡️</div>
                        <h3 className="bv-card-title">Institutional Grade Security</h3>
                        <p className="bv-card-desc">Multi-layered protection to secure your assets, operations, and transactions with institutional standards.</p>
                    </div>
                </div>
            </section>

            {/* Split Features */}
            <section className="bv-features-split reveal" id="p2p">
                <div className="bv-feature-block">
                    <div className="bv-feature-content">
                        <h3 className="bv-feature-title">Secure P2P Trading</h3>
                        <p className="bv-feature-desc">Secure peer-to-peer network with encrypted data transmission on escrow, and encrypted data network.</p>
                        <ul className="bv-feature-list">
                            <li>Trustless Escrow</li>
                            <li>Verified Merchants</li>
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
                <img src={chartUiImg} alt="Trading Interface" className="bv-chart-image" />
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
                        <li><a href="#p2p">P2P</a></li>
                        <li><a href="#web3">Web3</a></li>
                        <li><a href="#blog">Blog</a></li>
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
                    <p>&copy; {new Date().getFullYear()} BrivoTrust Premium. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
