import axios from 'axios'

const fallbackBaseApi = 'https://effective-journey-rqr4g6grxrghv57-4000.app.github.dev/secure/api';
const configuredBaseApi = process.env.REACT_APP_API_BASE_URL || fallbackBaseApi;

const baseApi = configuredBaseApi;
const api = axios.create({
    baseURL: baseApi,
    withCredentials: true,
    timeout: 10000,
});

// Base origin for non-API assets (media). Derived from baseApi origin.
const apiOrigin = (() => {
    try { return new URL(baseApi).origin; } catch (_) { return 'https://effective-journey-rqr4g6grxrghv57-4000.app.github.dev'; }
})();
const mediaBase = `${apiOrigin}/uploads`;


// Endpoints usuario
const loginApi = `${baseApi}/user/login`
const logoutApi = `${baseApi}/user/logout`
const registerApi = `${baseApi}/user/register`
const userInfoApi = `${baseApi}/user/info`
const updateUserProfileApi = `${baseApi}/user/update-profile`
const changePasswordApi = `${baseApi}/user/change-password`;
const verifyTokenApi = `${baseApi}/user/verify-token`;
const updateTokenStatusApi = `${baseApi}/user/update-token-status`;
const tokenStatusApi = `${baseApi}/user/token-status`;
const resendTokenApi = `${baseApi}/user/resend-token`
const verifyEmailApi = `${baseApi}/user/verify-email`;
const sendVerificationEmailApi = `${baseApi}/user/send-verification-email`;
const isEmailVerifiedApi = `${baseApi}/user/is-email-verified`;
const forgotPasswordApi = `${baseApi}/user/forgot-password`;
const resetPasswordApi = `${baseApi}/user/reset-password`;

// Endpoints wallet
const walletInfoApi = `${baseApi}/wallet/info`
const allWalletInfoApi = `${baseApi}/wallet/all`
const walletCreateApi = `${baseApi}/wallet/create`
const withdrawApi = `${baseApi}/wallet/withdraw`

// Endpoints transacción
const transactionsApi = `${baseApi}/transaction/all`
const transactionApi = `${baseApi}/transaction/info`

//endpoints de mensajes y multimedia
const messagesApi = `${baseApi}/messages`
const messagesUploadApi = `${baseApi}/messages/upload`
const myMessagesApi = `${baseApi}/messages/me`


// profile endpoints
const profileApi = `${baseApi}/profile`
const profileMeApi = `${profileApi}/me`
const profileByIdApi = (id) => `${profileApi}/${id}`
const profileUploadProfilePhotoApi = `${profileApi}/upload/profile-photo`

// Endpoints provider
const createProvider = `${baseApi}/providers/create`
const findByEMail = `${baseApi}/providers/findByEMail/:email`
const getAllProviders = `${baseApi}/providers/allProviders`
const updateProviderApi = `${baseApi}/providers/update`
const checkTermsApi = `${baseApi}/providers/terms/check`
const acceptTermsApi = `${baseApi}/providers/terms/accept`

// Endpoints escrow P2P
const escrowCreateOrderApi = `${baseApi}/escrow/create-order`
const escrowMyOrdersApi = `${baseApi}/escrow/orders`
const escrowProviderOrdersApi = `${baseApi}/escrow/provider-orders`
const escrowOrderDetailApi = `${baseApi}/escrow/order`
const escrowConfirmPaymentApi = `${baseApi}/escrow/confirm-payment`
const escrowReleaseFundsApi = `${baseApi}/escrow/release-funds`
const escrowOpenDisputeApi = `${baseApi}/escrow/open-dispute`
const escrowCancelOrderApi = `${baseApi}/escrow/cancel-order`





const priceApi = 'https://min-api.cryptocompare.com/data/price?tsyms=USD&fsym='

async function get(url, body, config = {}) {
    return await api.get(url, {
        params: body || {},
        ...config
    })
}

// External/public APIs must not send app CSRF headers or cookies.
async function getExternal(url, config = {}) {
    const safeHeaders = { ...(config.headers || {}) };

    return await axios.get(url, {
        ...config,
        withCredentials: false,
        headers: safeHeaders
    });
}

async function post(url, body) {
    return await api.post(url, body)
}

async function postMultipart(url, formData) {
    return await api.post(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

async function patch(url, body) {
    return await api.patch(url, body)
}

export {
    get,
    getExternal,
    post,
    postMultipart,
    patch,
    priceApi,
    mediaBase,
    apiOrigin,
    loginApi,
    logoutApi,
    registerApi,
    userInfoApi,
    withdrawApi,
    walletInfoApi,
    walletCreateApi,
    transactionsApi,
    allWalletInfoApi,
    transactionApi,
    verifyTokenApi,
    changePasswordApi,
    updateTokenStatusApi,
    tokenStatusApi,
    resendTokenApi,
    updateUserProfileApi,
    verifyEmailApi,
    sendVerificationEmailApi,
    isEmailVerifiedApi,
    forgotPasswordApi,
    resetPasswordApi,
    createProvider,
    findByEMail,
    getAllProviders,
    updateProviderApi,
    checkTermsApi,
    acceptTermsApi,
    messagesApi,
    messagesUploadApi,
    myMessagesApi,
    profileApi,
    profileMeApi,
    profileByIdApi,
    profileUploadProfilePhotoApi,
    escrowCreateOrderApi,
    escrowMyOrdersApi,
    escrowProviderOrdersApi,
    escrowOrderDetailApi,
    escrowConfirmPaymentApi,
    escrowReleaseFundsApi,
    escrowOpenDisputeApi,
    escrowCancelOrderApi
};
