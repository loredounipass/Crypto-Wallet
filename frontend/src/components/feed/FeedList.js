import React from 'react'
import useFeed from '../../hooks/useFeed'
import FeedItem from './FeedItem'
import PostForm from './PostForm'
import RightSidebar from './RightSidebar'
import LeftSidebar from './LeftSidebar'
import './FeedStyles.css'


export default function FeedList() {
  const {
    posts, loading,
    likePost, unlikePost,
    addComment, joinPost, viewPost,
    getComments, likeComment, unlikeComment,
    sharePost
  } = useFeed()

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

        {!loading && posts && posts.length === 0 && (
          <div className="fb-empty">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌐</div>
            No hay publicaciones aún. ¡Sé el primero en publicar!
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {posts && posts.map((p) => (
            <FeedItem
              key={p._id}
              post={p}
              actions={{ likePost, unlikePost, addComment, joinPost, viewPost, getComments, likeComment, unlikeComment, sharePost }}
            />
          ))}
        </div>
      </div>

      <div className="fb-right-sidebar-fixed">
        <RightSidebar />
      </div>
    </>
  )
}
