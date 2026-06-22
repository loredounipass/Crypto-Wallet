import React, { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { mediaBase, apiOrigin } from '../../api/http'
import CommentsPanel from './CommentsPanel'
import NewChatDialog from '../chat/NewChatDialog'
import { AuthContext } from '../../hooks/AuthContext'
import UserAvatar from '../common/UserAvatar'


export default function FeedItem({ post, actions = {} }) {
  const { likePost, unlikePost, addComment, joinPost, viewPost, getComments, likeComment, unlikeComment, sharePost } = actions
  const { auth } = useContext(AuthContext)
  const isMyPost = post && auth?._id && String(post.author) === String(auth._id)

  // ── Follow state (placeholder) ──
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const handleFollow = useCallback(async () => {
    if (followLoading || following) return
    setFollowLoading(true)
    try {
      // profileService.followUser(String(post.author))
      setFollowing(true)
    } catch (err) {
      console.error('[FeedItem] Error following user:', err)
    } finally { setFollowLoading(false) }
  }, [followLoading, following])

  const handleUnfollow = useCallback(async () => {
    if (followLoading || !following) return
    setFollowLoading(true)
    try {
      // profileService.unfollowUser(String(post.author))
      setFollowing(false)
    } catch (err) {
      console.error('[FeedItem] Error unfollowing user:', err)
    } finally { setFollowLoading(false) }
  }, [followLoading, following])

  const isLikedByMe = (p) => {
    if (!p || !auth?._id) return false
    return Array.isArray(p.likes) && p.likes.some(
      (id) => String(id) === String(auth._id)
    )
  }

  const [liked, setLiked]               = useState(() => isLikedByMe(post))
  const [localLikes, setLocalLikes]     = useState(post ? (post.likesCount || 0) : 0)
  const [showComments, setShowComments] = useState(false)
  const [localShares, setLocalShares]   = useState(post ? (post.shares || 0) : 0)
  const [shareBusy, setShareBusy]       = useState(false)
  const [shareFeedback, setShareFeedback] = useState('')
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const [viewed, setViewed]             = useState(false)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)

  // Sync liked state when post prop changes
  useEffect(() => {
    setLiked(isLikedByMe(post))
    setLocalLikes(post?.likesCount || 0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?._id, post?.likesCount, post?.likes, auth?._id])

  const togglePlay = useCallback(() => {
    try {
      const v = videoRef.current
      if (!v) return
      if (v.paused) {
        v.play().catch(() => {})
        setPlaying(true)
      } else {
        v.pause()
        setPlaying(false)
      }
    } catch (err) { console.error('[FeedItem] Toggle play error:', err) }
  }, [])

  const toggleMuteLocal = useCallback((e) => {
    try {
      if (e && e.stopPropagation) e.stopPropagation()
      const v = videoRef.current
      setMuted((m) => {
        const nm = !m
        try { if (v) v.muted = nm } catch (_) {}
        return nm
      })
    } catch (_) {}
  }, [])

  // IntersectionObserver for view tracking + autoplay
  useEffect(() => {
    if (!post || !post._id || typeof window === 'undefined') return
    const el = containerRef.current
    if (!el || viewed) return
    let obs
    try {
      obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting && e.intersectionRatio > 0.25 && !viewed) {
            try { if (viewPost) viewPost(post._id).catch(() => {}) } catch (_) {}
            setViewed(true)
          }
          try {
            const vid = videoRef.current
            if (vid) {
              if (e.isIntersecting && e.intersectionRatio >= 0.25) {
                vid.muted = true
                vid.play().catch(() => {})
              } else {
                vid.pause()
              }
            }
          } catch (_) {}
        })
      }, { threshold: [0.25, 0.5, 1] })
      obs.observe(el)
    } catch (_) {}
    return () => { try { if (obs && el) obs.unobserve(el) } catch (_) {} }
  }, [post, viewed, viewPost])

  if (!post) return null
  const {
    description, multimedia,
    authorFirstName, authorLastName,
    createdAt, thumbnailUrl, multimediaUrl,
    commentsCount, views,
  } = post

  const displayName = (authorFirstName || authorLastName)
    ? `${authorFirstName || ''} ${authorLastName || ''}`.trim()
    : 'Usuario'

  const meta = post.multimedia || {}
  const shareUrl = (typeof window !== 'undefined' && window.location)
    ? `${window.location.origin}/feed/${post._id}`
    : ''

  const resolveUrl = (u) => {
    if (!u) return null
    try {
      if (/^https?:\/\//i.test(u)) return u
      if (u.startsWith('/')) return `${apiOrigin}${u}`
      return `${mediaBase}/${u}`
    } catch (_) { return u }
  }

  const mediaUrl =
    resolveUrl(multimediaUrl) ||
    resolveUrl(thumbnailUrl) ||
    (multimedia?.filename ? `${mediaBase}/${multimedia.filename}` : null)

  const isVideo = (() => {
    if (!mediaUrl) return false
    if (meta?.duration) return true
    if (multimedia?.mimetype?.startsWith('video/')) return true
    if (post.type === 'video') return true
    try { return !!mediaUrl.match(/\.(mp4|webm|ogg|mov|mkv)(\?|$)/i) } catch (_) { return false }
  })()

  const timeStr = createdAt
    ? new Date(createdAt).toLocaleString(undefined, {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : ''

  const handleLike = async () => {
    try {
      if (!liked) {
        setLiked(true)
        setLocalLikes(l => l + 1)
        const res = await likePost(post._id)
        const u = (res && res.data) ? res.data : res
        if (u && typeof u.likesCount === 'number') setLocalLikes(u.likesCount)
      } else {
        setLiked(false)
        setLocalLikes(l => Math.max(0, l - 1))
        const res = await unlikePost(post._id)
        const u = (res && res.data) ? res.data : res
        if (u && typeof u.likesCount === 'number') setLocalLikes(u.likesCount)
      }
    } catch (_) {}
  }

  const handleShare = async () => {
    if (shareBusy) return
    setShareBusy(true)
    try {
      if (sharePost) {
        const res = await sharePost(post._id)
        const u = (res && res.data) ? res.data : res
        setLocalShares((s) => (u && typeof u.shares === 'number') ? u.shares : s + 1)
        setShareFeedback('Compartido')
        setTimeout(() => setShareFeedback(''), 1800)
        try { setShareDialogOpen(true) } catch (_) {}
        return
      }
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        setLocalShares((s) => s + 1)
        setShareFeedback('Enlace copiado')
        setTimeout(() => setShareFeedback(''), 1800)
        return
      }
    } catch (_) {
      try { setShareFeedback('Error al compartir') } catch (_) {}
      setTimeout(() => setShareFeedback(''), 2200)
    } finally {
      setShareBusy(false)
    }
  }

  return (
    <>
      <div className="fb-card mb-4" ref={containerRef}>

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
            {isVideo ? (
              <div style={{ position: 'relative' }}>
                <video
                  ref={videoRef}
                  onClick={(e) => { e.stopPropagation(); togglePlay() }}
                  onTimeUpdate={(e) => {
                    try {
                      const v = e.currentTarget
                      if (v && v.duration) setProgress((v.currentTime / v.duration) * 100)
                    } catch (_) {}
                  }}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  muted={muted}
                  playsInline
                  autoPlay
                  loop
                  style={{ width: '100%', maxHeight: '480px', display: 'block', objectFit: 'contain', cursor: 'pointer' }}
                  poster={resolveUrl(thumbnailUrl)}
                >
                  <source src={mediaUrl} type={multimedia?.mimetype || 'video/mp4'} />
                </video>
                {!playing && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 6 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePlay() }}
                      aria-label="Reproducir"
                      style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.45)', border: 'none', width: 68, height: 68, borderRadius: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
                )}
                <button onClick={toggleMuteLocal} aria-label={muted ? 'Activar sonido' : 'Silenciar'} style={{ position: 'absolute', right: 12, top: 12, zIndex: 8, background: 'rgba(0,0,0,0.45)', border: 'none', width:36, height:36, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                  {muted ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19 8a5 5 0 0 1 0 8" /><path d="M15 5a9 9 0 0 1 0 14" /></svg>
                  )}
                </button>
                <div style={{ width: '100%', padding: '6px 12px', position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 7 }}>
                  <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.2)', cursor: 'pointer' }} onClick={(e) => {
                    try {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = e.clientX - rect.left
                      const pct = x / rect.width
                      const vid = videoRef.current
                      if (vid && vid.duration) vid.currentTime = pct * vid.duration
                      setProgress(pct * 100)
                    } catch (_) {}
                  }}>
                    <div style={{ width: `${progress}%`, height: '100%', borderRadius: 6, background: 'linear-gradient(90deg, var(--fn-teal), var(--fn-blue))' }} />
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={mediaUrl}
                alt="media"
                style={{ width: '100%', maxHeight: '480px', display: 'block', objectFit: 'contain' }}
              />
            )}
          </div>
        )}

        {/* ── Processing indicator ── */}
        {post.multimediaStatus === 'processing' && !multimediaUrl && (
          <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', color: 'var(--fn-primary)', fontSize: '13px' }}>
            ⏳ Procesando archivo adjunto...
          </div>
        )}

        {/* ── Stats row ── */}
        <div className="fb-stats">
          <span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"
              style={{ color: liked ? '#22c1c3' : undefined }}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {localLikes} {localLikes === 1 ? 'like' : 'likes'}
          </span>
          <span style={{ cursor: 'pointer' }} onClick={() => setShowComments(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {commentsCount || 0} comentario{commentsCount !== 1 ? 's' : ''}
          </span>
          <span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 3v13"/><path d="M8 7l4-4 4 4"/>
            </svg>
            {localShares || 0} compartido{(localShares || 0) !== 1 ? 's' : ''}
          </span>
          {isVideo && (
            <span style={{ marginLeft: 'auto' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {typeof views === 'number' ? views : 0} vista{views !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div className="fb-actions">
          <button onClick={handleLike} className={liked ? 'liked' : ''} aria-label={liked ? 'Quitar like' : 'Me gusta'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button onClick={() => setShowComments(true)} aria-label="Comentar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button onClick={handleShare} className={shareFeedback ? 'shared' : ''} disabled={shareBusy} aria-label="Compartir">
            {shareFeedback ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
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
        onSelectUser={() => {}}
        currentUserId={auth?._id}
        shareUrl={shareUrl}
      />
    </>
  )
}
