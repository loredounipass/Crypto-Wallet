import {
    get,
    post,
    escrowGasEstimateApi,
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
} from '../api/http';

export default class Escrow {
    static async getGasEstimate(coin, chainId) {
        const { data } = await get(escrowGasEstimateApi, { coin, chainId })
        return data
    }

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

    static async getDisputedOrders() {
        const { data } = await get(escrowDisputedOrdersApi)
        return data
    }

    static async resolveDispute(orderId, type) {
        const { data } = await post(escrowResolveDisputeApi, { orderId, type })
        return data
    }
}
