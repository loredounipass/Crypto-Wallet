import React, { useRef, useCallback } from 'react'
import useFeed from '../../hooks/useFeed'
import FeedItem from './FeedItem'
import PostForm from './PostForm'
import RightSidebar from './RightSidebar'
import LeftSidebar from './LeftSidebar'
import './FeedStyles.css'


export default function FeedList() {
  const {
    posts, loading, error,
    loadMore, hasMore, loadingMore,
    likePost, unlikePost,
    addComment, joinPost, viewPost,
    getComments, likeComment, unlikeComment,
    sharePost
  } = useFeed()

  const observer = useRef(null);
  const lastPostRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        if (loadMore) loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, loadMore]);

  return (
    <>
      <div className="fb-left-sidebar-fixed">
        <LeftSidebar />
      </div>

      <div className="fb-list-wrapper">
        <PostForm />

        {loading && (
          <div className="fb-loading">Cargando publicaciones</div>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {posts && posts.map((p, index) => (
            <div key={p._id} ref={index === posts.length - 1 ? lastPostRef : null}>
              <FeedItem
                post={p}
                actions={{ likePost, unlikePost, addComment, joinPost, viewPost, getComments, likeComment, unlikeComment, sharePost }}
              />
            </div>
          ))}
        </div>
        {loadingMore && (
          <div className="fb-loading">Cargando más publicaciones...</div>
        )}
        {!hasMore && posts && posts.length > 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--fn-muted)', fontSize: 13 }}>
            Has llegado al final 🏁
          </div>
        )}
      </div>

      <div className="fb-right-sidebar-fixed">
        <RightSidebar />
      </div>
    </>
  )
}
