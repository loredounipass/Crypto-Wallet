import {
    get,
    post,
    patch,
    createProvider,
    findByEMail,
    getAllProviders,
    updateProviderApi
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

}