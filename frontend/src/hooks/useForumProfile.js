import { useState, useEffect, useCallback, use } from 'react';
import * as profileService from '../services/profile';
import { AuthContext } from './AuthContext';



// CUSTOM HOOK FOR THE FORUM PROFILE: LOADS IDENTITY + P2P FLAG + WALL IN ONE CALL
export default function useForumProfile(viewUserId) {
    const { auth, setAuth } = use(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(null);
    const [uploadError, setUploadError] = useState('');

    const resolvedId = viewUserId || auth?._id;
    const isOwnProfile = !!auth?._id && !!resolvedId && String(resolvedId) === String(auth._id);
    const [followBusy, setFollowBusy] = useState(false);



    // VALIDATES AN IMAGE FILE BEFORE UPLOADING (TYPE + 10MB)
    const validateImageFile = (file) => {
        if (!file) return 'Sin archivo.';
        if (!String(file.type || '').startsWith('image/')) return 'Solo se permiten imágenes.';
        if (file.size > 10 * 1024 * 1024) return 'La imagen no puede superar 10 MB.';
        return '';
    };



    // FETCHES THE WHOLE FORUM PROFILE FOR THE RESOLVED USER
    const loadForumProfile = useCallback(async () => {
        if (!resolvedId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await profileService.getForumProfile(resolvedId, 20);
            setProfile(res?.data ?? res);
        } catch (err) {
            setError(err);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, [resolvedId]);



    // EFFECT THAT LOADS THE PROFILE ON MOUNT OR WHEN THE VIEWED USER CHANGES
    useEffect(() => {
        loadForumProfile();
    }, [loadForumProfile]);



    // SAVES EDITABLE FIELDS (BIO, COUNTRY, CURRENCIES) AND MERGES THEM LOCALLY
    const saveForumFields = useCallback(async (fields) => {
        if (!isOwnProfile) return Promise.reject(new Error('Not allowed'));
        setSaving(true);
        try {
            const res = await profileService.upsertProfile(fields);
            const data = res?.data ?? res;
            setProfile((prev) => (prev ? { ...prev, ...fields, ...data } : { ...fields, ...data }));
            return data;
        } finally {
            setSaving(false);
        }
    }, [isOwnProfile]);



    // UPLOADS THE AVATAR PHOTO AND SYNCS IT INTO THE GLOBAL AUTH STATE
    const uploadAvatarPhoto = useCallback(async (file) => {
        if (!isOwnProfile) return Promise.reject(new Error('Not allowed'));
        const validationError = validateImageFile(file);
        if (validationError) {
            setUploadError(validationError);
            return Promise.reject(new Error(validationError));
        }
        setUploadError('');
        setUploading('avatar');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await profileService.uploadProfilePhoto(formData);
            const url = res?.data?.url ?? res?.url;
            if (url) {
                setProfile((prev) => (prev ? { ...prev, profilePhotoUrl: url } : { profilePhotoUrl: url }));
                setAuth((prev) => (prev ? { ...prev, profilePhotoUrl: url } : prev));
            }
            return res;
        } catch (err) {
            setUploadError(err?.message || 'No se pudo subir la foto.');
            throw err;
        } finally {
            setUploading(null);
        }
    }, [isOwnProfile, setAuth]);



    // UPLOADS THE COVER PHOTO AND UPDATES THE LOCAL PROFILE STATE
    const uploadCoverImage = useCallback(async (file) => {
        if (!isOwnProfile) return Promise.reject(new Error('Not allowed'));
        const validationError = validateImageFile(file);
        if (validationError) {
            setUploadError(validationError);
            return Promise.reject(new Error(validationError));
        }
        setUploadError('');
        setUploading('cover');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await profileService.uploadCoverPhoto(formData);
            const url = res?.data?.url ?? res?.url;
            if (url) {
                setProfile((prev) => (prev ? { ...prev, coverPhotoUrl: url } : { coverPhotoUrl: url }));
            }
            return res;
        } catch (err) {
            setUploadError(err?.message || 'No se pudo subir la portada.');
            throw err;
        } finally {
            setUploading(null);
        }
    }, [isOwnProfile]);


    // FOLLOWS THE VIEWED PROFILE WITH OPTIMISTIC UI AND SERVER CONFIRMATION
    const followProfile = useCallback(async () => {
        if (isOwnProfile || !resolvedId || followBusy) return Promise.reject(new Error('Not allowed'));
        setFollowBusy(true);
        setProfile((prev) => (prev ? {
            ...prev,
            isFollowing: true,
            followersCount: (prev.followersCount || 0) + 1,
        } : prev));
        try {
            const res = await profileService.followUserProfile(resolvedId);
            const data = res?.data ?? res;
            setProfile((prev) => (prev ? {
                ...prev,
                isFollowing: data?.isFollowing ?? true,
                followersCount: data?.followersCount ?? prev.followersCount,
                followingCount: data?.followingCount ?? prev.followingCount,
            } : prev));
            return data;
        } catch (err) {
            await loadForumProfile();
            throw err;
        } finally {
            setFollowBusy(false);
        }
    }, [isOwnProfile, resolvedId, followBusy, loadForumProfile]);



    // UNFOLLOWS THE VIEWED PROFILE WITH OPTIMISTIC UI AND SERVER CONFIRMATION
    const unfollowProfile = useCallback(async () => {
        if (isOwnProfile || !resolvedId || followBusy) return Promise.reject(new Error('Not allowed'));
        setFollowBusy(true);
        setProfile((prev) => (prev ? {
            ...prev,
            isFollowing: false,
            followersCount: Math.max(0, (prev.followersCount || 0) - 1),
        } : prev));
        try {
            const res = await profileService.unfollowUserProfile(resolvedId);
            const data = res?.data ?? res;
            setProfile((prev) => (prev ? {
                ...prev,
                isFollowing: data?.isFollowing ?? false,
                followersCount: data?.followersCount ?? prev.followersCount,
                followingCount: data?.followingCount ?? prev.followingCount,
            } : prev));
            return data;
        } catch (err) {
            await loadForumProfile();
            throw err;
        } finally {
            setFollowBusy(false);
        }
    }, [isOwnProfile, resolvedId, followBusy, loadForumProfile]);


    return {
        profile,
        posts: profile?.posts || [],
        postsCount: profile?.postsCount || 0,
        loading,
        error,
        saving,
        uploading,
        uploadError,
        followBusy,
        isOwnProfile,
        refetch: loadForumProfile,
        saveForumFields,
        uploadAvatarPhoto,
        uploadCoverImage,
        followProfile,
        unfollowProfile,
    };
}
