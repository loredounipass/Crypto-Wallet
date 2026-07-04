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
    static async createProvider(body) {
        const { data } = await post(createProvider, body)
        return data
    }

    static async findByEMail(email) {
        const { data } = await get(findByEMail.replace(':email', email))
        return data
    }

    static async getAllProviders() {
        const { data } = await get(getAllProviders)
        return data
    }

    static async updateProvider(body) {
        const { data } = await patch(updateProviderApi, body)
        return data
    }

    static async checkTerms() {
        const { data } = await get(checkTermsApi)
        return data
    }

    static async acceptTerms() {
        const { data } = await post(acceptTermsApi)
        return data
    }

    static async getSettings() {
        const { data } = await get(providerSettingsApi)
        return data
    }

    static async addPaymentMethod(body) {
        const { data } = await post(providerAddPaymentMethodApi, body)
        return data
    }

    static async deletePaymentMethod(method) {
        const { data } = await del(providerDeletePaymentMethodApi(method))
        return data
    }

    static async updateDestinationWallet(body) {
        const { data } = await patch(providerUpdateDestinationWalletApi, body)
        return data
    }

    static async toggleDestinationWallet(body) {
        const { data } = await post(providerToggleDestinationWalletApi, body)
        return data
    }

}