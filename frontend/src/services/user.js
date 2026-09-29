import {
    get,
    post,
    patch,
    registerApi,
    loginApi,
    logoutApi,
    userInfoApi,
    verifyTokenApi,
    changePasswordApi,
    updateTokenStatusApi,
    tokenStatusApi,
    resendTokenApi,
    updateUserProfileApi,
    sendVerificationEmailApi,
    verifyEmailApi,
    isEmailVerifiedApi,
    toggleAdminApi
    
} from '../api/http';

export default class User {



    // REGISTERS A NEW USER ACCOUNT WITH THE PROVIDED DETAILS
    static async register(body) {
        return await post(registerApi, body);
    }




    // AUTHENTICATES A USER AND CREATES A NEW SESSION
    static async login(body) {
        return await post(loginApi, body);
    }




    // VERIFIES A 2FA TOKEN FOR SECURITY ACTIONS OR LOGIN
    static async verifyToken(body) {
        return await post(verifyTokenApi, body);
    }




    // LOGS OUT THE CURRENTLY AUTHENTICATED USER AND CLEARS THEIR SESSION
    static async logout() {
        return await post(logoutApi, {});
    }




    // FETCHES THE PROFILE AND ACCOUNT INFORMATION OF THE LOGGED IN USER
    static async getInfo() {
        return await get(userInfoApi, {});
    }




    // FETCHES THE CURRENT 2FA TOKEN CONFIGURATION STATUS FOR THE USER
    static async getTokenStatus(config) {
        return await get(tokenStatusApi, {}, config);
    }




    // UPDATES THE USER'S ACCOUNT PASSWORD
    static async changePassword(body) {
        return await post(changePasswordApi, body);
    }




    // ENABLES OR DISABLES 2FA SETTINGS FOR THE CURRENT USER
    static async updateTokenStatus(body) { 
        return await patch(updateTokenStatusApi, body);
    }




    // RESENDS A NEW 2FA VERIFICATION TOKEN TO THE USER
    static async resendToken(body) {
        return await post(resendTokenApi, body);
    }




    // UPDATES THE PROFILE DETAILS OF THE CURRENT USER
    static async updateProfile(body) {
        return await post(updateUserProfileApi, body);
    }




    // SUBMITS A VERIFICATION TOKEN RECEIVED VIA EMAIL TO CONFIRM THE ADDRESS
    static async verifyEmail(body) {
        return await post(verifyEmailApi, body);
    }




    // REQUESTS A NEW VERIFICATION EMAIL TO BE SENT TO THE USER
    static async sendVerificationEmail(body) {
        return await post(sendVerificationEmailApi, body);
    }




    // CHECKS IF THE LOGGED IN USER'S EMAIL HAS BEEN SUCCESSFULLY VERIFIED
    static async isEmailVerified(body) {
        return await get(isEmailVerifiedApi, body);
    }
    



    // TOGGLES THE ADMINISTRATOR PRIVILEGES FOR A SPECIFIED USER
    static async toggleAdmin(body) {
        return await post(toggleAdminApi, body);
    }
}
