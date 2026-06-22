import React, { useContext, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { AuthContext } from '../../hooks/AuthContext';
import UserAvatar from '../common/UserAvatar';

/* ── Inline SVG Icons ── */

const IconExplore = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
);
const IconSettings = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);


export default function LeftSidebar() {
  const { auth } = useContext(AuthContext);
  const [copied, setCopied] = useState({ btc: false, usdt: false });
  const history = useHistory();

  const wallets = { btc: '', usdt: '' };
  const btcAddress = wallets.btc;
  const usdtAddress = wallets.usdt;

  const copyToClipboard = async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied((p) => ({ ...p, [key]: true }));
      setTimeout(() => setCopied((p) => ({ ...p, [key]: false })), 2000);
    } catch (err) {
      console.error('copy failed', err);
    }
  };

  const first = auth?.firstName || '';
  const last = auth?.lastName || '';
  const name = `${first} ${last}`.trim() || auth?.username || 'Usuario';

  const nav = (path) => {
    try { history.push(path); } catch (_) {}
  };

  const navItems = [
    { icon: <IconExplore />, label: 'Activity', path: '/activity' },
    { icon: <IconSettings />, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="fb-left-sidebar" style={{padding:'0.5rem', display:'flex', flexDirection:'column', gap:12}}>
      <button
        type="button"
        onClick={() => nav('/profile')}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit', textAlign: 'left' }}
        aria-label="Ir a mi perfil"
      >
        <UserAvatar user={auth} size={40} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, color: 'var(--fn-text)', fontSize: 14 }}>{name}</div>
        </div>
      </button>

      <div style={{ borderTop: '1px solid var(--fn-border)', paddingTop: 8 }} />

      <div style={{display:'flex', flexDirection:'column', gap:4}}>
        {navItems.map(item => (
          <button
            key={item.path}
            onClick={() => nav(item.path)}
            style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'8px 10px', background:'transparent', border:'none',
              color:'var(--fn-text)', cursor:'pointer', borderRadius:8, textAlign:'left',
              transition: 'background 0.15s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label={item.label}
          >
            <span style={{
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              width: 36, height: 36, borderRadius: 8,
              background: item.gradient ? 'linear-gradient(135deg, var(--fn-teal), var(--fn-blue))' : 'transparent',
              color: item.gradient ? '#04111a' : 'var(--fn-teal)',
            }}>{item.icon}</span>
            <span style={{fontSize:15, fontWeight:600}}>{item.label}</span>
          </button>
        ))}
      </div>

      <hr style={{ borderColor: 'var(--fn-border)', margin: '16px 0' }} />

      <div style={{padding:'0 0.25rem', display:'flex', flexDirection:'column', gap:8}}>
        <div style={{fontSize:12, color:'var(--fn-muted)', fontWeight:600}}>Apoya a la comunidad crypto</div>
        <div style={{fontSize:12, color:'var(--fn-muted)'}}>Contribuye con una donación para mantener la plataforma.</div>

        <div style={{display:'flex', flexDirection:'column', gap:8, marginTop:6}}>
          {/* BTC */}
          <div style={{display:'flex', alignItems:'center', gap:8, padding:'0.45rem', borderRadius:8, border:'1px solid var(--fn-border)'}}>
            <div style={{width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(180deg,#F7931A,#E2761B)', flexShrink:0}}>
              <span style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>BTC</span>
            </div>
            <div style={{display:'flex', flexDirection:'column', minWidth:0, flex:1}}>
              <div style={{fontSize:13, fontWeight:700, color:'var(--fn-text)'}}>Bitcoin</div>
              <div style={{display:'flex', alignItems:'center', gap:6}}>
                <div style={{fontSize:12, color:'var(--fn-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120}}>{btcAddress || 'No configurado'}</div>
                {btcAddress && (
                  <button onClick={() => copyToClipboard(btcAddress, 'btc')} aria-label="copy-btc" style={{background:'transparent', border:'none', cursor:'pointer', color:'var(--fn-muted)', display:'inline-flex'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="9" y="9" width="11" height="11" rx="2" ry="2"/><path d="M15 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /></svg>
                  </button>
                )}
                {copied.btc && <span style={{fontSize:12, color:'var(--fn-teal)'}}>Copiado</span>}
              </div>
            </div>
          </div>

          {/* USDT */}
          <div style={{display:'flex', alignItems:'center', gap:8, padding:'0.45rem', borderRadius:8, border:'1px solid var(--fn-border)'}}>
            <div style={{width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(180deg,#22c1c3,#1e90ff)', flexShrink:0}}>
              <span style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>USDT</span>
            </div>
            <div style={{display:'flex', flexDirection:'column', minWidth:0, flex:1}}>
              <div style={{fontSize:13, fontWeight:700, color:'var(--fn-text)'}}>USDT</div>
              <div style={{display:'flex', alignItems:'center', gap:6}}>
                <div style={{fontSize:12, color:'var(--fn-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120}}>{usdtAddress || 'No configurado'}</div>
                {usdtAddress && (
                  <button onClick={() => copyToClipboard(usdtAddress, 'usdt')} aria-label="copy-usdt" style={{background:'transparent', border:'none', cursor:'pointer', color:'var(--fn-muted)', display:'inline-flex'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="9" y="9" width="11" height="11" rx="2" ry="2"/><path d="M15 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /></svg>
                  </button>
                )}
                {copied.usdt && <span style={{fontSize:12, color:'var(--fn-teal)'}}>Copiado</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
