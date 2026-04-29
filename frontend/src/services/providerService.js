import {
    get,
    post,
    patch,
    createProvider,
    findByEMail,
    getAllProviders,
    updateProviderApi,
    checkTermsApi,
    acceptTermsApi
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

}