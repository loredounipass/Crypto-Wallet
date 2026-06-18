const crypto = require('crypto')

/**
 * Generates a globally unique deterministic ID for an ERC20 Transfer event.
 * Ensures cross-layer traceability.
 */
function generateEventId(chainId, txHash, logIndex, tokenAddress) {
    const input = `${chainId}-${txHash.toLowerCase()}-${logIndex}-${tokenAddress.toLowerCase()}`
    return crypto.createHash('sha256').update(input).digest('hex')
}

module.exports = { generateEventId }
