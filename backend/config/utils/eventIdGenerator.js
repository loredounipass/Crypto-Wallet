const crypto = require('crypto')



// GENERA UN IDENTIFICADOR UNICO DETERMINISTA PARA CADA EVENTO DE TRANSFERENCIA MEDIANTE UN HASH SHA256
function generateEventId(chainId, txHash, logIndex, tokenAddress) {
    const input = `${chainId}-${txHash.toLowerCase()}-${logIndex}-${tokenAddress.toLowerCase()}`
    return crypto.createHash('sha256').update(input).digest('hex')
}

module.exports = { generateEventId }
