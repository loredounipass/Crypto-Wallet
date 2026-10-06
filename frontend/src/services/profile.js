import {
    get,
    post,
    del,
    postMultipart,
    profileMeApi,
    profileByIdApi,
    profileApi,
    profileForumApi,
    profileFollowApi,
    profileFollowStateApi,
    profileUploadProfilePhotoApi,
    profileUploadCoverPhotoApi,
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



// UPLOADS A NEW COVER PHOTO FOR THE AUTHENTICATED USER
export async function uploadCoverPhoto(formData) {
    return await postMultipart(profileUploadCoverPhotoApi, formData);
}



// FETCHES THE FORUM PROFILE (IDENTITY + P2P + WALL) IN A SINGLE CALL
export async function getForumProfile(userId, limit = 20) {
    return await get(profileForumApi(userId, limit), {});
}



// FOLLOWS THE GIVEN PROFILE AND RETURNS THE UPDATED FOLLOW STATE
export async function followUserProfile(userId) {
    return await post(profileFollowApi(userId), {});
}



// UNFOLLOWS THE GIVEN PROFILE AND RETURNS THE UPDATED FOLLOW STATE
export async function unfollowUserProfile(userId) {
    return await del(profileFollowApi(userId));
}



// FETCHES THE FOLLOW STATE AND COUNTS AGAINST THE GIVEN PROFILE
export async function getFollowState(userId) {
    return await get(profileFollowStateApi(userId), {});
}
