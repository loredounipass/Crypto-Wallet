import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Article = ({ n, title, children }) => (
    <article style={{ padding: '1.4rem 1.6rem', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#6366F1', marginBottom: '0.6rem' }}>Article {n} — {title}</h3>
        <p style={{ fontSize: '0.92rem', lineHeight: 1.75, color: '#2b2f3a', textAlign: 'justify', margin: 0 }}>{children}</p>
    </article>
);

export default function Privacy() {
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

            <section style={{ maxWidth: '880px', width: '100%', padding: '3rem 1rem 4rem', position: 'relative', zIndex: 1 }}>
                <p style={{ textAlign: 'center', fontSize: '0.75rem', letterSpacing: '3px', fontWeight: 700, color: '#fff', marginBottom: '0.6rem' }}>BRIVOTRUST — LEGAL</p>
                <h1 style={{ textAlign: 'center', fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Privacy Policy</h1>
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#fff', marginBottom: '2rem' }}>
                    Last updated: {new Date().getFullYear()} &nbsp;•&nbsp; Effective upon publication at /privacy
                </p>

                <div style={{ background: '#ffffff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ padding: '1.6rem', background: '#f4f5fb', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                        <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#2b2f3a', margin: 0, textAlign: 'justify' }}>
                            <strong>Summary.</strong> BrivoTrust processes account, verification, wallet, transaction, escrow, chat and service data
                            to operate custodial wallets, track on-chain deposits and withdrawals, and settle P2P orders.
                            On-chain addresses are public by nature of blockchains.
                        </p>
                    </div>

                    <Article n="1" title="Data We Collect">
                        Account: email, password, two-factor authentication settings and verification codes. Provider verification: first name, last name, ID number, street, city, postal code, photo, payment methods and destination wallets per coin. Wallets and activity: assigned addresses, network, coin, balances, token balances, transactions with amounts and status. P2P: orders with seller and provider emails, addresses, fiat amounts, statuses, dispute reasons, and per-order chat messages. Support: help chats and emails. Service data: login sessions, security tokens, and usage logs needed to operate the platform.
                    </Article>
                    <Article n="2" title="How We Use Data">
                        To create and link custodial wallets, index native and ERC-20 deposits after confirmations, queue withdrawals, lock and release P2P escrow via smart contracts, confirm fiat payment, resolve disputes as revert or award, send deposit and withdrawal emails, estimate gas, enforce minimums, prevent fraud, and provide support.
                    </Article>
                    <Article n="3" title="On-Chain Disclosure">
                        Addresses and amounts you transact are recorded on public blockchain networks and visible to anyone. Market prices are provided by third-party price services.
                    </Article>
                    <Article n="4" title="Cookies and Sessions">
                        We use login sessions and security cookies to keep you authenticated and protect requests, and to deliver real-time order and transaction updates. Disabling cookies prevents login.
                    </Article>
                    <Article n="5" title="Sharing">
                        We share data with service providers only to operate the platform, such as hosting, database, messaging, and blockchain connectivity. Provider details needed for a trade, such as name, payment methods and destination coin, are shown to the counterparty. Disputed orders are reviewed by administrators. We disclose data when required by law.
                    </Article>
                    <Article n="6" title="Retention and Security">
                        Records are retained while your account is active and as needed for accounting, audit trails, and dispute evidence. Custodial keys are held securely with access controls. No method is fully secure; you must protect your credentials and two-factor authentication.
                    </Article>
                    <Article n="7" title="Your Rights and Contact">
                        Request access, correction, or deletion of personal data where applicable, subject to legal and on-chain retention limits. Public blockchain data cannot be deleted. Contact us through the Help Center. Continued use after posting changes at /privacy constitutes acceptance.
                    </Article>
                    <Article n="8" title="AI Assistance">
                        We use AI for general assistance through Brivo Agent and support chat. When you use these features, your messages and relevant account context needed to answer, such as selected feature guides and recent support history, are processed to generate responses. AI answers are informational only, may be incomplete or inaccurate, and are not financial, legal, or investment advice. Do not share passwords, private keys, or 2FA codes with the assistant. Human support may review AI conversations for quality, safety, and dispute evidence.
                    </Article>

                    <div style={{ padding: '1.4rem 1.6rem', background: '#f4f5fb', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" className="bv-btn-gradient">Accept & Start Trading</Link>
                        <Link to="/landing" className="bv-btn-outline" style={{ color: '#333' }}>Back to Catalog</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
