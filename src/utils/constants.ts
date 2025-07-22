// src/utils/constants.ts
// BNB Smart Chain (BSC) Token Addresses
export const TOKEN_ADDRESSES: Record<string, string> = {
  // Popular BSC tokens
  'USDT': '0x55d398326f99059fF775485246999027B3197955', // Tether USD (BSC)
  'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USD Coin (BSC)
  'BUSD': '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // Binance USD (deprecated but might have balance)
  'CAKE': '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', // PancakeSwap Token
  'ADA': '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47',  // Cardano Token
  'DOT': '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402',  // Polkadot Token
  'LINK': '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD', // Chainlink Token
  'UNI': '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1',  // Uniswap Token
  'LTC': '0x4338665CBB7B2485A8855A139b75D5e34AB0DB94',  // Litecoin Token
  'BCH': '0x8fF795a6F4D97E7887C79beA79aba5cc76444aDf',  // Bitcoin Cash Token
  'EOS': '0x56b6fB708fC5732DEC32683D9bd18C5e20F1d04e',  // EOS Token
  'XRP': '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE',  // XRP Token
  'TRX': '0xCE7de646e7208a4Ef112cb6ed5038FA6cC6b12e3',  // TRON Token
  'MATIC': '0xCC42724C6683B7E57334c4E856f4c9965ED682bD', // Polygon Token
  'AVAX': '0x1CE0c2827e2eF14D5C4f29a091d735A204794041', // Avalanche Token
  'SHIB': '0x2859e4544C4bB03966803b044A93563Bd2D0DD4D',  // Shiba Inu Token
  'DOGE': '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', // Dogecoin Token
  
  // DeFi Tokens
  'ALPHA': '0xa1faa113cbE53436Df28FF0aEe54275c13B40183', // Alpha Finance
  'BETH': '0x250632378E573c6Be1AC2f97Fcdf00515d0Aa91B',  // Binance Beacon ETH
  'VAI': '0x4BD17003473389A42DAF6a0a729f6Fdb328BbBd7',   // VAI Stablecoin
  'XVS': '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63',   // Venus Token
  'SXP': '0x47BEAd2563dCBf3bF2c9407fEa4dC236fAbA485A',   // Swipe Token
  'BAKE': '0xE02dF9e3e622DeBdD69fb838bB799E3F168902c5',  // BakeryToken
  'BURGER': '0xAe9269f27437f0fcBC232d39Ec814844a51d6b8f', // BurgerSwap Token
  'AUTO': '0xa184088a740c695E156F91f5cC086a06bb78b827',  // Auto Token
  'BELT': '0xE0e514c71282b6f4e823703a39374Cf58dc3eA4f',  // Belt Token
  'BUNNY': '0xC9849E6fdB743d08fAeE3E34dd2D1bc69EA11a51', // Bunny Token
  
  // Gaming & NFT Tokens
  'TLM': '0x2222227E22102Fe3322098e4CBfE18cFebD57c95',   // Alien Worlds
  'AXS': '0x715D400F88537C0be9c3Ef2860F0A8e0feE6394F',   // Axie Infinity
  'MBOX': '0x3203c9E46cA618C8C1cE5dC67e7e9D75f5da2377',  // Mobox Token
  'CHR': '0xf9CeC8d50f6c8ad3Bb6c2558c0E1dC6CC37E3c94',   // Chromia Token
  'ALICE': '0xAC51066d7bEC65Dc4589368da368b212745d63E8', // My Neighbor Alice
  'SLP': '0x070a08BeEF8d36734dD67A491202Ff35a6A16d97',   // Smooth Love Potion
  
  // BSC Native & Bridge Tokens
  'ETH': '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',   // Ethereum Token
  'BTC': '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',   // Bitcoin Token
  'DAI': '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',   // Dai Stablecoin
  'FIL': '0x0D8Ce2A99Bb6e3B7Db580eD848240e4a0F9aE153',   // Filecoin Token
  'ATOM': '0x0Eb3a705fc54725037CC9e008bDede697f62F335', // Cosmos Token
  'XTZ': '0x16939ef78684453bfDFb47825F8a5F714f12623a',   // Tezos Token
  'ZIL': '0xb86AbCb37C3A4B64f74f59301AFF131a1BEcC787',   // Zilliqa Token
  'ONT': '0xFd7B3A77848f1C2D67E05E54d78d174a0C850335',   // Ontology Token
  
  // BSC Ecosystem Tokens  
  'ALPACA': '0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F', // Alpaca Finance
  'BANANA': '0x603c7f932ED1fc6575303D8Fb018fDCBb0f39a95', // ApeSwap Banana
  'BTCB': '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',  // Bitcoin BEP2
  'MDX': '0x9C65AB58d8d978DB963e63f2bfB7121627e3a739',   // Mdex Token
  'SWINGBY': '0x71DE20e0C4616E7fcBfDD3f875d568492cBE4739', // Swingby Token
  'WATCH': '0x7A9f28EB62C791422Aa23CeAE1dA9C847cBeC9b0',  // Yieldwatch Token
  'bMXX': '0x4131b87F74415190425ccD873048C708F8005823',   // Multiplier Token
  'HARD': '0xf79037F6f6bE66832DE4E7516be52826BC3cBcc4',   // Kava Lend Token
  'SWP': '0x47BEAd2563dCBf3bF2c9407fEa4dC236fAbA485A',    // Kava Swap Token
  
  // Meme & Community Tokens
  'SAFEMOON': '0x8076C74C5e3F5852037F31Ff0093Eeb8c8ADd8D3', // SafeMoon
  'BABY': '0x53E562b9B7E5E94b81f10e96Ee70Ad06df3D2657',     // BabySwap Token
  'KISHU': '0xA2B726B1145A4773F68593CF171187d8EBe4d495',     // Kishu Inu
};

// BNB Smart Chain Configuration
export const BSC_CHAIN_CONFIG = {
  chainId: '0x38', // 56 in hex
  chainName: 'BNB Smart Chain',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: ['https://bsc-dataseed1.binance.org/'],
  blockExplorerUrls: ['https://bscscan.com/'],
};

// Testnet Configuration (if needed)
export const BSC_TESTNET_CONFIG = {
  chainId: '0x61', // 97 in hex
  chainName: 'BNB Smart Chain Testnet',
  nativeCurrency: {
    name: 'tBNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
  blockExplorerUrls: ['https://testnet.bscscan.com/'],
};

// Common ABIs
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// Explorer URLs
export const EXPLORER_URLS = {
  BSC: 'https://bscscan.com',
  BSC_TESTNET: 'https://testnet.bscscan.com',
};

// Popular DEX Router Addresses (for future features)
export const DEX_ROUTERS = {
  PANCAKESWAP_V2: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  PANCAKESWAP_V3: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
  BISWAP: '0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8',
  APESWAP: '0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7',
};

export default {
  TOKEN_ADDRESSES,
  BSC_CHAIN_CONFIG,
  BSC_TESTNET_CONFIG,
  ERC20_ABI,
  EXPLORER_URLS,
  DEX_ROUTERS
};