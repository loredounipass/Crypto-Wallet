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



    // FETCHES THE ESTIMATED GAS FEE FOR A SPECIFIC COIN AND CHAIN
    static async getGasEstimate(coin, chainId) {
        const { data } = await get(escrowGasEstimateApi, { coin, chainId })
        return data
    }




    // CREATES A NEW P2P ESCROW ORDER WITH THE PROVIDED DETAILS
    static async createOrder(body) {
        const { data } = await post(escrowCreateOrderApi, body)
        return data
    }




    // RETRIEVES ALL ESCROW ORDERS INITIATED BY THE CURRENT USER
    static async getMyOrders() {
        const { data } = await get(escrowMyOrdersApi)
        return data
    }




    // RETRIEVES ALL ESCROW ORDERS WHERE THE CURRENT USER ACTS AS THE PROVIDER
    static async getProviderOrders() {
        const { data } = await get(escrowProviderOrdersApi)
        return data
    }




    // FETCHES THE DETAILS OF A SPECIFIC ESCROW ORDER BY ITS ID
    static async getOrder(orderId) {
        const { data } = await get(`${escrowOrderDetailApi}/${orderId}`)
        return data
    }




    // CONFIRMS THAT FIAT PAYMENT HAS BEEN SENT FOR A GIVEN ORDER
    static async confirmPayment(orderId) {
        const { data } = await post(escrowConfirmPaymentApi, { orderId })
        return data
    }




    // RELEASES THE CRYPTO FUNDS TO THE BUYER AFTER PAYMENT VERIFICATION
    static async releaseFunds(orderId) {
        const { data } = await post(escrowReleaseFundsApi, { orderId })
        return data
    }




    // OPENS A DISPUTE FOR AN ORDER WITH A SPECIFIC REASON
    static async openDispute(orderId, reason) {
        const { data } = await post(escrowOpenDisputeApi, { orderId, reason })
        return data
    }




    // CANCELS AN ESCROW ORDER RETURNING FUNDS TO THE ORIGINAL OWNER
    static async cancelOrder(orderId) {
        const { data } = await post(escrowCancelOrderApi, { orderId })
        return data
    }




    // RETRIEVES A LIST OF ALL ESCROW ORDERS CURRENTLY UNDER DISPUTE
    static async getDisputedOrders() {
        const { data } = await get(escrowDisputedOrdersApi)
        return data
    }




    // RESOLVES AN ACTIVE DISPUTE RELEASING OR REVERTING THE ESCROWED FUNDS
    static async resolveDispute(orderId, type) {
        const { data } = await post(escrowResolveDisputeApi, { orderId, type })
        return data
    }
}
