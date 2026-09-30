import { useState, useEffect, useRef, useCallback } from 'react';
import { mediaBase, apiOrigin } from '../../api/http';



// RESOLVES THE FULL URL FOR MEDIA RESOURCES
const resolveUrl = (u) => {
  if (!u) return null;
  try {
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith('/')) return `${apiOrigin}${u}`;
    return `${mediaBase}/${u}`;
  } catch (_) { return u; }
};



// CUSTOM HOOK THAT MANAGES THE STATE AND LOGIC FOR A FEED ITEM
export default function useFeedItemLogic({ post, actions, auth }) {
  const { likePost, unlikePost, deletePost, viewPost, sharePost } = actions;
  const isMyPost = post && auth?._id && String(post.author) === String(auth._id);
  const [following, setFollowing] = useState(false);
  const followLoading = useRef(false);



  // HANDLES FOLLOWING THE POST AUTHOR
  const handleFollow = useCallback(async () => {
    if (followLoading.current || following) return;
    followLoading.current = true;
    try {
      setFollowing(true);
    } catch (err) {
      console.error('[FeedItem] Error following user:', err);
    } finally { followLoading.current = false; }
  }, [following]);



  // HANDLES UNFOLLOWING THE POST AUTHOR
  const handleUnfollow = useCallback(async () => {
    if (followLoading.current || !following) return;
    followLoading.current = true;
    try {
      setFollowing(false);
    } catch (err) {
      console.error('[FeedItem] Error unfollowing user:', err);
    } finally { followLoading.current = false; }
  }, [following]);



  // CHECKS IF THE CURRENT USER HAS LIKED THE POST
  const isLikedByMe = (p) => {
    if (!p || !auth?._id) return false;
    return Array.isArray(p.likes) && p.likes.some(
      (id) => String(id) === String(auth._id)
    );
  };



  const [liked, setLiked] = useState(() => isLikedByMe(post));
  const [localLikes, setLocalLikes] = useState(post ? (post.likesCount || 0) : 0);
  const [showComments, setShowComments] = useState(false);
  const [localShares, setLocalShares] = useState(post ? (post.shares || 0) : 0);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const containerRef = useRef(null);
  const viewed = useRef(false);



  // EFFECT THAT SYNCS THE LIKED STATE WHEN THE POST PROP CHANGES
  useEffect(() => {
    setLiked(isLikedByMe(post));
    setLocalLikes(post?.likesCount || 0);
  }, [post?._id, post?.likesCount, post?.likes, auth?._id]);



  // EFFECT THAT TRACKS WHEN THE POST COMES INTO VIEW USING INTERSECTION OBSERVER
  useEffect(() => {
    if (!post || !post._id || typeof window === 'undefined') return;
    const el = containerRef.current;
    if (!el || viewed.current) return;
    let obs;
    try {
      obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting && e.intersectionRatio > 0.25 && !viewed.current) {
            try { if (viewPost) viewPost(post._id).catch(() => { }); } catch (_) { }
            viewed.current = true;
          }
        });
      }, { threshold: [0.25, 0.5, 1] });
      obs.observe(el);
    } catch (_) { }
    return () => { try { if (obs && el) obs.unobserve(el); } catch (_) { } };
  }, [post, viewPost]);



  // COMPUTES THE DISPLAY NAME OF THE POST AUTHOR
  const displayName = post && (post.authorFirstName || post.authorLastName)
    ? `${post.authorFirstName || ''} ${post.authorLastName || ''}`.trim()
    : 'Usuario';



  // CONSTRUCTS THE SHARE URL FOR THE POST
  const shareUrl = (typeof window !== 'undefined' && window.location)
    ? `${window.location.origin}/feed/${post?._id}`
    : '';



  // RESOLVES THE MEDIA URL FOR THE POST IMAGE OR VIDEO
  const mediaUrl = post && (
    resolveUrl(post.multimediaUrl) ||
    resolveUrl(post.thumbnailUrl) ||
    (post.multimedia?.filename ? `${mediaBase}/${post.multimedia.filename}` : null)
  );



  // FORMATS THE CREATION DATE OF THE POST
  const timeStr = post?.createdAt
    ? new Date(post.createdAt).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    : '';



  // HANDLES LIKING AND UNLIKING THE POST
  const handleLike = async () => {
    try {
      if (!liked) {
        setLiked(true);
        setLocalLikes(l => l + 1);
        const res = await likePost(post._id);
        const u = (res && res.data) ? res.data : res;
        if (u && typeof u.likesCount === 'number') setLocalLikes(u.likesCount);
      } else {
        setLiked(false);
        setLocalLikes(l => Math.max(0, l - 1));
        const res = await unlikePost(post._id);
        const u = (res && res.data) ? res.data : res;
        if (u && typeof u.likesCount === 'number') setLocalLikes(u.likesCount);
      }
    } catch (_) { }
  };



  // HANDLES SHARING THE POST VIA URL OR API
  const handleShare = async () => {
    if (shareBusy) return;
    setShareBusy(true);
    try {
      if (sharePost) {
        const res = await sharePost(post._id);
        const u = (res && res.data) ? res.data : res;
        setLocalShares((s) => (u && typeof u.shares === 'number') ? u.shares : s + 1);
        setShareFeedback('Compartido');
        setTimeout(() => setShareFeedback(''), 1800);
        try { setShareDialogOpen(true); } catch (_) { }
        return;
      }
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setLocalShares((s) => s + 1);
        setShareFeedback('Enlace copiado');
        setTimeout(() => setShareFeedback(''), 1800);
        return;
      }
    } catch (_) {
      try { setShareFeedback('Error al compartir'); } catch (_) { }
      setTimeout(() => setShareFeedback(''), 2200);
    } finally {
      setShareBusy(false);
    }
  };


  return {
    isMyPost, following, followLoading, handleFollow, handleUnfollow,
    liked, localLikes, showComments, setShowComments, localShares, shareBusy,
    shareFeedback, shareDialogOpen, setShareDialogOpen, showDeleteConfirm,
    setShowDeleteConfirm, containerRef, displayName, shareUrl, mediaUrl,
    timeStr, handleLike, handleShare
  };
}
