import Transaction from "../services/transaction"



// FUNCTION THAT RETRIEVES THE DETAILED INFORMATION OF A SPECIFIC TRANSACTION BY ITS ID
export default async function getTransaction(transactionId) {
    try {
        let { data } = await Transaction.getTransaction(transactionId)
        if (data)
            return data
    } catch (err) { }
}