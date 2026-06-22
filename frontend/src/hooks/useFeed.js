import { useState, useCallback, useEffect, useRef } from 'react';
import FeedService from '../services/feed';
import { io } from 'socket.io-client';

export default function useFeed(isVideoOnly = false) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const socketRef = useRef(null);

    const fetchFeed = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = isVideoOnly 
                ? await FeedService.getVideoFeed()
                : await FeedService.getFeed();
            
            setPosts(data || []);
        } catch (err) {
            setError(err.message || 'Error al cargar el feed');
        } finally {
            setLoading(false);
        }
    }, [isVideoOnly]);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);

    // WebSocket Integration
    useEffect(() => {
        try {
            const socketOrigin = new URL(process.env.REACT_APP_API_BASE_URL).origin;
            const socket = io(`${socketOrigin}/feed`, {
                withCredentials: true,
                transports: ['polling'],
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                console.log('[FeedSocket] 🟢 Connected to feed namespace');
            });

            socket.on('postCreated', (post) => {
                setPosts((prev) => {
                    if (prev.some(p => p._id === post._id)) return prev;
                    return [post, ...prev];
                });
            });

            socket.on('postUpdated', (updatedPost) => {
                setPosts((prev) => prev.map(p => p._id === updatedPost._id ? { ...p, ...updatedPost } : p));
            });

            socket.on('commentCreated', (comment) => {
                setPosts((prev) => prev.map(p => {
                    if (p._id === comment.post) {
                        return { ...p, commentsCount: (p.commentsCount || 0) + 1 };
                    }
                    return p;
                }));
            });

            socket.on('disconnect', () => {
                console.log('[FeedSocket] 🔴 Disconnected');
            });

            return () => {
                socket.disconnect();
            };
        } catch (err) {
            console.error('[FeedSocket] Error initializing socket:', err);
        }
    }, []);

    const updatePostOptimistic = (postId, updater) => {
        setPosts((prev) => prev.map(p => p._id === postId ? updater(p) : p));
    };

    const deletePostOptimistic = (postId) => {
        setPosts((prev) => prev.filter(p => p._id !== postId));
    };

    // ── Post Actions ──
    const createPost = async (data) => {
        const res = await FeedService.createPost(data);
        const created = res?.data || res;
        if (created?._id) {
            setPosts((prev) => {
                if (prev.some(p => p._id === created._id)) return prev;
                return [created, ...prev];
            });
        }
        return created;
    };

    const createPostWithFile = async (formData) => {
        const res = await FeedService.createPostWithFile(formData);
        const created = res?.data || res;
        if (created?._id) {
            setPosts((prev) => {
                if (prev.some(p => p._id === created._id)) return prev;
                return [created, ...prev];
            });
        }
        return created;
    };

    const likePost = async (postId) => {
        try {
            const { data } = await FeedService.likePost(postId);
            updatePostOptimistic(postId, () => data);
            return { data };
        } catch (err) {
            console.error('Error liking post', err);
            throw err;
        }
    };

    const unlikePost = async (postId) => {
        try {
            const { data } = await FeedService.unlikePost(postId);
            updatePostOptimistic(postId, () => data);
            return { data };
        } catch (err) {
            console.error('Error unliking post', err);
            throw err;
        }
    };

    const deletePost = async (postId) => {
        deletePostOptimistic(postId);
        try {
            await FeedService.deletePost(postId);
        } catch (err) {
            console.error('Error deleting post', err);
            fetchFeed();
        }
    };

    // ── Comment Actions ──
    const addComment = async (postId, content, parentId = null) => {
        const res = await FeedService.addComment(postId, content, parentId);
        const comment = res?.data || res;
        // Increment comment count optimistically
        updatePostOptimistic(postId, (p) => ({ ...p, commentsCount: (p.commentsCount || 0) + 1 }));
        return comment;
    };

    const getComments = async (postId) => {
        const res = await FeedService.getComments(postId);
        return res?.data || res || [];
    };

    const likeComment = async (commentId) => {
        const res = await FeedService.likeComment(commentId);
        return res?.data || res;
    };

    const unlikeComment = async (commentId) => {
        const res = await FeedService.unlikeComment(commentId);
        return res?.data || res;
    };

    // ── View / Share ──
    const viewPost = async (postId) => {
        try {
            const res = await FeedService.addView(postId);
            return res?.data || res;
        } catch (_) {}
    };

    const sharePost = async (postId) => {
        try {
            const res = await FeedService.addShare(postId);
            const data = res?.data || res;
            updatePostOptimistic(postId, (p) => ({ ...p, shares: data?.shares || (p.shares || 0) + 1 }));
            return data;
        } catch (_) {}
    };

    // ── Socket helpers ──
    const joinPost = (postId) => {
        try {
            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('joinPost', { postId });
            }
        } catch (_) {}
    };

    return { 
        posts, 
        loading, 
        error, 
        refetch: fetchFeed, 
        createPost,
        createPostWithFile,
        likePost,
        unlikePost,
        deletePost,
        addComment,
        getComments,
        likeComment,
        unlikeComment,
        viewPost,
        sharePost,
        joinPost,
    };
}

