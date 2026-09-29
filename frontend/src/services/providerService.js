import {
    get,
    post,
    patch,
    del,
    createProvider,
    findByEMail,
    getAllProviders,
    updateProviderApi,
    checkTermsApi,
    acceptTermsApi,
    providerSettingsApi,
    providerAddPaymentMethodApi,
    providerDeletePaymentMethodApi,
    providerUpdateDestinationWalletApi,
    providerToggleDestinationWalletApi
} from '../api/http';

export default class Provider {



    // REGISTERS A NEW FIAT PROVIDER ACCOUNT
    static async createProvider(body) {
        const { data } = await post(createProvider, body)
        return data
    }




    // SEARCHES FOR A SPECIFIC FIAT PROVIDER BY THEIR EMAIL ADDRESS
    static async findByEMail(email) {
        const { data } = await get(findByEMail.replace(':email', email))
        return data
    }




    // RETRIEVES A LIST OF ALL FIAT PROVIDERS IN THE SYSTEM
    static async getAllProviders() {
        const { data } = await get(getAllProviders)
        return data
    }




    // UPDATES THE CONFIGURATION AND PROFILE OF AN EXISTING PROVIDER
    static async updateProvider(body) {
        const { data } = await patch(updateProviderApi, body)
        return data
    }




    // CHECKS IF THE CURRENT PROVIDER HAS ACCEPTED THE LATEST TERMS OF SERVICE
    static async checkTerms() {
        const { data } = await get(checkTermsApi)
        return data
    }




    // CONFIRMS THE PROVIDER'S ACCEPTANCE OF THE TERMS OF SERVICE
    static async acceptTerms() {
        const { data } = await post(acceptTermsApi)
        return data
    }




    // FETCHES THE FIAT PROVIDER SETTINGS AND CONFIGURED PAYMENT METHODS
    static async getSettings(signal) {
        const { data } = await get(providerSettingsApi, {}, { signal })
        return data
    }




    // ADDS A NEW PAYMENT METHOD TO THE PROVIDER SETTINGS
    static async addPaymentMethod(body) {
        const { data } = await post(providerAddPaymentMethodApi, body)
        return data
    }




    // REMOVES AN EXISTING PAYMENT METHOD FROM THE PROVIDER SETTINGS
    static async deletePaymentMethod(method) {
        const { data } = await del(providerDeletePaymentMethodApi(method))
        return data
    }




    // UPDATES THE DESTINATION WALLET CONFIGURATION FOR THE PROVIDER
    static async updateDestinationWallet(body) {
        const { data } = await patch(providerUpdateDestinationWalletApi, body)
        return data
    }




    // ENABLES OR DISABLES THE DESTINATION WALLET FEATURE
    static async toggleDestinationWallet(body) {
        const { data } = await post(providerToggleDestinationWalletApi, body)
        return data
    }

}