const normalizeCoin = (coin) => {
    if (coin === undefined || coin === null) return ''

    const normalized = String(coin).trim().toLowerCase()
    const aliases = {
        ethereum: 'eth',
        polygon: 'matic',
        avalanche: 'avax',
        fantom: 'ftm',
        optimism: 'op',
        'binance smart chain': 'bnb',
        binance: 'bnb'
    }

    return aliases[normalized] || normalized
}

const getCoinFallbackLogo = (coin) => {
    const normalizedCoin = normalizeCoin(coin)
    const labels = {
        bnb: 'BNB',
        avax: 'AVAX',
        eth: 'ETH',
        matic: 'MATIC',
        ftm: 'FTM',
        op: 'OP'
    }
    const colors = {
        bnb: '#F3BA2F',
        avax: '#E84142',
        eth: '#627EEA',
        matic: '#8247E5',
        ftm: '#1969FF',
        op: '#FF0420'
    }
    const label = labels[normalizedCoin] || (String(coin || 'COIN').trim().toUpperCase().slice(0, 6) || 'COIN')
    const color = colors[normalizedCoin] || '#1976D2'
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="${color}"/><text x="32" y="37" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF">${label}</text></svg>`

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const getNetworkName = (chainId) => {
    return getNetWorkList().find(network => network.id === chainId).name
}

const getCoinList = () => {
    return [
        'bnb',
        'avax',
        'ftm',
        'eth',
        'matic',
        'op'
    ]
}

const getCoinLogo = (coin) => {
    const baseApi = 'https://cryptologos.cc/logos'
    const normalizedCoin = normalizeCoin(coin)

    return {
        bnb: `${baseApi}/bnb-bnb-logo.png`,
        avax: `${baseApi}/avalanche-avax-logo.png`,
        eth: `${baseApi}/ethereum-eth-logo.png`,
        matic: `${baseApi}/polygon-matic-logo.png`,
        ftm: `${baseApi}/fantom-ftm-logo.png`,
        op: `${baseApi}/optimism-ethereum-op-logo.png`

    }[normalizedCoin] || getCoinFallbackLogo(coin)
}

const getDefaultCoin = () => {
    return getCoinList()[0]
}

const getNetWorkList = (coin) => {
    const networks = [
        {
            id: 97,
            name: 'Binance Smart Chain',
            abbr: 'bsc',
            coin: 'bnb',
            explorerBase: 'https://testnet.bscscan.com/tx/'
        },
        {
            id: 43113,
            name: 'Avalanche',
            abbr: 'avalanche',
            coin: 'avax',
            explorerBase: 'https://testnet.snowtrace.io/tx/'
        },
        {
            id: 11155111,
            name: 'Ethereum',
            abbr: 'ethereum',
            coin: 'eth',
            explorerBase: 'https://sepolia-optimism.etherscan.io/tx'
        },
        {
            id: 4002,
            name: 'Fantom',
            abbr: 'fantom',
            coin: 'ftm',
            explorerBase: 'https://testnet.ftmscan.com/tx/'
        },
        {
            id: 80002,
            name: 'Polygon',
            abbr: 'polygon',
            coin: 'matic',
            explorerBase: 'https://amoy.polygonscan.com/tx/'
        },


        {
            id: 11155420,
            name: 'Optimism',
            abbr: 'optimism',
            coin: 'op',
            explorerBase: 'https://sepolia-optimism.etherscan.io/tx/'
        }
        

            
    ]

    return coin ?
        networks.filter(network => network.coin === coin.toLowerCase())
        : networks
}

const getDefaultNetworkId = (coin) => {
    return {
        bnb: 97,
        avax: 43113,
        eth: 11155111,
        ftm: 4002,
        matic: 80002,
        op: 11155420
    }[coin.toLowerCase()]
}

const getNetworkExplorerBase = (chainId) => {
    return getNetWorkList().find(network => network.id === chainId).explorerBase
}

const getCoinFee = (coin) => {
    switch (coin.toUpperCase()) {
        case 'BNB': return 0.005;
        case 'AVAX': return 0.001;
        case 'ETH': return 0.005;
        case 'MATIC': return 0.1;
        case 'FTM': return 0.5;
        case 'OP': return 0.005;
        default: return 0;
    }
}

const getCoinDecimalsPlace = (coin) => {
    switch (coin.toUpperCase()) {
        case 'BNB': return 8;
        case 'AVAX': return 4;
        case 'ETH': return 8;
        case 'MATIC': return 2;
        case 'FTM': return 2;
        case 'OP': return 18;
        default: return 8;
    }
}

export {
    getNetworkName,
    getCoinFee,
    getNetworkExplorerBase,
    getNetWorkList,
    getDefaultNetworkId,
    getCoinList,
    getDefaultCoin,
    getCoinLogo,
    getCoinDecimalsPlace,
    getCoinFallbackLogo,
    normalizeCoin
}
