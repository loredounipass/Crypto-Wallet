import { useState, useEffect, useCallback, useContext } from 'react';
import * as profileService from '../services/profile';
import { AuthContext } from './AuthContext';

/**
 * Hook para cargar y gestionar el perfil del usuario autenticado.
 * Opcionalmente puede cargar un perfil por ID (vista pública de otro usuario).
 * @param {{ userId?: string }} options - Si se pasa userId, se carga ese perfil (público); si no, el propio (me).
 */
export default function useProfile(options = {}) {
    const { userId: viewUserId } = options;
    const { auth, setAuth } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // True when there's no userId in the URL, OR the userId matches the logged-in user
    const isOwnProfile = !viewUserId || (!!auth?._id && viewUserId === String(auth._id));

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // If own profile: always fetch /profile/me (canonical, includes editable fields)
            const res = isOwnProfile
                ? await profileService.getMyProfile()
                : await profileService.getProfileById(viewUserId);
            const data = res?.data ?? res;

            if (!isOwnProfile && viewUserId && data) {
                // ── Public profile of another user ──

                // 1) Follow status (don't block posts if this fails)
                let following = false;
                try {
                    const statusRes = await profileService.getFollowStatus(viewUserId);
                    following = (statusRes?.data ?? statusRes)?.following ?? false;
                } catch (_) { /* ignore — user may not be logged-in */ }
                setProfile({ ...data, isFollowing: following });

                // 2) Posts — independent of follow-status, always run
                try {
                    setPostsLoading(true);
                    const postsRes = await profileService.getProfilePosts(viewUserId, 50);
                    const postsData = postsRes?.data ?? postsRes;
                    setPosts(postsData || []);
                } catch (_) {
                    setPosts([]);
                } finally {
                    setPostsLoading(false);
                }
            } else {
                // ── Own profile ──
                // Normalize: /profile/me returns raw arrays, not pre-computed counts.
                // Calculate followersCount / followingCount here so the UI always has numbers.
                const normalized = {
                    ...data,
                    followersCount: typeof data?.followersCount === 'number'
                        ? data.followersCount
                        : (Array.isArray(data?.followers) ? data.followers.length : 0),
                    followingCount: typeof data?.followingCount === 'number'
                        ? data.followingCount
                        : (Array.isArray(data?.following) ? data.following.length : 0),
                };
                setProfile(normalized);
                try {
                    const rawOwner = data?.owner;
                    const ownerId = rawOwner
                        ? (typeof rawOwner === 'string' ? rawOwner : String(rawOwner))
                        : (auth?._id ? String(auth._id) : undefined);
                    if (ownerId) {
                        setPostsLoading(true);
                        const postsRes = await profileService.getProfilePosts(ownerId, 50);
                        const postsData = postsRes?.data ?? postsRes;
                        setPosts(postsData || []);
                    } else {
                        setPosts([]);
                    }
                } catch (_) {
                    setPosts([]);
                } finally {
                    setPostsLoading(false);
                }
            }
        } catch (err) {
            setError(err);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, [viewUserId, isOwnProfile, auth?._id]);


    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    /** Actualiza el perfil (upsert) y refresca el estado local. */
    const upsertProfile = useCallback(async (body) => {
        if (!isOwnProfile) return Promise.reject(new Error('No se puede editar el perfil de otro usuario'));
        const res = await profileService.upsertProfile(body);
        const data = res?.data ?? res;
        setProfile((prev) => (prev ? { ...prev, ...data } : data));
        return data;
    }, [isOwnProfile]);

    /** Sube foto de perfil y actualiza profilePhotoUrl en el estado y en el AuthContext global. */
    const uploadProfilePhoto = useCallback(async (file) => {
        if (!isOwnProfile) return Promise.reject(new Error('No se puede editar el perfil de otro usuario'));
        const formData = new FormData();
        formData.append('file', file);
        const res = await profileService.uploadProfilePhoto(formData);
        const url = res?.data?.url ?? res?.url;
        if (url) {
            setProfile((prev) => (prev ? { ...prev, profilePhotoUrl: url } : { profilePhotoUrl: url }));
            // Sync global auth so navbar/sidebar/etc all update immediately
            setAuth((prev) => prev ? { ...prev, profilePhotoUrl: url } : prev);
        }
        return res;
    }, [isOwnProfile, setAuth]);

    /** Sube foto de portada y actualiza coverPhotoUrl en el estado. */
    const uploadCoverPhoto = useCallback(async (file) => {
        if (!isOwnProfile) return Promise.reject(new Error('No se puede editar el perfil de otro usuario'));
        const formData = new FormData();
        formData.append('file', file);
        const res = await profileService.uploadCoverPhoto(formData);
        const url = res?.data?.url ?? res?.url;
        if (url) setProfile((prev) => (prev ? { ...prev, coverPhotoUrl: url } : { coverPhotoUrl: url }));
        return res;
    }, [isOwnProfile]);

    /** Marca al usuario visto como seguido y actualiza contador. Solo cuando se visita el perfil de otro usuario. */
    const follow = useCallback(async () => {
        if (isOwnProfile || !viewUserId) return Promise.reject(new Error('No hay usuario a seguir'));
        const res = await profileService.followUser(viewUserId);
        const payload = res?.data ?? res;
        setProfile((prev) => (prev ? { ...prev, isFollowing: true, followersCount: payload?.followersCount ?? ((prev.followersCount || 0) + 1) } : prev));
        return payload;
    }, [viewUserId, isOwnProfile]);

    /** Marca al usuario visto como no seguido y actualiza contador. Solo cuando se visita el perfil de otro usuario. */
    const unfollow = useCallback(async () => {
        if (isOwnProfile || !viewUserId) return Promise.reject(new Error('No hay usuario a dejar de seguir'));
        const res = await profileService.unfollowUser(viewUserId);
        const payload = res?.data ?? res;
        setProfile((prev) => (prev ? { ...prev, isFollowing: false, followersCount: payload?.followersCount ?? Math.max(0, (prev.followersCount || 0) - 1) } : prev));
        return payload;
    }, [viewUserId, isOwnProfile]);


    return {
        profile,
        posts,
        postsLoading,
        loading,
        error,
        refetch: loadProfile,
        upsertProfile,
        uploadProfilePhoto,
        uploadCoverPhoto,
        follow,
        unfollow,
        isOwnProfile,
    };
}
