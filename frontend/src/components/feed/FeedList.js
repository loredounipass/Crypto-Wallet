import React from 'react'
import useFeedListLogic from './useFeedListLogic'
import FeedItem from './FeedItem'
import PostForm from './PostForm'
import LeftSidebar from './LeftSidebar'
import FeedExtrasDrawer from './FeedExtrasDrawer'
import './FeedStyles.css'


export default function FeedList() {
  const {
    posts, loading, error, hasMore, loadingMore, actions, lastPostRef, refetch
  } = useFeedListLogic()
  const [showPostDialog, setShowPostDialog] = React.useState(false)
  const [formInView, setFormInView] = React.useState(true)
  const formWrapRef = React.useRef(null)

  /* La cruz solo aparece cuando el form sale por completo de pantalla */
  React.useEffect(() => {
    const el = formWrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => setFormInView(entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [])

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
        <div className="fb-post-inline" ref={formWrapRef}><PostForm onCreated={() => refetch?.()} /></div>

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

      {/* FAB crear publicación: solo cuando el form sale de vista (top = form completo) */}
        {!formInView && (
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
            <PostForm onCreated={() => { setShowPostDialog(false); refetch?.(); }} />
          </div>
        </div>
      )}
    </>
  )
}
