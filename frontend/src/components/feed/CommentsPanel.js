import React, { use } from 'react'
import { AuthContext } from '../../hooks/AuthContext'
import UserAvatar from '../common/UserAvatar'
import { ConfirmToast } from '../toasts/Toast'
import useCommentsPanelLogic from './useCommentsPanelLogic'

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

function snippet(text, max = 80) {
  if (!text) return ''
  const t = String(text).trim()
  return t.length > max ? t.slice(0, max) + '…' : t
}

/* ── instagram-like styles ── */
const S = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1299,
  },
  panel: {
    position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 420,
    background: 'rgba(18,18,30,0.78)',
    WebkitBackdropFilter: 'blur(20px) saturate(140%)',
    backdropFilter: 'blur(20px) saturate(140%)',
    borderLeft: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '-16px 0 48px rgba(0,0,0,0.5)',
    zIndex: 1300, display: 'flex', flexDirection: 'column',
    animation: 'slideInRight 0.25s ease-out',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.12)', position: 'relative',
  },
  headerTitle: { fontWeight: 700, fontSize: 16, color: '#ffffff' },
  headerClose: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    width: 36, height: 36, borderRadius: '50%', zIndex: 2,
    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)',
    color: '#FFFFFF', cursor: 'pointer', fontSize: 18, fontWeight: 700, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
  },
  list: { flex: 1, overflowY: 'auto', padding: '8px 16px 12px' },
  row: { display: 'flex', gap: 12, padding: '10px 0' },
  body: { flex: 1, minWidth: 0 },
  nameRow: { display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 },
  name: { fontWeight: 600, fontSize: 13, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  time: { fontSize: 12, color: '#9CA3AF', flexShrink: 0 },
  text: { fontSize: 14, color: '#ffffff', marginTop: 2, wordBreak: 'break-word', lineHeight: 1.4 },
  actions: { display: 'flex', gap: 14, marginTop: 6, alignItems: 'center' },
  replyBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#9CA3AF', padding: 0 },
  likeBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0 0 8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0,
  },
  likeCount: { fontSize: 11, color: '#9CA3AF' },
  quoted: {
    display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, padding: '6px 10px',
    background: 'rgba(255,255,255,0.06)', borderLeft: '2px solid #A855F7', borderRadius: '0 8px 8px 0',
  },
  quotedName: { fontSize: 11, fontWeight: 700, color: '#ffffff' },
  quotedText: { fontSize: 12, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  thread: { marginLeft: 32, marginTop: 2 },
  replyLine: {
    borderLeft: '2px solid rgba(255,255,255,0.12)', paddingLeft: 12, marginTop: 4,
  },
  parentRef: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  parentName: { fontWeight: 700, color: '#A855F7' },
  viewReplies: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
    fontWeight: 600, color: '#9CA3AF', margin: '2px 0 4px 52px', padding: 0,
  },
  replyBar: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
    borderTop: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.3)',
  },
  replyPreview: {
    flex: 1, minWidth: 0, display: 'flex', gap: 8, alignItems: 'center',
    background: 'rgba(255,255,255,0.06)', borderLeft: '2px solid #A855F7',
    borderRadius: '0 8px 8px 0', padding: '6px 10px',
  },
  replyCancel: {
    background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer',
    fontSize: 18, lineHeight: 1, padding: 4, flexShrink: 0,
  },
  form: {
    display: 'flex', gap: 10, padding: '12px 16px',
    borderTop: '1px solid rgba(255,255,255,0.12)', alignItems: 'center', background: 'rgba(0,0,0,0.3)',
  },
  commentField: {
    flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 4,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 999, padding: '4px 4px 4px 16px',
  },
  input: {
    flex: 1, minWidth: 0, background: 'transparent', border: 'none',
    color: '#ffffff', outline: 'none', fontSize: 14, fontFamily: 'inherit', padding: '8px 0',
  },
  send: {
    background: 'linear-gradient(135deg, #A855F7, #60A5FA)', border: 'none', color: '#fff',
    cursor: 'pointer', padding: 0, flexShrink: 0, width: 34, height: 34, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(168,85,247,0.35)',
  },
}
/* ── component ── */
export default function CommentsPanel({ post, open, onClose, addComment, getComments, deleteComment, joinPost, likeComment, unlikeComment }) {
  const { auth } = use(AuthContext)
  const {
    comments, loading, text, setText, submitting, error, replyTo, setReplyTo,
    confirmDeleteId, setConfirmDeleteId, deleting, expandedThreads, setExpandedThreads,
    bottomRef, inputRef, listRef, nodeRefs, toggleLike, startReply, handleDelete, handleSubmit,
    topLevel, descendantsOf, byId, meId
  } = useCommentsPanelLogic({
    post, open, onClose, addComment, getComments, deleteComment, joinPost, likeComment, unlikeComment, auth
  });

  if (!open) return null

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
                  style={{ ...S.replyBtn, color: '#6B7280' }}
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
              fill={liked ? '#F87171' : 'none'}
              stroke={liked ? '#F87171' : '#9CA3AF'}
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
      <style>{`@keyframes igPop { 0% { transform: scale(1); } 40% { transform: scale(1.4); } 100% { transform: scale(1); } }
      .fb-comments-close:hover { background: rgba(255,255,255,0.16) !important; color: #fff !important; }`}</style>
      <div onClick={onClose} style={S.backdrop} />

      <div style={S.panel}>
        <div style={S.header}>
          <span style={S.headerTitle}>
            Comentarios{comments.length > 0 ? ` (${comments.length})` : ''}
          </span>
          <button onClick={onClose} style={S.headerClose} className="fb-comments-close" aria-label="Cerrar comentarios">✕</button>
        </div>

        <div ref={listRef} style={S.list}>
          {loading && <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 20 }}>Cargando…</div>}
          {error && <div style={{ textAlign: 'center', color: '#F87171', padding: 20 }}>{error}</div>}
          {!loading && !error && topLevel.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>Aún no hay comentarios</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Sé el primero en comentar.</div>
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
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                  Respondiendo a <span style={{ fontWeight: 700, color: '#ffffff' }}>{replyTo.name}</span>
                </div>
                <div style={S.quotedText}>{snippet(replyTo.content, 70) || 'Foto'}</div>
              </div>
            </div>
            <button onClick={() => setReplyTo(null)} style={S.replyCancel} aria-label="Cancelar respuesta">&times;</button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={S.form}>
          <UserAvatar user={auth} size={32} />
          <div style={S.commentField}>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={replyTo ? `Responde a ${replyTo.name}…` : 'Añade un comentario…'}
              disabled={submitting}
              style={S.input}
              autoComplete="off"
              enterKeyHint="send"
              aria-label="Escribe un comentario"
            />
            <button type="submit" disabled={submitting || text.trim().length === 0} title="Publicar" aria-label="Publicar comentario" style={{
              ...S.send,
              opacity: (submitting || text.trim().length === 0) ? 0.4 : 1,
              cursor: (submitting || text.trim().length === 0) ? 'not-allowed' : 'pointer',
            }}>
              {submitting ? '…' : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
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
