import {
    get,
    post,
    postMultipart,
    profileMeApi,
    profileByIdApi,
    profileApi,
    profileUploadProfilePhotoApi,
} from '../api/http';




// FETCHES THE PROFILE INFORMATION FOR THE AUTHENTICATED USER
export async function getMyProfile() {
    return await get(profileMeApi, {});
}




// FETCHES A PUBLIC PROFILE USING THE SPECIFIED USER ID
export async function getProfileById(userId) {
    return await get(profileByIdApi(userId), {});
}




// CREATES OR UPDATES THE AUTHENTICATED USER PROFILE
export async function upsertProfile(body) {
    return await post(profileApi, body);
}




// UPLOADS A NEW PROFILE PHOTO FOR THE AUTHENTICATED USER
export async function uploadProfilePhoto(formData) {
    return await postMultipart(profileUploadProfilePhotoApi, formData);
}
