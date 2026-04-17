import {
    get,
    post,
    escrowCreateOrderApi,
    escrowMyOrdersApi,
    escrowProviderOrdersApi,
    escrowOrderDetailApi,
    escrowConfirmPaymentApi,
    escrowReleaseFundsApi,
    escrowOpenDisputeApi,
    escrowCancelOrderApi,
} from '../api/http';

export default class Escrow {
    static async createOrder(body) {
        const { data } = await post(escrowCreateOrderApi, body)
        return data
    }

    static async getMyOrders() {
        const { data } = await get(escrowMyOrdersApi)
        return data
    }

    static async getProviderOrders() {
        const { data } = await get(escrowProviderOrdersApi)
        return data
    }

    static async getOrder(orderId) {
        const { data } = await get(`${escrowOrderDetailApi}/${orderId}`)
        return data
    }

    static async confirmPayment(orderId) {
        const { data } = await post(escrowConfirmPaymentApi, { orderId })
        return data
    }

    static async releaseFunds(orderId) {
        const { data } = await post(escrowReleaseFundsApi, { orderId })
        return data
    }

    static async openDispute(orderId, reason) {
        const { data } = await post(escrowOpenDisputeApi, { orderId, reason })
        return data
    }

    static async cancelOrder(orderId) {
        const { data } = await post(escrowCancelOrderApi, { orderId })
        return data
    }
}
