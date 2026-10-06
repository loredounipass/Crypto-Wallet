import React from 'react'
import { Link } from 'react-router-dom'
import CommentsPanel from './CommentsPanel'
import FeedCarousel from './FeedCarousel'
import NewChatDialog from '../chat/NewChatDialog'
import { ConfirmToast } from '../toasts/Toast'
import { AuthContext } from '../../hooks/AuthContext'
import UserAvatar from '../common/UserAvatar'
import { use } from 'react'
import useFeedItemLogic from './useFeedItemLogic'

const EMPTY_ACTIONS = {};

export default function FeedItem({ post, actions = EMPTY_ACTIONS }) {
  const { auth } = use(AuthContext)
  const { deletePost, updatePost, addComment, joinPost, getComments, likeComment, unlikeComment } = actions
  const {
    isMyPost, following, followLoading, handleFollow, handleUnfollow,
    liked, localLikes, showComments, setShowComments, localShares, shareBusy,
    shareFeedback, shareDialogOpen, setShareDialogOpen, showDeleteConfirm,
    setShowDeleteConfirm, containerRef, displayName, authorHandle, shareUrl, mediaUrls,
    timeStr, handleLike, handleShare
  } = useFeedItemLogic({ post, actions, auth });

  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [editError, setEditError] = React.useState('');

  if (!post) return null
  const {
    description,
    multimediaUrl,
    commentsCount, views,
  } = post

  const startEditing = () => {
    setDraft(description || '');
    setEditError('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditError('');
  };

  const saveEditing = async () => {
    const text = draft.trim();
    if (!text || saving) return;
    setSaving(true);
    setEditError('');
    try {
      await updatePost(post._id, { description: text });
      setIsEditing(false);
    } catch (_) {
      setEditError('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fb-card" ref={containerRef}>

        <div className="fb-reddit-body">
        {/* ── Meta: avatar + u/autor · tiempo ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '0.5rem', padding: '0.7rem 0.9rem 0.5rem',
        }}>
          <Link
            to={post.author ? `/profile/${post.author}` : '/profile'}
            className="fb-avatar-ring"
            style={{ textDecoration: 'none', flexShrink: 0 }}
            aria-label={isMyPost ? 'Ir a mi perfil' : `Ver perfil de ${displayName}`}
          >
            <UserAvatar
              user={{
                _id: String(post.author || ''),
                firstName: post.authorFirstName,
                lastName: post.authorLastName,
              }}
              size={28}
            />
          </Link>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <Link to={post.author ? `/profile/${post.author}` : '/profile'} style={{ textDecoration: 'none', color: 'inherit' }} title={displayName}>
              <span className="fb-author" style={{ fontSize: 13 }}>{authorHandle}</span>
            </Link>
            <span className="fb-time">· {timeStr}</span>
            {!isMyPost && (
              <button
                onClick={following ? handleUnfollow : handleFollow}
                disabled={followLoading}
                style={{
                  fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                  border: following ? '1.5px solid var(--fn-border)' : '1.5px solid var(--fn-teal)',
                  background: following ? 'transparent' : 'var(--fn-teal)',
                  color: following ? 'var(--fn-muted)' : '#FFFFFF',
                  cursor: followLoading ? 'wait' : 'pointer',
                  transition: 'all 0.18s', whiteSpace: 'nowrap', lineHeight: 1.6,
                }}
                aria-label={following ? 'Dejar de seguir' : 'Seguir'}
              >
                {following ? 'Siguiendo' : '+ Seguir'}
              </button>
            )}
          </div>
          {isMyPost && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              {updatePost && !isEditing && (
                <button
                  onClick={startEditing}
                  className="fb-edit-btn"
                  title="Editar publicación"
                  aria-label="Editar publicación"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </button>
              )}
              {deletePost && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="fb-delete-btn"
                  title="Eliminar publicación"
                  aria-label="Eliminar publicación"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Description / inline editor ── */}
        {isEditing ? (
          <div style={{ padding: '0 0.9rem 0.7rem' }}>
            <textarea
              className="fb-post-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              autoFocus
              style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            {editError && (
              <div style={{ color: '#F87171', fontSize: 12, marginTop: 6 }}>{editError}</div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" style={{ marginTop: 0 }} onClick={cancelEditing} disabled={saving}>
                Cancelar
              </button>
              <button
                type="button"
                className="fb-btn-primary"
                onClick={saveEditing}
                disabled={saving || !draft.trim()}
              >
                {saving ? '…' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          description && (
            <div style={{ padding: '0 0.9rem 0.7rem' }}>
              <p className="fb-desc">{description}</p>
            </div>
          )
        )}

        {/* ── Media: carrusel si hay varias fotos ── */}
        {mediaUrls && mediaUrls.length > 0 && (
          <div className="fb-media">
            <FeedCarousel urls={mediaUrls} />
          </div>
        )}

        {/* ── Processing indicator ── */}
        {post.multimediaStatus === 'processing' && !multimediaUrl && (
          <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', color: 'var(--fn-primary)', fontSize: '13px' }}>
            ⏳ Procesando archivo adjunto...
          </div>
        )}

        {/* ── Action pills ── */}
        <div className="fb-actions">
          <button onClick={handleLike} className={liked ? 'liked' : ''} aria-label={liked ? 'Quitar me gusta' : 'Me gusta'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{localLikes}</span>
          </button>
          <button onClick={() => setShowComments(true)} aria-label="Comentar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>{commentsCount || 0}</span>
          </button>
          <button onClick={handleShare} className={shareFeedback ? 'shared' : ''} disabled={shareBusy} aria-label="Compartir">
            {shareFeedback ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            )}
            <span>{(localShares || 0) > 0 ? `${localShares}` : ''}</span>
          </button>
          {(typeof views === 'number' ? views : 0) > 0 && (
            <span className="fb-views">
              {typeof views === 'number' ? views : 0} vista{views !== 1 ? 's' : ''}
            </span>
          )}
        </div>
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
