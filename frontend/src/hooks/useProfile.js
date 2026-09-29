import { useState, useEffect, useCallback, use } from 'react';
import * as profileService from '../services/profile';
import { AuthContext } from './AuthContext';
import i18n from '../languages/i18n';



// CUSTOM HOOK TO FETCH, MANAGE, AND UPDATE THE AUTHENTICATED USER OR A PUBLIC PROFILE
export default function useProfile(options = {}) {
    const { userId: viewUserId } = options;
    const { auth, setAuth } = use(AuthContext);
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // True when there's no userId in the URL, OR the userId matches the logged-in user
    const isOwnProfile = !viewUserId || (!!auth?._id && viewUserId === String(auth._id));




    // ASYNCHRONOUSLY FETCHES THE RELEVANT PROFILE DATA AND THEIR LATEST POSTS
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





    // EFFECT THAT TRIGGERS THE PROFILE DATA LOAD ON COMPONENT MOUNT OR ID CHANGE
    useEffect(() => {
        loadProfile();
    }, [loadProfile]);




    // SENDS UPDATED PROFILE FIELDS TO THE SERVER AND REFRESHES LOCAL STATE
    const upsertProfile = useCallback(async (body) => {
        if (!isOwnProfile) return Promise.reject(new Error(i18n.t('profile_cannot_edit')));
        const res = await profileService.upsertProfile(body);
        const data = res?.data ?? res;
        setProfile((prev) => (prev ? { ...prev, ...data } : data));
        return data;
    }, [isOwnProfile]);




    // UPLOADS A NEW AVATAR IMAGE AND SYNCHRONIZES THE GLOBAL AUTHENTICATION STATE
    const uploadProfilePhoto = useCallback(async (file) => {
        if (!isOwnProfile) return Promise.reject(new Error(i18n.t('profile_cannot_edit')));
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




    // UPLOADS A NEW COVER IMAGE AND UPDATES THE LOCAL PROFILE STATE
    const uploadCoverPhoto = useCallback(async (file) => {
        if (!isOwnProfile) return Promise.reject(new Error(i18n.t('profile_cannot_edit')));
        const formData = new FormData();
        formData.append('file', file);
        const res = await profileService.uploadCoverPhoto(formData);
        const url = res?.data?.url ?? res?.url;
        if (url) setProfile((prev) => (prev ? { ...prev, coverPhotoUrl: url } : { coverPhotoUrl: url }));
        return res;
    }, [isOwnProfile]);




    // ADDS THE VIEWED PROFILE TO THE AUTHENTICATED USER'S FOLLOWING LIST
    const follow = useCallback(async () => {
        if (isOwnProfile || !viewUserId) return Promise.reject(new Error(i18n.t('profile_no_user_follow')));
        const res = await profileService.followUser(viewUserId);
        const payload = res?.data ?? res;
        setProfile((prev) => (prev ? { ...prev, isFollowing: true, followersCount: payload?.followersCount ?? ((prev.followersCount || 0) + 1) } : prev));
        return payload;
    }, [viewUserId, isOwnProfile]);




    // REMOVES THE VIEWED PROFILE FROM THE AUTHENTICATED USER'S FOLLOWING LIST
    const unfollow = useCallback(async () => {
        if (isOwnProfile || !viewUserId) return Promise.reject(new Error(i18n.t('profile_no_user_unfollow')));
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
