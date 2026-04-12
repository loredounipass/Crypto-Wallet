import {
    get,
    post,
    postMultipart,
    profileMeApi,
    profileByIdApi,
    profileApi,
    profileUploadProfilePhotoApi,
} from '../api/http';

/**
 * Obtiene el perfil del usuario autenticado.
 */
export async function getMyProfile() {
    return await get(profileMeApi, {});
}

/**
 * Obtiene un perfil público por ID de usuario (owner).
 */
export async function getProfileById(userId) {
    return await get(profileByIdApi(userId), {});
}

/**
 * Crea o actualiza el perfil del usuario autenticado.
 * @param {Object} body - { firstName?, lastName?, links?, gender?, relationshipStatus?, interests?, bio?, likes? }
 */
export async function upsertProfile(body) {
    return await post(profileApi, body);
}

/**
 * Sube la foto de perfil (multipart/form-data con campo 'file').
 */
export async function uploadProfilePhoto(formData) {
    return await postMultipart(profileUploadProfilePhotoApi, formData);
}
