import React, { useState, useEffect, useRef, use } from 'react'
import { AuthContext } from '../../hooks/AuthContext'

/* ── helpers ── */
function initials(name) {
  if (!name) return '?'
  const p = name.trim().split(' ')
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name[0].toUpperCase()
}

function relativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)   return 'ahora mismo'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function sortByCreatedAtAsc(list) {
  const sortFn = (a, b) => {
    const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return da - db;
  };
  return list.toSorted ? list.toSorted(sortFn) : [...list].sort(sortFn);
}

/* ── component ── */
export default function CommentsPanel({ post, open, onClose, addComment, getComments, joinPost, likeComment, unlikeComment }) {
  const { auth } = use(AuthContext)
  const [comments, setComments]           = useState([])
  const [loading, setLoading]             = useState(false)
  const [text, setText]                   = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [error, setError]                 = useState(null)
  const [replyTo, setReplyTo]             = useState(null)
  const [expandedThreads, setExpandedThreads] = useState({})
  const bottomRef    = useRef(null)
  const inputRef     = useRef(null)
  const panelRef     = useRef(null)
  const listRef      = useRef(null)
  const prevCountRef = useRef(0)
  const isLikeUpdateRef = useRef(false)

  const toggleLike = async (comment) => {
    if (!auth || !auth._id) return
    const meId = String(auth._id)
    const liked = Array.isArray(comment.likes) && comment.likes.includes(meId)

    const list = listRef.current
    const savedScrollTop = list ? list.scrollTop : 0
    isLikeUpdateRef.current = true

    setComments(prev => prev.map(c =>
      c._id === comment._id
        ? ({
            ...c,
            likesCount: (c.likesCount || 0) + (liked ? -1 : 1),
            likes: liked
              ? (Array.isArray(c.likes) ? c.likes.filter(id => id !== meId) : [])
              : ([...(Array.isArray(c.likes) ? c.likes : []), meId]),
          })
        : c
    ))

    requestAnimationFrame(() => {
      if (list) list.scrollTop = savedScrollTop
    })

    try {
      if (liked) {
        if (typeof unlikeComment === 'function') await unlikeComment(comment._id, post._id)
      } else {
        if (typeof likeComment === 'function') await likeComment(comment._id, post._id)
      }
    } catch (err) {
      try { const fresh = await getComments(post._id); setComments(Array.isArray(fresh) ? fresh : []) } catch (_) {}
    }
  }

  /* lock body scroll while open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      inputRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  /* load comments whenever the panel opens */
  useEffect(() => {
    if (!open || !post?._id) return
    let mounted = true
    if (typeof joinPost === 'function') {
      try { joinPost(post._id) } catch (_) {}
    }
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getComments(post._id)
        if (mounted) setComments(Array.isArray(data) ? data : [])
      } catch (e) {
        if (mounted) setError('No se pudieron cargar los comentarios.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [open, post, getComments, joinPost])

  /* scroll to bottom when NEW comments arrive */
  useEffect(() => {
    if (!open || comments.length === 0) return
    if (isLikeUpdateRef.current) {
      isLikeUpdateRef.current = false
      return
    }
    const list = listRef.current
    const nearBottom = list
      ? (list.scrollHeight - list.scrollTop - list.clientHeight) < 80
      : true
    const isFirstLoad = prevCountRef.current === 0
    if (comments.length > prevCountRef.current && (nearBottom || isFirstLoad)) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
    }
    prevCountRef.current = comments.length
  }, [comments, open])

  /* close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const newComment = await addComment(post._id, text.trim(), replyTo?.id)
      setText('')
      if (replyTo?.id) {
        setExpandedThreads(prev => ({ ...prev, [String(replyTo.id)]: true }))
      }
      setReplyTo(null)

      const candidate = {
        _id: newComment?._id || Date.now().toString(),
        content: text.trim(),
        authorFirstName: auth?.firstName || '',
        authorLastName:  auth?.lastName  || '',
        author: auth?._id || 'me',
        parent: newComment?.parent || replyTo?.id || undefined,
        createdAt: new Date().toISOString(),
      }
      setComments(prev => [...prev, candidate])

      try {
        const fresh = await getComments(post._id)
        if (Array.isArray(fresh)) setComments(fresh)
      } catch (_) {}
    } catch (err) {
      setError('No se pudo enviar el comentario.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const sorted = sortByCreatedAtAsc(comments)
  const topLevel = sorted.filter(c => !c.parent)
  const childrenOf = (parentId) => sorted.filter(c => String(c.parent) === String(parentId))

  const renderComment = (c, depth = 0) => {
    const name = (c.authorFirstName || c.authorLastName)
      ? `${c.authorFirstName || ''} ${c.authorLastName || ''}`.trim()
      : 'Usuario'
    const meId = auth?._id ? String(auth._id) : null
    const liked = meId && Array.isArray(c.likes) && c.likes.includes(meId)
    const replies = childrenOf(c._id)
    const showReplies = expandedThreads[String(c._id)] !== false

    return (
      <div key={c._id} style={{ marginLeft: depth > 0 ? 20 : 0, marginBottom: 8 }}>
        <div style={{
          display: 'flex', gap: 8, padding: '8px 0',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981, #2186EB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0
          }}>
            {initials(name)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--fn-text)' }}>{name}</span>
              <span style={{ fontSize: 11, color: 'var(--fn-muted)' }}>{relativeTime(c.createdAt)}</span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--fn-text)', marginTop: 2 }}>{c.content}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button onClick={() => toggleLike(c)} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
                color: liked ? '#EF4444' : 'var(--fn-muted)',
                display: 'flex', alignItems: 'center', gap: 4
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {c.likesCount || 0}
              </button>
              <button onClick={() => { setReplyTo({ id: c._id, name }); inputRef.current?.focus() }} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--fn-muted)'
              }}>Responder</button>
            </div>
          </div>
        </div>
        {replies.length > 0 && showReplies && replies.map(r => renderComment(r, depth + 1))}
        {replies.length > 0 && !showReplies && (
          <button onClick={() => setExpandedThreads(prev => ({ ...prev, [String(c._id)]: true }))} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--fn-teal)', marginLeft: 36
          }}>Ver {replies.length} respuesta{replies.length > 1 ? 's' : ''}</button>
        )}
      </div>
    )
  }

  return (
    <>
      {/* backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 900
      }} />

      {/* panel */}
      <div ref={panelRef} style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 420,
        background: 'var(--fn-card, #151515)', borderLeft: '1px solid var(--fn-border)',
        zIndex: 901, display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.25s ease-out'
      }}>
        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: '1px solid var(--fn-border)'
        }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--fn-text)' }}>Comentarios</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--fn-muted)',
            cursor: 'pointer', fontSize: 22
          }}>&times;</button>
        </div>

        {/* comments list */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading && <div style={{ textAlign: 'center', color: 'var(--fn-muted)', padding: 20 }}>Cargando…</div>}
          {error && <div style={{ textAlign: 'center', color: '#EF4444', padding: 20 }}>{error}</div>}
          {!loading && !error && topLevel.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--fn-muted)', padding: 20 }}>Sé el primero en comentar</div>
          )}
          {topLevel.map(c => renderComment(c))}
          <div ref={bottomRef} />
        </div>

        {/* input */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex', gap: 8, padding: '12px 16px',
          borderTop: '1px solid var(--fn-border)', alignItems: 'center'
        }}>
          {replyTo && (
            <div style={{
              position: 'absolute', bottom: 54, left: 16, right: 16,
              fontSize: 12, color: 'var(--fn-teal)', display: 'flex', alignItems: 'center', gap: 6
            }}>
              Respondiendo a <b>{replyTo.name}</b>
              <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'var(--fn-muted)', cursor: 'pointer' }}>&times;</button>
            </div>
          )}
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un comentario…"
            disabled={submitting}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none',
              borderRadius: 20, padding: '10px 16px', color: 'var(--fn-text)',
              outline: 'none', fontSize: 14
            }}
          />
          <button type="submit" disabled={submitting || !text.trim()} style={{
            background: 'linear-gradient(135deg, var(--fn-teal), var(--fn-blue))',
            border: 'none', borderRadius: '50%', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: submitting || !text.trim() ? 'not-allowed' : 'pointer',
            opacity: submitting || !text.trim() ? 0.5 : 1
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </form>
      </div>
    </>
  )
}
