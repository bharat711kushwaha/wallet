// src/types/ethereum.d.ts
export interface NetworkConfig {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

declare global {
  interface Window {
    ethereum?: {
      isTokenPocket?: boolean;
      isMetaMask?: boolean;
      isSafePal?: boolean;
      providers?: any[];
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      selectedAddress?: string;
      chainId?: string;
      isConnected?: () => boolean;
    };
  }
}

export {};