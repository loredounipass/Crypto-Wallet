import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Section = ({ n, title, children }) => (
    <article style={{
        padding: '1.4rem 1.6rem',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
    }}>
        <h3 style={{
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: '#6366F1',
            marginBottom: '0.6rem',
        }}>{n}. {title}</h3>
        <p style={{
            fontSize: '0.92rem',
            lineHeight: 1.75,
            color: '#2b2f3a',
            textAlign: 'justify',
            margin: 0,
        }}>{children}</p>
    </article>
);

export default function Terms() {
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
                <p style={{ textAlign: 'center', fontSize: '0.75rem', letterSpacing: '3px', fontWeight: 700, color: '#fff', marginBottom: '0.6rem' }}>BRIVOTRUST — PRODUCT USE</p>
                <h1 style={{ textAlign: 'center', fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Terms & Conditions</h1>
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#fff', marginBottom: '0.3rem' }}>Product Use Terms</p>
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#fff', marginBottom: '2rem' }}>
                    Last updated: {new Date().getFullYear()} &nbsp;•&nbsp; Effective upon publication at /terms &nbsp;•&nbsp; English version prevails
                </p>

                <div style={{
                    background: '#ffffff',
                    color: '#1a1d29',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}>
                    <div style={{ padding: '1.6rem', background: '#f4f5fb', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                        <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#2b2f3a', margin: 0, textAlign: 'justify' }}>
                            <strong>How to use BrivoTrust.</strong> These terms explain how to use our products.
                            By creating an account, accessing the catalog, or using wallets, deposits, withdrawals, P2P escrow
                            or swaps, you accept these product terms in full. If you do not agree, do not use the platform.
                        </p>
                    </div>

                    <Section n="1" title="Eligibility and Account">
                        You must meet the required age in your jurisdiction to use BrivoTrust. You are responsible for credentials, 2FA, and activity under your account. Provide accurate verification data when acting as provider.
                    </Section>
                    <Section n="2" title="Custodial EVM Wallets">
                        BrivoTrust assigns custodial EVM deposit addresses from a pre-generated factory pool, per network and coin. Supported natives: BNB, AVAX, ETH, S, MATIC, OP. Supported ERC-20: USDT and USDC on configured chains. Private keys are held by the platform. Balances reflect confirmed on-chain credits only.
                    </Section>
                    <Section n="3" title="Deposits">
                        Native and ERC-20 deposits are detected by indexers and credited after the required confirmations (currently twelve). Transfers on wrong networks, to wrong addresses, or in unsupported assets may be permanently lost. No fiat gateways are offered.
                    </Section>
                    <Section n="4" title="Withdrawals">
                        Withdrawals are queued, signed and broadcast on-chain and complete only after network confirmations. You must cover amount plus gas and respect per-coin minimums and fees. Delays may occur from congestion, nonce handling, or security review. You bear the risk of incorrect destination addresses.
                    </Section>
                    <Section n="5" title="P2P Escrow Procedure">
                        Seller selects a verified provider, coin, amount, fiat amount and payment method. Provider must be verified with an enabled destination wallet and accepted method; seller must hold amount plus gas with a ten-dollar minimum. Stages: pending, funded in EscrowContract, buyer_paid upon fiat confirmation, released upon seller release, completed upon settlement. Orders expire by default after thirty minutes with automatic refund. Cancellation is limited to the seller in pending or funded states.
                    </Section>
                    <Section n="6" title="Disputes and Final Arbitration">
                        Funded or buyer_paid orders may be disputed by either party, recorded on-chain, and decided solely by administrators as revert to seller or award to provider. Such decisions are final within the platform. Preserve chat logs and payment evidence.
                    </Section>
                    <Section n="7" title="Providers, KYC and Conduct">
                        Providers shall submit full identity and address data and obtain approval before quoting. Off-platform payments, misrepresentation, or manipulation of escrow or chat shall result in suspension and forfeiture of disputed settlement.
                    </Section>
                    <Section n="8" title="Uniswap Swaps">
                        Swaps execute on-chain through the Uniswap router subject to liquidity, slippage and gas. No best-price or zero-fee warranty is given. Reverted transactions may still incur gas costs.
                    </Section>
                    <Section n="9" title="P2P Gas and Withdrawal Fee">
                        P2P: the seller pays the network gas for escrow funding. Each order shows its estimated gasFee before creation and the total charged is amount plus gasFee. The estimate is calculated from the live gas price with a safety margin, so it varies per network and congestion. No extra platform commission applies to P2P. Withdrawals: we apply only one low fixed network fee deducted from the amount you receive, with minimums per coin — BNB fee 0.005 min 0.01, AVAX fee 0.001 min 1, ETH fee 0.005 min 0.01, S fee 0.5 min 1, MATIC fee 0.1 min 13, OP fee 0.005 min 0.01. Deposits have no platform fee. You are solely responsible for tax reporting.
                    </Section>
                    <Section n="10" title="Risk Disclosure">
                        Digital assets are volatile and on-chain transfers are irreversible. This platform provides no financial advice.
                    </Section>
                    <Section n="11" title="Prohibited Use and Remedies">
                        Money laundering, fraud, sanctions evasion, and system abuse are prohibited. We may freeze, cancel, or reverse pending operations during investigation to the extent technically feasible.
                    </Section>
                    <Section n="12" title="Service Limits and Updates">
                        BrivoTrust is provided as is and may be affected by network congestion or third-party service status. Updates to these product terms take effect upon posting at /terms; continued use constitutes acceptance. Contact support via the Help Center.
                    </Section>
                    <Section n="13" title="AI Assistance">
                        We provide AI for general assistance via Brivo Agent and support chat to explain features such as deposits, withdrawals, wallets, and P2P orders. AI responses are informational only, may contain errors, and are not financial or investment guidance. Verify critical actions in the app guides before transacting.
                    </Section>

                    <div style={{ padding: '1.4rem 1.6rem', background: '#f4f5fb', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" className="bv-btn-gradient">Accept & Start Trading</Link>
                        <Link to="/landing" className="bv-btn-outline" style={{ color: '#333' }}>Back to Catalog</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
