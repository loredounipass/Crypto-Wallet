import React, { useState, useEffect, useRef, use } from 'react'
import { AuthContext } from '../../hooks/AuthContext'
import UserAvatar from '../common/UserAvatar'
import { ConfirmToast } from '../toasts/Toast'

/* ── helpers ── */
function relativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `${Math.floor(diff / 86400)} d`
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

function snippet(text, max = 80) {
  if (!text) return ''
  const t = String(text).trim()
  return t.length > max ? t.slice(0, max) + '…' : t
}

/* ── instagram-like styles ── */
const S = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 900,
  },
  panel: {
    position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 420,
    background: '#000', borderLeft: '1px solid #262626',
    zIndex: 901, display: 'flex', flexDirection: 'column',
    animation: 'slideInRight 0.25s ease-out',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '14px 16px', borderBottom: '1px solid #262626', position: 'relative',
  },
  headerTitle: { fontWeight: 700, fontSize: 16, color: '#F5F5F5' },
  headerClose: {
    position: 'absolute', right: 12, background: 'none', border: 'none',
    color: '#F5F5F5', cursor: 'pointer', fontSize: 24, lineHeight: 1, padding: 4,
  },
  list: { flex: 1, overflowY: 'auto', padding: '8px 16px 12px' },
  row: { display: 'flex', gap: 12, padding: '10px 0' },
  body: { flex: 1, minWidth: 0 },
  nameRow: { display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 },
  name: { fontWeight: 600, fontSize: 13, color: '#F5F5F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  time: { fontSize: 12, color: '#A8A8A8', flexShrink: 0 },
  text: { fontSize: 14, color: '#F5F5F5', marginTop: 2, wordBreak: 'break-word', lineHeight: 1.4 },
  actions: { display: 'flex', gap: 14, marginTop: 6, alignItems: 'center' },
  replyBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#A8A8A8', padding: 0 },
  likeBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0 0 8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0,
  },
  likeCount: { fontSize: 11, color: '#A8A8A8' },
  quoted: {
    display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, padding: '6px 10px',
    background: 'rgba(255,255,255,0.06)', borderLeft: '2px solid #0095F6', borderRadius: '0 8px 8px 0',
  },
  quotedName: { fontSize: 11, fontWeight: 700, color: '#E0E0E0' },
  quotedText: { fontSize: 12, color: '#A8A8A8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  thread: { marginLeft: 32, marginTop: 2 },
  replyLine: {
    borderLeft: '2px solid #4A4A4A', paddingLeft: 12, marginTop: 4,
  },
  parentRef: { fontSize: 12, color: '#A8A8A8', marginTop: 2 },
  parentName: { fontWeight: 700, color: '#38BDF8' },
  viewReplies: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
    fontWeight: 600, color: '#A8A8A8', margin: '2px 0 4px 52px', padding: 0,
  },
  replyBar: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
    borderTop: '1px solid #262626', background: '#0A0A0A',
  },
  replyPreview: {
    flex: 1, minWidth: 0, display: 'flex', gap: 8, alignItems: 'center',
    background: 'rgba(255,255,255,0.06)', borderLeft: '2px solid #0095F6',
    borderRadius: '0 8px 8px 0', padding: '6px 10px',
  },
  replyCancel: {
    background: 'none', border: 'none', color: '#A8A8A8', cursor: 'pointer',
    fontSize: 18, lineHeight: 1, padding: 4, flexShrink: 0,
  },
  form: {
    display: 'flex', gap: 10, padding: '12px 16px',
    borderTop: '1px solid #262626', alignItems: 'center', background: '#000',
  },
  input: {
    flex: 1, background: 'transparent', border: '1px solid #363636',
    borderRadius: 22, padding: '9px 16px', color: '#F5F5F5',
    outline: 'none', fontSize: 14, fontFamily: 'inherit',
  },
  send: {
    background: 'none', border: 'none', color: '#0095F6', fontWeight: 700,
    fontSize: 14, cursor: 'pointer', padding: '6px 2px', flexShrink: 0,
  },
}

