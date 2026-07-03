import axios from 'axios'
import i18n from '../languages/i18n';


const baseApi = process.env.REACT_APP_API_BASE_URL;
const api = axios.create({
    baseURL: baseApi,
    withCredentials: true,
    timeout: 10000,
});

const apiOrigin = new URL(baseApi).origin;
const mediaBase = `${apiOrigin}/uploads`;
const csrfTokenApi = `${apiOrigin}/csrf-token`;

// Interceptor global para unificar errores del backend
api.interceptors.response.use(
    (response) => response,
    (error) => {
        let msg = 'Ocurrió un error inesperado.';
        if (error.response?.data?.msg) {
            msg = error.response.data.msg;
        } else if (error.response?.data?.message) {
            msg = error.response.data.message;
        } else if (error.response?.data?.error) {
            msg = error.response.data.error;
        } else if (error.message) {
            msg = error.message;
        }

        if (Array.isArray(msg)) {
            msg = msg.join('. ');
        } else if (typeof msg === 'object' && msg !== null) {
            msg = JSON.stringify(msg);
        }

        error.message = i18n.isInitialized ? i18n.t(msg, { defaultValue: msg }) : msg;
        return Promise.reject(error);
    }
);

// Fetch and set CSRF token globally with retries for startup timing issues
async function fetchCsrfToken(retries = 5, delayMs = 2000) {
    try {
        const response = await axios.get(csrfTokenApi, { withCredentials: true });
        const { csrfToken } = response.data;
        if (csrfToken) {
            // Attach token to all future requests from this 'api' instance
            api.defaults.headers.common['x-csrf-token'] = csrfToken;
            console.log('CSRF token fetched successfully');
        }
    } catch (error) {
        console.error(`Failed to fetch CSRF token. Retries left: ${retries}`);
        if (retries > 0) {
            setTimeout(() => fetchCsrfToken(retries - 1, delayMs * 1.5), delayMs);
        }
    }
}

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
const withdrawTokenApi = `${baseApi}/wallet/withdraw-token`
const tokenBalancesApi = `${baseApi}/wallet/tokens`

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

// Endpoints support
const supportChatApi = `${baseApi}/support/chat`

// Endpoints donations
const donationsWalletsApi = `${baseApi}/donations/wallets`

// Endpoints languages
const languagesApi = `${baseApi}/languages`
const userLanguageApi = `${baseApi}/user/language`

// Endpoints news
// const newsApi = `${baseApi}/news`
// const newsCategoriesApi = `${baseApi}/news/categories`

// Endpoints feed
const feedApi = `${baseApi}/feed`
const feedVideosApi = `${baseApi}/feed/videos`
const feedUploadApi = `${baseApi}/feed/upload`
const feedPostByIdApi = (id) => `${baseApi}/feed/${id}`
const feedPostCommentsApi = (id) => `${baseApi}/feed/${id}/comments`
const feedCommentLikesApi = (commentId) => `${baseApi}/feed/comments/${commentId}/likes`
const feedPostLikesApi = (id) => `${baseApi}/feed/${id}/likes`
const feedPostViewsApi = (id) => `${baseApi}/feed/${id}/views`
const feedPostSharesApi = (id) => `${baseApi}/feed/${id}/shares`
const feedCommentDeleteApi = (commentId) => `${baseApi}/feed/comments/${commentId}`

// Endpoints escrow P2P
const escrowCreateOrderApi = `${baseApi}/escrow/create-order`
const escrowMyOrdersApi = `${baseApi}/escrow/orders`
const escrowProviderOrdersApi = `${baseApi}/escrow/provider-orders`
const escrowOrderDetailApi = `${baseApi}/escrow/order`
const escrowConfirmPaymentApi = `${baseApi}/escrow/confirm-payment`
const escrowReleaseFundsApi = `${baseApi}/escrow/release-funds`
const escrowOpenDisputeApi = `${baseApi}/escrow/open-dispute`
const escrowCancelOrderApi = `${baseApi}/escrow/cancel-order`
const escrowDisputedOrdersApi = `${baseApi}/escrow/disputed-orders`
const escrowResolveDisputeApi = `${baseApi}/escrow/resolve-dispute`





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
    return await api.post(url, formData, { timeout: 120000 })
}

async function patch(url, body) {
    return await api.patch(url, body)
}

async function del(url) {
    return await api.delete(url)
}

export {
    get,
    getExternal,
    post,
    postMultipart,
    patch,
    del,
    fetchCsrfToken,
    mediaBase,
    apiOrigin,

    loginApi,
    logoutApi,
    registerApi,
    userInfoApi,
    withdrawApi,
    withdrawTokenApi,
    walletInfoApi,
    walletCreateApi,
    tokenBalancesApi,
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
    supportChatApi,
    escrowCreateOrderApi,
    escrowMyOrdersApi,
    escrowProviderOrdersApi,
    escrowOrderDetailApi,
    escrowConfirmPaymentApi,
    escrowReleaseFundsApi,
    escrowOpenDisputeApi,
    escrowCancelOrderApi,
    escrowDisputedOrdersApi,
    escrowResolveDisputeApi,
    // newsApi,
    // newsCategoriesApi,
    feedApi,
    feedVideosApi,
    feedUploadApi,
    feedPostByIdApi,
    feedPostCommentsApi,
    feedCommentLikesApi,
    feedPostLikesApi,
    feedPostViewsApi,
    feedPostSharesApi,
    feedCommentDeleteApi,
    donationsWalletsApi,
    languagesApi,
    userLanguageApi
};
