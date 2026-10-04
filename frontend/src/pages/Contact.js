import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', subject: 'Support', message: '' });
    const [sent, setSent] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Stub: no backend endpoint yet. Show confirmation only.
        setSent(true);
    };

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
                <p style={{ textAlign: 'center', fontSize: '0.75rem', letterSpacing: '3px', fontWeight: 700, color: '#fff', marginBottom: '0.6rem' }}>BRIVOTRUST — CONTACT</p>
                <h1 style={{ textAlign: 'center', fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Contact Us</h1>
                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#fff', marginBottom: '1.5rem' }}>Support hours: 8am – 6pm. For P2P disputes use the order chat so evidence stays attached.</p>

                <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', padding: '1.6rem' }}>
                    {sent ? (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <h3 style={{ color: '#1a1d29', marginBottom: '0.5rem' }}>Message received</h3>
                            <p style={{ color: '#2b2f3a', fontSize: '0.9rem' }}>Thanks {form.name || 'there'}. We will reply to {form.email || 'your email'} soon.</p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                                <Link to="/help" className="bv-btn-gradient">Visit Help Center</Link>
                                <Link to="/landing" className="bv-btn-outline" style={{ color: '#333' }}>Back to Catalog</Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#1a1d29' }}>
                                    Name
                                    <input name="name" value={form.name} onChange={handleChange} required placeholder="Your name"
                                        style={{ padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.15)', fontSize: '0.9rem' }} />
                                </label>
                                <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#1a1d29' }}>
                                    Email
                                    <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@email.com"
                                        style={{ padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.15)', fontSize: '0.9rem' }} />
                                </label>
                            </div>
                            <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#1a1d29' }}>
                                Subject
                                <select name="subject" value={form.subject} onChange={handleChange}
                                    style={{ padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.15)', fontSize: '0.9rem' }}>
                                    <option>Support</option>
                                    <option>Wallets</option>
                                    <option>P2P / Disputes</option>
                                    <option>Privacy</option>
                                    <option>Other</option>
                                </select>
                            </label>
                            <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#1a1d29' }}>
                                Message
                                <textarea name="message" value={form.message} onChange={handleChange} required rows={5} placeholder="How can we help?"
                                    style={{ padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.15)', fontSize: '0.9rem', resize: 'vertical' }} />
                            </label>
                            <button type="submit" className="bv-btn-gradient" style={{ border: 'none', cursor: 'pointer' }}>Send Message</button>
                        </form>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <Link to="/help" className="bv-btn-outline">Help Center</Link>
                    <Link to="/about" className="bv-btn-outline">About</Link>
                    <Link to="/landing" className="bv-btn-outline">Back to Catalog</Link>
                </div>
            </section>
        </div>
    );
}