/* ── component ── */
export default function CommentsPanel({ post, open, onClose, addComment, getComments, deleteComment, joinPost, likeComment, unlikeComment }) {
  const { auth } = use(AuthContext)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [expandedThreads, setExpandedThreads] = useState({})
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const prevCountRef = useRef(0)
  const isLikeUpdateRef = useRef(false)
  const nodeRefs = useRef({})
  const justRepliedRef = useRef(false)

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
      try { const fresh = await getComments(post._id); setComments(Array.isArray(fresh) ? fresh : []) } catch (_) { }
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
      try { joinPost(post._id) } catch (_) { }
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

  /* scroll to bottom when NEW top-level comments arrive (not for replies) */
  useEffect(() => {
    if (!open || comments.length === 0) return
    if (isLikeUpdateRef.current) {
      isLikeUpdateRef.current = false
      return
    }
    if (justRepliedRef.current) {
      justRepliedRef.current = false
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

  /* reset reply state when switching posts */
  useEffect(() => {
    setReplyTo(null)
    setText('')
    prevCountRef.current = 0
  }, [post?._id])

  /* close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const startReply = (c) => {
    const name = (c.authorFirstName || c.authorLastName)
      ? `${c.authorFirstName || ''} ${c.authorLastName || ''}`.trim()
      : 'Usuario'
    setReplyTo({ id: c._id, name, content: c.content, author: c.author })
    inputRef.current?.focus()
  }

  const handleDelete = async () => {
    if (!confirmDeleteId || deleting) return
    setDeleting(true)
    try {
      if (typeof deleteComment === 'function') {
        await deleteComment(post._id, confirmDeleteId)
      }
      const gone = String(confirmDeleteId)
      setComments(prev => prev.filter(c => String(c._id) !== gone && String(c.parent) !== gone))
      setConfirmDeleteId(null)
    } catch (err) {
      setError('No se pudo eliminar el comentario.')
      setConfirmDeleteId(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    setError(null)
    const targetParentId = replyTo?.id ? String(replyTo.id) : null
    try {
      const newComment = await addComment(post._id, text.trim(), replyTo?.id)
      setText('')
      if (targetParentId) {
        justRepliedRef.current = true
        setExpandedThreads(prev => ({ ...prev, [targetParentId]: true }))
      }
      setReplyTo(null)

      const candidate = {
        _id: newComment?._id || Date.now().toString(),
        content: text.trim(),
        authorFirstName: auth?.firstName || '',
        authorLastName: auth?.lastName || '',
        author: auth?._id || 'me',
        parent: newComment?.parent || targetParentId || undefined,
        createdAt: new Date().toISOString(),
      }
      setComments(prev => [...prev, candidate])

      try {
        const fresh = await getComments(post._id)
        if (Array.isArray(fresh)) setComments(fresh)
      } catch (_) { }

      /* lleva la vista a la respuesta, abajito del comentario padre */
      if (targetParentId) {
        setTimeout(() => {
          const el = nodeRefs.current[targetParentId]
          if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 150)
      }
    } catch (err) {
      setError('No se pudo enviar el comentario.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const sorted = sortByCreatedAtAsc(comments)
  const byId = new Map(sorted.map(c => [String(c._id), c]))
  /* raíz del hilo: sube por los padres hasta el comentario sin padre (corta ciclos) */
  const rootOf = (c) => {
    let cur = c
    const seen = new Set()
    while (cur?.parent && byId.has(String(cur.parent)) && !seen.has(String(cur._id))) {
      seen.add(String(cur._id))
      cur = byId.get(String(cur.parent))
    }
    return cur
  }
  /* huerfanos (padre borrado) se muestran como nivel superior para no perderse */
  const topLevel = sorted.filter(c => !c.parent || !byId.has(String(c.parent)))
  /* hilo plano: todos los descendientes directos o indirectos de la raíz */
  const descendantsOf = (rootId) => sorted.filter(c => {
    if (!c.parent || !byId.has(String(c.parent))) return false
    return String(rootOf(c)?._id) === String(rootId)
  })
  const meId = auth?._id ? String(auth._id) : null

  const renderComment = (c, isRoot = true) => {
    const name = (c.authorFirstName || c.authorLastName)
      ? `${c.authorFirstName || ''} ${c.authorLastName || ''}`.trim()
      : 'Usuario'
    const liked = meId && Array.isArray(c.likes) && c.likes.includes(meId)
    const replies = isRoot ? descendantsOf(c._id) : []
    /* auto-colapsado: más de 3 respuestas inician ocultas hasta que el usuario las abre */
    const explicit = expandedThreads[String(c._id)]
    const showReplies = explicit !== undefined ? explicit : replies.length <= 3
    const parent = c.parent ? byId.get(String(c.parent)) : undefined
    const parentName = parent
      ? ((parent.authorFirstName || parent.authorLastName)
        ? `${parent.authorFirstName || ''} ${parent.authorLastName || ''}`.trim()
        : 'Usuario')
      : null

    return (
      <div
        key={c._id}
        ref={(el) => { if (el) nodeRefs.current[String(c._id)] = el }}
      >
        <div style={S.row} onDoubleClick={() => startReply(c)}>
          <UserAvatar
            user={{ _id: String(c.author || ''), firstName: c.authorFirstName, lastName: c.authorLastName }}
            size={32}
          />
          <div style={S.body}>
            <div style={S.nameRow}>
              <span style={S.name}>{name}</span>
              <span style={S.time}>{relativeTime(c.createdAt)}</span>
            </div>
            {parentName && (
              <div style={S.parentRef}>
                En respuesta a <span style={S.parentName}>{parentName}</span>
              </div>
            )}
            <div style={S.text}>{c.content}</div>
            <div style={S.actions}>
              <button onClick={() => startReply(c)} style={S.replyBtn}>Responder</button>
              {meId && String(c.author) === meId && (
                <button
                  onClick={() => setConfirmDeleteId(c._id)}
                  style={{ ...S.replyBtn, color: '#6B6B6B' }}
                  aria-label="Eliminar comentario"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => toggleLike(c)}
            aria-label={liked ? 'Quitar me gusta' : 'Me gusta'}
            style={S.likeBtn}
          >
            <svg width="14" height="14" viewBox="0 0 24 24"
              key={liked ? 'liked' : 'unliked'}
              style={liked ? { animation: 'igPop 0.35s ease' } : undefined}
              fill={liked ? '#FF3040' : 'none'}
              stroke={liked ? '#FF3040' : '#F5F5F5'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {(c.likesCount || 0) > 0 && (
              <span style={S.likeCount}>{c.likesCount}</span>
            )}
          </button>
        </div>
        {isRoot && replies.length > 0 && showReplies && (
          <div style={S.thread}>
            {replies.map(r => (
              <div key={r._id} style={S.replyLine}>
                {renderComment(r, false)}
              </div>
            ))}
          </div>
        )}
        {isRoot && replies.length > 0 && (
          <button
            onClick={() => setExpandedThreads(prev => ({ ...prev, [String(c._id)]: !showReplies }))}
            style={S.viewReplies}
          >
            {showReplies
              ? '── Ocultar respuestas'
              : `── Ver ${replies.length} respuesta${replies.length > 1 ? 's' : ''}`}
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <style>{`@keyframes igPop { 0% { transform: scale(1); } 40% { transform: scale(1.4); } 100% { transform: scale(1); } }`}</style>
      <div onClick={onClose} style={S.backdrop} />

      <div style={S.panel}>
        <div style={S.header}>
          <span style={S.headerTitle}>
            Comentarios{comments.length > 0 ? ` (${comments.length})` : ''}
          </span>
          <button onClick={onClose} style={S.headerClose} aria-label="Cerrar comentarios">&times;</button>
        </div>

        <div ref={listRef} style={S.list}>
          {loading && <div style={{ textAlign: 'center', color: '#A8A8A8', padding: 20 }}>Cargando…</div>}
          {error && <div style={{ textAlign: 'center', color: '#FF6B6B', padding: 20 }}>{error}</div>}
          {!loading && !error && topLevel.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F5F5F5' }}>Aún no hay comentarios</div>
              <div style={{ fontSize: 13, color: '#A8A8A8', marginTop: 4 }}>Sé el primero en comentar.</div>
            </div>
          )}
          {topLevel.map(c => renderComment(c))}
          <div ref={bottomRef} />
        </div>

        {/* ── reply preview: a quién le respondes, al lado ── */}
        {replyTo && (
          <div style={S.replyBar}>
            <div style={S.replyPreview}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#A8A8A8' }}>
                  Respondiendo a <span style={{ fontWeight: 700, color: '#F5F5F5' }}>{replyTo.name}</span>
                </div>
                <div style={S.quotedText}>{snippet(replyTo.content, 70) || 'Foto'}</div>
              </div>
            </div>
            <button onClick={() => setReplyTo(null)} style={S.replyCancel} aria-label="Cancelar respuesta">&times;</button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={S.form}>
          <UserAvatar user={auth} size={32} />
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={replyTo ? `Responde a ${replyTo.name}…` : 'Añade un comentario…'}
            disabled={submitting}
            style={S.input}
          />
          {(text.trim().length > 0) && (
            <button type="submit" disabled={submitting} style={{
              ...S.send,
              opacity: submitting ? 0.5 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}>
              Publicar
            </button>
          )}
        </form>
      </div>

      {confirmDeleteId && (
        <ConfirmToast
          message="¿Seguro que deseas eliminar este comentario?"
          onConfirm={handleDelete}
          onCancel={() => { if (!deleting) setConfirmDeleteId(null) }}
        />
      )}
    </>
  )
}
