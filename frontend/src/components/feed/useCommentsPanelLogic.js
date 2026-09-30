import { useState, useEffect, useRef } from 'react';



// SORTS THE LIST OF COMMENTS IN ASCENDING ORDER BY CREATION DATE
function sortByCreatedAtAsc(list) {
  const sortFn = (a, b) => {
    const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return da - db;
  };
  return list.toSorted ? list.toSorted(sortFn) : [...list].sort(sortFn);
}



// CUSTOM HOOK THAT MANAGES THE STATE AND LOGIC FOR THE COMMENTS PANEL
export default function useCommentsPanelLogic({
  post, open, onClose, addComment, getComments, deleteComment, joinPost, likeComment, unlikeComment, auth
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState({});
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const prevCountRef = useRef(0);
  const isLikeUpdateRef = useRef(false);
  const nodeRefs = useRef({});
  const justRepliedRef = useRef(false);



  // TOGGLES THE LIKE STATUS OF A GIVEN COMMENT
  const toggleLike = async (comment) => {
    if (!auth || !auth._id) return;
    const meId = String(auth._id);
    const liked = Array.isArray(comment.likes) && comment.likes.includes(meId);

    const list = listRef.current;
    const savedScrollTop = list ? list.scrollTop : 0;
    isLikeUpdateRef.current = true;

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
    ));

    requestAnimationFrame(() => {
      if (list) list.scrollTop = savedScrollTop;
    });

    try {
      if (liked) {
        if (typeof unlikeComment === 'function') await unlikeComment(comment._id, post._id);
      } else {
        if (typeof likeComment === 'function') await likeComment(comment._id, post._id);
      }
    } catch (err) {
      try { const fresh = await getComments(post._id); setComments(Array.isArray(fresh) ? fresh : []); } catch (_) { }
    }
  };



  // EFFECT THAT LOCKS THE BODY SCROLL WHEN THE PANEL IS OPEN
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      inputRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);



  // EFFECT THAT LOADS THE COMMENTS WHENEVER THE PANEL OPENS
  useEffect(() => {
    if (!open || !post?._id) return;
    let mounted = true;
    if (typeof joinPost === 'function') {
      try { joinPost(post._id); } catch (_) { }
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getComments(post._id);
        if (mounted) setComments(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setError('No se pudieron cargar los comentarios.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [open, post, getComments, joinPost]);



  // EFFECT THAT SCROLLS TO THE BOTTOM WHEN NEW TOP-LEVEL COMMENTS ARRIVE
  useEffect(() => {
    if (!open || comments.length === 0) return;
    if (isLikeUpdateRef.current) {
      isLikeUpdateRef.current = false;
      return;
    }
    if (justRepliedRef.current) {
      justRepliedRef.current = false;
      return;
    }
    const list = listRef.current;
    const nearBottom = list
      ? (list.scrollHeight - list.scrollTop - list.clientHeight) < 80
      : true;
    const isFirstLoad = prevCountRef.current === 0;
    if (comments.length > prevCountRef.current && (nearBottom || isFirstLoad)) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
    prevCountRef.current = comments.length;
  }, [comments, open]);



  // EFFECT THAT RESETS THE REPLY STATE WHEN SWITCHING POSTS
  useEffect(() => {
    setReplyTo(null);
    setText('');
    prevCountRef.current = 0;
  }, [post?._id]);



  // EFFECT THAT CLOSES THE PANEL ON ESCAPE KEY PRESS
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);



  // STARTS A REPLY TO A SPECIFIC COMMENT
  const startReply = (c) => {
    const name = (c.authorFirstName || c.authorLastName)
      ? `${c.authorFirstName || ''} ${c.authorLastName || ''}`.trim()
      : 'Usuario';
    setReplyTo({ id: c._id, name, content: c.content, author: c.author });
    inputRef.current?.focus();
  };



  // HANDLES THE DELETION OF A COMMENT
  const handleDelete = async () => {
    if (!confirmDeleteId || deleting) return;
    setDeleting(true);
    try {
      if (typeof deleteComment === 'function') {
        await deleteComment(post._id, confirmDeleteId);
      }
      const gone = String(confirmDeleteId);
      setComments(prev => prev.filter(c => String(c._id) !== gone && String(c.parent) !== gone));
      setConfirmDeleteId(null);
    } catch (err) {
      setError('No se pudo eliminar el comentario.');
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };



  // SUBMITS A NEW COMMENT OR REPLY
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);
    const targetParentId = replyTo?.id ? String(replyTo.id) : null;
    try {
      const newComment = await addComment(post._id, text.trim(), replyTo?.id);
      setText('');
      if (targetParentId) {
        justRepliedRef.current = true;
        setExpandedThreads(prev => ({ ...prev, [targetParentId]: true }));
      }
      setReplyTo(null);

      const candidate = {
        _id: newComment?._id || Date.now().toString(),
        content: text.trim(),
        authorFirstName: auth?.firstName || '',
        authorLastName: auth?.lastName || '',
        author: auth?._id || 'me',
        parent: newComment?.parent || targetParentId || undefined,
        createdAt: new Date().toISOString(),
      };
      setComments(prev => [...prev, candidate]);

      try {
        const fresh = await getComments(post._id);
        if (Array.isArray(fresh)) setComments(fresh);
      } catch (_) { }

      if (targetParentId) {
        setTimeout(() => {
          const el = nodeRefs.current[targetParentId];
          if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    } catch (err) {
      setError('No se pudo enviar el comentario.');
    } finally {
      setSubmitting(false);
    }
  };



  // SORTS AND MAPS COMMENTS BY ID
  const sorted = sortByCreatedAtAsc(comments);
  const byId = new Map(sorted.map(c => [String(c._id), c]));



  // FINDS THE ROOT PARENT OF A GIVEN COMMENT
  const rootOf = (c) => {
    let cur = c;
    const seen = new Set();
    while (cur?.parent && byId.has(String(cur.parent)) && !seen.has(String(cur._id))) {
      seen.add(String(cur._id));
      cur = byId.get(String(cur.parent));
    }
    return cur;
  };



  // FILTERS THE TOP-LEVEL COMMENTS
  const topLevel = sorted.filter(c => !c.parent || !byId.has(String(c.parent)));



  // RETRIEVES ALL DESCENDANTS OF A SPECIFIC ROOT COMMENT
  const descendantsOf = (rootId) => sorted.filter(c => {
    if (!c.parent || !byId.has(String(c.parent))) return false;
    return String(rootOf(c)?._id) === String(rootId);
  });



  const meId = auth?._id ? String(auth._id) : null;


  return {
    comments, loading, text, setText, submitting, error, replyTo, setReplyTo,
    confirmDeleteId, setConfirmDeleteId, deleting, expandedThreads, setExpandedThreads,
    bottomRef, inputRef, listRef, nodeRefs, toggleLike, startReply, handleDelete, handleSubmit,
    topLevel, descendantsOf, byId, meId
  };
}
