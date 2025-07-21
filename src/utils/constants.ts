// src/utils/constants.ts
// src/utils/constants.ts
import type { NetworkConfig } from '../types/ethereum';

export const BNB_CHAIN_CONFIG: NetworkConfig = {
  chainId: '0x38', // 56 in decimal
  chainName: 'BNB Smart Chain',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: ['https://bsc-dataseed1.binance.org/'],
  blockExplorerUrls: ['https://bscscan.com/'],
};

export const TOKEN_ADDRESSES = {
  USDT: '0x55d398326f99059ff775485246999027b3197955',
  USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
} as const;