import React from 'react'
import { Link } from 'react-router-dom'
import { mediaBase, apiOrigin } from '../../api/http'
import CommentsPanel from './CommentsPanel'
import NewChatDialog from '../chat/NewChatDialog'
import { ConfirmToast } from '../toasts/Toast'
import { AuthContext } from '../../hooks/AuthContext'
import UserAvatar from '../common/UserAvatar'
import { use } from 'react'
import useFeedItemLogic from './useFeedItemLogic'

const EMPTY_ACTIONS = {};

const resolveUrl = (u) => {
  if (!u) return null
  try {
    if (/^https?:\/\//i.test(u)) return u
    if (u.startsWith('/')) return `${apiOrigin}${u}`
    return `${mediaBase}/${u}`
  } catch (_) { return u }
}

export default function FeedItem({ post, actions = EMPTY_ACTIONS }) {
  const { auth } = use(AuthContext)
  const { likePost, unlikePost, deletePost, addComment, joinPost, viewPost, getComments, likeComment, unlikeComment, sharePost } = actions
  const { auth } = use(AuthContext)
  const {
    isMyPost, following, followLoading, handleFollow, handleUnfollow,
    liked, localLikes, showComments, setShowComments, localShares, shareBusy,
    shareFeedback, shareDialogOpen, setShareDialogOpen, showDeleteConfirm,
    setShowDeleteConfirm, containerRef, displayName, shareUrl, mediaUrl,
    timeStr, handleLike, handleShare
  } = useFeedItemLogic({ post, actions, auth });

  if (!post) return null
  const {
    description, multimedia,
    authorFirstName, authorLastName,
    createdAt, thumbnailUrl, multimediaUrl,
    commentsCount, views,
  } = post

  return (
    <>
      <div className="fb-card" ref={containerRef}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '0.75rem', padding: '1rem 1.25rem 0.85rem',
        }}>
          <Link
            to={post.author ? `/profile/${post.author}` : '/profile'}
            style={{ textDecoration: 'none', flexShrink: 0 }}
            aria-label={isMyPost ? 'Ir a mi perfil' : `Ver perfil de ${displayName}`}
          >
            <UserAvatar
              user={{
                _id: String(post.author || ''),
                firstName: post.authorFirstName,
                lastName: post.authorLastName,
              }}
              size={40}
            />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link to={post.author ? `/profile/${post.author}` : '/profile'} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="fb-author">{displayName}</div>
              </Link>
              {!isMyPost && (
                <button
                  onClick={following ? handleUnfollow : handleFollow}
                  disabled={followLoading}
                  style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                    border: following ? '1.5px solid var(--fn-border)' : '1.5px solid var(--fn-teal)',
                    background: following ? 'transparent' : 'var(--fn-teal)',
                    color: following ? 'var(--fn-muted)' : '#04111a',
                    cursor: followLoading ? 'wait' : 'pointer',
                    transition: 'all 0.18s', whiteSpace: 'nowrap', lineHeight: 1.6,
                  }}
                  aria-label={following ? 'Dejar de seguir' : 'Seguir'}
                >
                  {following ? 'Siguiendo' : '+ Seguir'}
                </button>
              )}
            </div>
            <div className="fb-time">{timeStr}</div>
          </div>
          {isMyPost && deletePost && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                background: 'transparent', border: 'none', color: 'var(--fn-muted)', cursor: 'pointer', padding: '8px', fontSize: '1.2rem',
                opacity: 0.7, transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
              title="Eliminar publicación"
            >
              🗑️
            </button>
          )}
        </div>

        {/* ── Description ── */}
        {description && (
          <div style={{ padding: '0 1.25rem 1rem' }}>
            <p className="fb-desc">{description}</p>
          </div>
        )}

        {/* ── Media ── */}
        {mediaUrl && (
          <div className="fb-media">
            <img
              src={mediaUrl}
              alt="media"
              loading="lazy"
              onError={(e) => {
                const img = e.currentTarget;
                const retries = parseInt(img.dataset.retries || '0');
                if (retries < 3) {
                  img.dataset.retries = retries + 1;
                  setTimeout(() => {
                    img.src = mediaUrl + (mediaUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
                  }, 1500);
                } else {
                  img.onerror = null;
                  img.style.display = 'none';
                  if (!img.nextSibling || img.nextSibling.className !== 'img-error-msg') {
                    img.insertAdjacentHTML('afterend',
                      '<div class="img-error-msg" style="padding:24px;text-align:center;color:#a0a0a0;font-size:13px">⚠️ Imagen procesando, por favor recarga la página.</div>'
                    );
                  }
                }
              }}
              style={{ width: '100%', height: 'auto', maxHeight: '800px', display: 'block', objectFit: 'contain' }}
            />
          </div>
        )}

        {/* ── Processing indicator ── */}
        {post.multimediaStatus === 'processing' && !multimediaUrl && (
          <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', color: 'var(--fn-primary)', fontSize: '13px' }}>
            ⏳ Procesando archivo adjunto...
          </div>
        )}

        {/* ── Stats row ── */}
        {(localLikes > 0 || (commentsCount || 0) > 0 || (localShares || 0) > 0 || (typeof views === 'number' ? views : 0) > 0) && (
          <div className="fb-stats">
            <div className="fb-stats-left">
              {localLikes > 0 && (
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"
                    style={{ color: liked ? '#22c1c3' : undefined }}>
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  {localLikes} {localLikes === 1 ? 'like' : 'likes'}
                </span>
              )}
              {(commentsCount || 0) > 0 && (
                <span style={{ cursor: 'pointer' }} onClick={() => setShowComments(true)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {commentsCount || 0} comentario{commentsCount !== 1 ? 's' : ''}
                </span>
              )}
              {(localShares || 0) > 0 && (
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M12 3v13" /><path d="M8 7l4-4 4 4" />
                  </svg>
                  {localShares || 0} compartido{(localShares || 0) !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {(typeof views === 'number' ? views : 0) > 0 && (
              <span className="fb-stats-views">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
                {typeof views === 'number' ? views : 0} vista{views !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* ── Action buttons ── */}
        <div className="fb-actions">
          <button onClick={handleLike} className={liked ? 'liked' : ''} aria-label={liked ? 'Quitar like' : 'Me gusta'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <button onClick={() => setShowComments(true)} aria-label="Comentar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button onClick={handleShare} className={shareFeedback ? 'shared' : ''} disabled={shareBusy} aria-label="Compartir">
            {shareFeedback ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Comments slide-in panel ── */}
      <CommentsPanel
        post={post}
        open={showComments}
        onClose={() => setShowComments(false)}
        addComment={addComment}
        getComments={getComments}
        joinPost={joinPost}
        likeComment={likeComment}
        unlikeComment={unlikeComment}
      />

      <NewChatDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        onSelectUser={() => { }}
        currentUserId={auth?._id}
        shareUrl={shareUrl}
      />

      {showDeleteConfirm && (
        <ConfirmToast
          message="¿Seguro que deseas eliminar esta publicación?"
          onConfirm={() => {
            setShowDeleteConfirm(false);
            deletePost(post._id);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}
