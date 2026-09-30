import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const faqs = [
    {
        cat: 'Wallets',
        q: 'How do I create a wallet?',
        a: 'Go to My Wallets and click Create. Select the coin and network. The system assigns you a custodial EVM address from our pool. One address per coin and network. Supported natives: BNB, AVAX, ETH, S, MATIC, OP. ERC-20 USDT and USDC share the network address.',
    },
    {
        cat: 'Deposits',
        q: 'How do deposits work?',
        a: 'Copy your deposit address or QR from the wallet page and send only on the indicated network. Our indexers track native and ERC-20 Transfer events and credit after 12 confirmations. Wrong network or unsupported tokens may be lost. No fiat gateways.',
    },
    {
        cat: 'Withdrawals',
        q: 'How do withdrawals work and what do they cost?',
        a: 'Enter destination address and amount greater than the fee. Withdrawals are queued on-chain jobs and complete after confirmations. One low fixed fee is deducted: BNB 0.005 min 0.01, AVAX 0.001 min 1, ETH 0.005 min 0.01, S 0.5 min 1, MATIC 0.1 min 13, OP 0.005 min 0.01.',
    },
    {
        cat: 'P2P',
        q: 'How do I sell P2P?',
        a: 'In P2P Marketplace pick a verified provider, select coin, amount and the provider payment method. Funds are debited plus the shown escrow gasFee paid by you as seller. Order goes pending, then funded on-chain, provider confirms fiat, then you release. Expires in 30 minutes with auto-refund.',
    },
    {
        cat: 'P2P',
        q: 'How do disputes work?',
        a: 'Funded or buyer_paid orders can be disputed by either side with a reason. The order freezes and an admin resolves as revert to seller or award to provider. Keep chat and payment proof.',
    },
    {
        cat: 'P2P',
        q: 'Who pays P2P gas?',
        a: 'The seller. Each order shows the estimated gasFee calculated from live gas price with margin. Total charged is amount plus gasFee. No extra platform commission on P2P.',
    },
    {
        cat: 'Swaps',
        q: 'How do swaps work?',
        a: 'Swaps route on-chain via the Uniswap router from your balance. Price depends on liquidity and slippage, gas always applies, and reverted transactions can still cost gas.',
    },
    {
        cat: 'Security',
        q: 'How do I secure my account?',
        a: 'Use a strong password, enable 2FA email codes, verify your email, and never share passwords, keys or 2FA codes. Wallets are custodial: we hold keys server-side, you protect your login.',
    },
    {
        cat: 'AI',
        q: 'What is Brivo Agent?',
        a: 'AI for general assistance explaining deposits, withdrawals, wallets and P2P. Answers are informational only and may be wrong. Verify critical actions in the app before transacting.',
    },
];

export default function Help() {
    const [open, setOpen] = useState(0);
    const [filter, setFilter] = useState('All');
    const cats = ['All', ...new Set(faqs.map(f => f.cat))];
    const list = faqs.filter(f => filter === 'All' || f.cat === filter);

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
                <p style={{ textAlign: 'center', fontSize: '0.75rem', letterSpacing: '3px', fontWeight: 700, color: '#fff', marginBottom: '0.6rem' }}>BRIVOTRUST — SUPPORT</p>
                <h1 style={{ textAlign: 'center', fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Help Center</h1>
                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#fff', marginBottom: '1.5rem' }}>Wallets, deposits, withdrawals, P2P escrow and swaps.</p>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    {cats.map(c => (
                        <button key={c} onClick={() => { setFilter(c); setOpen(0); }}
                            style={{
                                padding: '0.4rem 0.9rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                                border: '1px solid rgba(255,255,255,0.15)',
                                background: filter === c ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,0.05)',
                                color: '#fff',
                            }}>{c}</button>
                    ))}
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
                    {list.map((f, i) => (
                        <div key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                            <button onClick={() => setOpen(open === i ? -1 : i)}
                                style={{ width: '100%', textAlign: 'left', padding: '1.1rem 1.4rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a1d29' }}><span style={{ color: '#6366F1', fontSize: '0.75rem', marginRight: '0.5rem' }}>{f.cat.toUpperCase()}</span>{f.q}</span>
                                <span style={{ color: '#6366F1', fontWeight: 800 }}>{open === i ? '−' : '+'}</span>
                            </button>
                            {open === i && <p style={{ padding: '0 1.4rem 1.2rem', fontSize: '0.9rem', lineHeight: 1.7, color: '#2b2f3a', margin: 0 }}>{f.a}</p>}
                        </div>
                    ))}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.4rem', marginTop: '1.5rem', textAlign: 'center' }}>
                    <p style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '1rem' }}>Still stuck? Open Brivo Agent in the app or write to support.</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" className="bv-btn-gradient">Start Trading</Link>
                        <Link to="/landing" className="bv-btn-outline">Back to Catalog</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
