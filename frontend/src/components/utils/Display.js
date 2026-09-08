const getDisplayableTxHash = (txHash) => {
    if (!txHash) return '-';
    return `${txHash.slice(0, 15)}...`
}

const getDisplayableAddress = (address) => {
    return `${address.slice(0, 12)}...${address.slice(-12)}`
}

const getStatusName = (code) => {
    return {
        0: 'tx_status_pending',
        1: 'tx_status_approving',
        2: 'tx_status_processing',
        3: 'tx_status_completed',
        4: 'tx_status_cancelled',
        5: 'tx_status_failed',
    }[code] || 'tx_status_no_info'
}

export {
    getDisplayableTxHash,
    getDisplayableAddress,
    getStatusName
}