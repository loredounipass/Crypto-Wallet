import React from 'react'
import useFeedListLogic from './useFeedListLogic'
import FeedItem from './FeedItem'
import PostForm from './PostForm'
import LeftSidebar from './LeftSidebar'
import FeedExtrasDrawer from './FeedExtrasDrawer'
import './FeedStyles.css'


export default function FeedList() {
  const {
    posts, loading, error, hasMore, loadingMore, actions, lastPostRef
  } = useFeedListLogic()

  return (
    <>
      <div className="fb-left-sidebar-fixed">
        <LeftSidebar />
      </div>
      <FeedExtrasDrawer />

      <div className="fb-list-wrapper">
        <PostForm />

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
          <div className="fb-empty" style={{ borderColor: '#EF4444' }}>
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
    </>
  )
}
