import React from 'react'
import { Link } from 'react-router-dom'
import useFeedListLogic from './useFeedListLogic'
import FeedItem from './FeedItem'
import PostForm from './PostForm'
import LeftSidebar from './LeftSidebar'
import FeedExtrasDrawer, { toggleFeedExtras } from './FeedExtrasDrawer'
import './FeedStyles.css'


export default function FeedList() {
  const {
    posts, loading, error, hasMore, loadingMore, actions, lastPostRef
  } = useFeedListLogic()
  const [showPostDialog, setShowPostDialog] = React.useState(false)
  const [formInView, setFormInView] = React.useState(true)
  const [isMobileView, setIsMobileView] = React.useState(() => window.innerWidth <= 640)
  const [showPanelBtn, setShowPanelBtn] = React.useState(() => window.innerWidth < 1024)
  const formWrapRef = React.useRef(null)

  React.useEffect(() => {
    const onResize = () => {
      setIsMobileView(window.innerWidth <= 640);
      setShowPanelBtn(window.innerWidth < 1024);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [])

  /* La cruz solo aparece cuando el form sale por completo de pantalla */
  React.useEffect(() => {
    if (isMobileView) return;
    const el = formWrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => setFormInView(entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isMobileView])

  React.useEffect(() => {
    if (!showPostDialog) return
    const onKey = (e) => { if (e.key === 'Escape') setShowPostDialog(false) };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPostDialog])

  return (
    <>
      <div className="fb-left-sidebar-fixed">
        <LeftSidebar />
      </div>
      <FeedExtrasDrawer />

      <div className="fb-list-wrapper">
        {/* Mini navbar del feed */}
        <div
          className="fb-mini-nav"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 10, background: '#12121E',
            border: '1px solid #1F1F2E', borderRadius: 16,
            padding: '10px 14px', marginBottom: 10,
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 30, height: 30, flexShrink: 0,
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                background: "linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #3B82F6 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#FFFFFF", fontWeight: 800, fontSize: 15, lineHeight: 1,
              }}
            >
              B
            </div>
            <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Brivo Forum
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Link
              to="/wallets"
              aria-label="Mis billeteras"
              title="Mis billeteras"
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'transparent', border: '1px solid #23233A',
                color: '#9CA3AF', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', textDecoration: 'none',
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#C4B5FD'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#23233A'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7a2 2 0 0 1 2-2h14v4H5a2 2 0 1 0 0 4h14v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                <circle cx="16" cy="11" r="1" />
              </svg>
            </Link>
            <Link
              to="/marketplace"
              aria-label="Marketplace"
              title="Marketplace"
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'transparent', border: '1px solid #23233A',
                color: '#9CA3AF', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', textDecoration: 'none',
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#C4B5FD'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#23233A'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </Link>
            <Link
              to="/p2p"
              aria-label="Vender P2P"
              title="Vender P2P"
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'transparent', border: '1px solid #23233A',
                color: '#9CA3AF', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', textDecoration: 'none',
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#C4B5FD'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#23233A'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 7h10" />
                <path d="M14 4l3 3-3 3" />
                <path d="M17 17H7" />
                <path d="M10 14l-3 3 3 3" />
              </svg>
            </Link>
            {showPanelBtn && (
              <button
                type="button"
                onClick={toggleFeedExtras}
                aria-label="Abrir panel del feed"
                title="Donaciones, links y contactos"
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'transparent', border: '1px solid #23233A',
                  color: '#9CA3AF', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#C4B5FD'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#23233A'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {!isMobileView && <div className="fb-post-inline" ref={formWrapRef}><PostForm /></div>}

        {loading && (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="fb-skeleton-card" aria-hidden="true">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div className="fb-skeleton-line" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div className="fb-skeleton-line" style={{ height: 12, width: '40%', marginBottom: 8 }} />
                    <div className="fb-skeleton-line" style={{ height: 10, width: '25%' }} />
                  </div>
                </div>
                <div className="fb-skeleton-line" style={{ height: 12, marginBottom: 8 }} />
                <div className="fb-skeleton-line" style={{ height: 12, width: '70%' }} />
              </div>
            ))}
          </>
        )}

        {!loading && error && (
          <div className="fb-empty" style={{ borderColor: '#F87171' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
            Error al cargar el feed. Intenta recargar la página.
            <br />
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 12, padding: '8px 20px',
                background: 'linear-gradient(135deg, var(--fn-teal), var(--fn-blue))',
                border: 'none', borderRadius: 20, color: '#fff',
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && posts && posts.length === 0 && (
          <div className="fb-empty">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌐</div>
            No hay publicaciones aún. ¡Sé el primero en publicar!
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {posts && posts.map((p, index) => (
            <div key={p._id} ref={index === posts.length - 1 ? lastPostRef : null}>
              <FeedItem
                post={p}
                actions={actions}
              />
            </div>
          ))}
        </div>
        {loadingMore && (
          <div className="fb-skeleton-bar" aria-hidden="true" />
        )}
        {!hasMore && posts && posts.length > 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--fn-muted)', fontSize: 13 }}>
            Has llegado al final 🏁
          </div>
        )}
      </div>

      {/* FAB crear publicación: siempre en móvil, en desktop solo con el form fuera de vista */}
      {(isMobileView || !formInView) && (
      <button
        type="button"
        onClick={() => setShowPostDialog(true)}
        aria-label="Crear publicación"
        title="Crear publicación"
        style={{
          position: 'fixed', right: 20, bottom: 152, zIndex: 10001,
          width: 56, height: 56, borderRadius: '50%', border: 'none',
          background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
          color: '#FFFFFF', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 28px rgba(168,85,247,0.45)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      )}

      {/* Diálogo crear publicación */}
      {showPostDialog && (
        <div
          className="fb-post-dialog"
          onClick={() => setShowPostDialog(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10002,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
            padding: 16, boxSizing: 'border-box',
          }}
        >
          <style>{`
            .fb-post-dialog .fb-post-form {
              position: static !important;
              margin-bottom: 0 !important;
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              -webkit-backdrop-filter: none !important;
              backdrop-filter: none !important;
            }
          `}</style>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 560, borderRadius: 20, padding: 24,
              background: '#12121E',
              border: '1px solid #1F1F2E',
              boxShadow: '0 10px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(168,85,247,0.08)',
              maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>
                Crear publicación
              </h3>
              <button
                type="button"
                onClick={() => setShowPostDialog(false)}
                aria-label="Cerrar"
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#9CA3AF', fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>
            <PostForm />
          </div>
        </div>
      )}
    </>
  )
}
