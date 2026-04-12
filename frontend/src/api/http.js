import axios from 'axios'
axios.defaults.withCredentials = true

const baseApi = 'http://localhost:4000/secure/api'

// Base origin for non-API assets (media). Derived from baseApi origin.
const apiOrigin = (() => {
    try { return new URL(baseApi).origin; } catch (_) { return 'http://localhost:4000'; }
})();
const mediaBase = `${apiOrigin}/uploads`;


// CSRF Token management - fetch token from server
async function fetchCsrfToken() {
    try {
        // The csrf-token endpoint is registered at the root level, outside the /secure/api prefix
        const response = await axios.get(`${apiOrigin}/csrf-token`, { withCredentials: true });
        if (response.data?.csrfToken) {
            return response.data.csrfToken;
        }
    } catch (err) {
        console.warn('Failed to fetch CSRF token:', err);
    }
    return null;
}

// Function to get CSRF token from cookie
function getCsrfTokenFromCookie() {
    try {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'XSRF-TOKEN') {
                return decodeURIComponent(value);
            }
        }
    } catch (_) {}
    return null;
}

// Initialize CSRF token on load
fetchCsrfToken().then(token => {
    if (token) {
        axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
    }
});

// Axios interceptor to add CSRF token to every request
axios.interceptors.request.use((config) => {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken) {
        config.headers['X-CSRF-TOKEN'] = csrfToken;
    }
    return config;
});

// CSRF token refresh on window focus (with cleanup to prevent memory leaks)
let csrfFocusHandler = null;

function setupCsrfRefresh() {
    if (typeof window !== 'undefined' && !csrfFocusHandler) {
        csrfFocusHandler = () => {
            fetchCsrfToken().then(token => {
                if (token) {
                    axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
                }
            });
        };
        window.addEventListener('focus', csrfFocusHandler);
    }
}

function cleanupCsrfListener() {
    if (typeof window !== 'undefined' && csrfFocusHandler) {
        window.removeEventListener('focus', csrfFocusHandler);
        csrfFocusHandler = null;
    }
}

// Initialize CSRF refresh
if (typeof window !== 'undefined') {
    setupCsrfRefresh();
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
const createChatApi = `${baseApi}/providers/createChat`
const sendMessageAsUserApi = `${baseApi}/providers/sendMessageAsUser`
const sendMessageAsProviderApi = `${baseApi}/providers/sendMessageAsProvider`
const getMessagesApi = `${baseApi}/providers/getMessages/:chatId`





const priceApi = 'https://min-api.cryptocompare.com/data/price?tsyms=USD&fsym='

async function get(url, body, config = {}) {
    return await axios.get(url, {
        params: body || {},
        ...config
    })
}

async function post(url, body) {
    return await axios.post(url, body)
}

async function postMultipart(url, formData) {
    return await axios.post(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

async function patch(url, body) {
    return await axios.patch(url, body)
}

export {
    get,
    post,
    postMultipart,
    patch,
    priceApi,
    mediaBase,
    apiOrigin,
    cleanupCsrfListener,
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
    createChatApi,
    sendMessageAsUserApi,
    sendMessageAsProviderApi,
    getMessagesApi,
    messagesApi,
    messagesUploadApi,
    myMessagesApi,
    profileApi,
    profileMeApi,
    profileByIdApi,
    profileUploadProfilePhotoApi
};
