import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Card = ({ icon, title, desc }) => (
    <div className="bv-card">
        <div className={`bv-card-icon ${icon}`}>{title[0]}</div>
        <div className="bv-card-text-wrap">
            <h3 className="bv-card-title">{title}</h3>
            <p className="bv-card-desc">{desc}</p>
        </div>
    </div>
);

export default function About() {
    return (
        <div className="bv-landing">
            <nav className="bv-navbar">
                <div className="bv-nav-inner">
                    <Link to="/landing" className="bv-logo-container">
                        <div className="bv-logo-text">Brivo<span>Trust</span></div>
                    </Link>
                    <div className="bv-auth-buttons">
                        <Link to="/login" className="bv-nav-link" style={{ fontWeight: 600 }}>Log In</Link>
                        <Link to="/register" className="bv-btn-gradient" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>Sign Up</Link>
                    </div>
                </div>
            </nav>

            <header className="bv-hero">
                <div className="bv-subtitle">About Us</div>
                <h1 className="bv-title">BrivoTrust: on-chain finance,<br />simple and safe</h1>
                <p className="bv-section-subtitle" style={{ maxWidth: '640px', margin: '0 auto 2rem' }}>
                    We build one place to hold native coins and ERC-20 tokens, move funds with on-chain tracking,
                    trade P2P protected by smart-contract escrow, and swap via Uniswap routing.
                </p>
                <div className="bv-hero-actions">
                    <Link to="/register" className="bv-btn-gradient">Start Trading Now</Link>
                    <Link to="/help" className="bv-btn-outline">Visit Help Center</Link>
                </div>
            </header>

            <section className="bv-ecosystem reveal active" id="mission">
                <h2 className="bv-section-title">Our Mission</h2>
                <p className="bv-section-subtitle">Remove complexity without removing security: custodial wallets you can understand, verifiable on-chain movements, and human arbitration when P2P needs it.</p>
                <div className="bv-cards-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <Card icon="bv-icon-wallet" title="Secure Wallets" desc="One EVM wallet per network for natives plus USDT and USDC." />
                    <Card icon="bv-icon-deposit" title="Transparent Funds" desc="Deposits and withdrawals tracked after network confirmations." />
                    <Card icon="bv-icon-p2p" title="Protected Trading" desc="Verified providers, escrow, expiry with auto-refund, admin disputes." />
                    <Card icon="bv-icon-swap" title="Open Swaps" desc="On-chain swaps via Uniswap router with clear settlement." />
                </div>
            </section>

            <section className="bv-ecosystem reveal active">
                <h2 className="bv-section-title">What We Do</h2>
                <p className="bv-section-subtitle">Wallet, P2P escrow, and swaps connected to EVM networks with ERC-20 support.</p>
                <div className="bv-cards-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <Card icon="bv-icon-wallet" title="For Holders" desc="Create wallets, receive deposits, and withdraw with fixed low fees and minimums." />
                    <Card icon="bv-icon-p2p" title="For Traders" desc="Sell to verified providers with fiat methods, confirm, release, or dispute with evidence." />
                    <Card icon="bv-icon-swap" title="For Builders" desc="Use AI assistance via Brivo Agent to learn flows before moving funds." />
                </div>
                <div style={{ textAlign: 'center', marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/terms" className="bv-btn-outline">Product Use Terms</Link>
                    <Link to="/privacy" className="bv-btn-outline">Privacy Policy</Link>
                    <Link to="/landing" className="bv-btn-gradient">Back to Catalog</Link>
                </div>
            </section>
        </div>
    );
}
