// useTokenPocket.ts - TypeScript Custom Hook
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Type definitions
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

interface EthereumProvider {
  isTokenPocket?: boolean;
  isMetaMask?: boolean;
  isSafePal?: boolean;
  providers?: EthereumProvider[];
  request: (args: RequestArguments) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  selectedAddress?: string;
  chainId?: string;
  isConnected?: () => boolean;
}

interface RequestArguments {
  method: string;
  params?: any[] | Record<string, any>;
}

interface NetworkConfig {
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

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  isLoading: boolean;
  error: string | null;
  chainId: string | null;
  isTokenPocketAvailable: boolean;
}

interface ConnectionResult {
  success: boolean;
  address?: string;
  error?: string;
}

interface SendTransactionResult {
  success: boolean;
  hash?: string;
  tx?: ethers.providers.TransactionResponse;
  error?: string;
}

interface TransactionHistoryItem {
  hash: string;
  from: string;
  to: string | null;
  value: ethers.BigNumber;
  blockNumber: number;
  timestamp?: number;
  gasPrice: ethers.BigNumber;
  gasUsed?: ethers.BigNumber;
}

// Hook return type
interface UseTokenPocketReturn {
  // State
  isConnected: boolean;
  address: string | null;
  balance: string;
  isLoading: boolean;
  error: string | null;
  chainId: string | null;
  isTokenPocketAvailable: boolean;
  
  // Computed values
  isOnBNBChain: boolean;
  formattedAddress: string | null;
  
  // Functions
  connect: () => Promise<ConnectionResult>;
  disconnect: () => void;
  updateBalance: () => Promise<void>;
  switchToBNBChain: () => Promise<void>;
  sendBNB: (to: string, amount: string | number) => Promise<SendTransactionResult>;
  getTransactionHistory: (limit?: number) => Promise<TransactionHistoryItem[]>;
  checkAvailability: () => boolean;
  addToken: (tokenAddress: string, tokenSymbol: string, tokenDecimals: number) => Promise<boolean>;
  getTokenBalance: (tokenAddress: string, tokenABI: string[]) => Promise<string>;
}

// BNB Chain configuration
const BNB_CHAIN_CONFIG: NetworkConfig = {
  chainId: '0x38',
  chainName: 'BNB Smart Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: ['https://bsc-dataseed1.binance.org/'],
  blockExplorerUrls: ['https://bscscan.com/'],
};

// Main hook
export const useTokenPocket = (): UseTokenPocketReturn => {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: '0',
    isLoading: false,
    error: null,
    chainId: null,
    isTokenPocketAvailable: false
  });

  // Check TokenPocket availability
  const checkAvailability = useCallback((): boolean => {
    const isAvailable = typeof window.ethereum !== 'undefined' && 
                       Boolean(window.ethereum.isTokenPocket);
    
    setState(prev => ({
      ...prev,
      isTokenPocketAvailable: isAvailable
    }));
    
    return isAvailable;
  }, []);

  // Connect function
  const connect = useCallback(async (): Promise<ConnectionResult> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (!window.ethereum?.isTokenPocket) {
        throw new Error('Please use TokenPocket browser to connect');
      }

      const accounts: string[] = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Switch to BNB Chain
      await switchToBNBChain();

      const chainId: string = await window.ethereum.request({
        method: 'eth_chainId'
      });

      setState(prev => ({
        ...prev,
        isConnected: true,
        address: accounts[0],
        chainId,
        isLoading: false
      }));

      // Get balance
      await updateBalanceInternal(accounts[0]);

      // Save to localStorage
      localStorage.setItem('tokenPocketConnected', 'true');
      localStorage.setItem('lastConnectedAddress', accounts[0]);

      return { success: true, address: accounts[0] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Disconnect function
  const disconnect = useCallback((): void => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      address: null,
      balance: '0',
      isLoading: false,
      error: null,
      chainId: null
    }));

    localStorage.removeItem('tokenPocketConnected');
    localStorage.removeItem('lastConnectedAddress');
  }, []);

  // Switch to BNB Chain
  const switchToBNBChain = useCallback(async (): Promise<void> => {
    if (!window.ethereum) {
      throw new Error('Wallet not available');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BNB_CHAIN_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [BNB_CHAIN_CONFIG],
        });
      } else {
        throw switchError;
      }
    }
  }, []);

  // Internal balance update function
  const updateBalanceInternal = useCallback(async (address: string): Promise<void> => {
    try {
      if (!window.ethereum || !address) return;

      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const balance = await provider.getBalance(address);
      const balanceInBNB = ethers.utils.formatEther(balance);

      setState(prev => ({
        ...prev,
        balance: parseFloat(balanceInBNB).toFixed(4)
      }));
    } catch (error) {
      console.error('Failed to get balance:', error);
    }
  }, []);

  // Public balance update function
  const updateBalance = useCallback(async (): Promise<void> => {
    if (state.address) {
      await updateBalanceInternal(state.address);
    }
  }, [state.address, updateBalanceInternal]);

  // Send BNB transaction
  const sendBNB = useCallback(async (
    to: string, 
    amount: string | number
  ): Promise<SendTransactionResult> => {
    try {
      if (!state.isConnected || !window.ethereum) {
        throw new Error('Wallet not connected');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();

      const tx = await signer.sendTransaction({
        to,
        value: ethers.utils.parseEther(amount.toString())
      });

      return { success: true, hash: tx.hash, tx };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      return { success: false, error: errorMessage };
    }
  }, [state.isConnected]);

  // Get transaction history
  const getTransactionHistory = useCallback(async (
    limit: number = 10
  ): Promise<TransactionHistoryItem[]> => {
    try {
      if (!state.address || !window.ethereum) return [];

      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const currentBlock = await provider.getBlockNumber();
      
      const transactions: TransactionHistoryItem[] = [];
      
      // Get recent blocks and filter transactions
      for (let i = 0; i < Math.min(limit * 10, 1000) && transactions.length < limit; i++) {
        try {
          const block = await provider.getBlockWithTransactions(currentBlock - i);
          const userTxs = block.transactions.filter(tx => 
            tx.from?.toLowerCase() === state.address?.toLowerCase() ||
            tx.to?.toLowerCase() === state.address?.toLowerCase()
          );
          
          const mappedTxs: TransactionHistoryItem[] = userTxs.map(tx => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            blockNumber: tx.blockNumber || 0,
            timestamp: block.timestamp,
            gasPrice: tx.gasPrice,
            gasUsed: tx.gasLimit // gasUsed is available after mining
          }));
          
          transactions.push(...mappedTxs);
        } catch (blockError) {
          console.error(`Error fetching block ${currentBlock - i}:`, blockError);
        }
      }

      return transactions.slice(0, limit);
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }, [state.address]);

  // Add token to wallet
  const addToken = useCallback(async (
    tokenAddress: string,
    tokenSymbol: string,
    tokenDecimals: number
  ): Promise<boolean> => {
    try {
      if (!window.ethereum) {
        throw new Error('Wallet not available');
      }

      const wasAdded: boolean = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
          },
        },
      });

      return wasAdded;
    } catch (error) {
      console.error('Failed to add token:', error);
      return false;
    }
  }, []);

  // Get token balance
  const getTokenBalance = useCallback(async (
    tokenAddress: string,
    tokenABI: string[]
  ): Promise<string> => {
    try {
      if (!state.address || !window.ethereum) {
        throw new Error('Wallet not connected');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
      
      const balance = await tokenContract.balanceOf(state.address);
      const decimals = await tokenContract.decimals();
      
      return ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return '0';
    }
  }, [state.address]);

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async (): Promise<void> => {
      if (typeof window.ethereum === 'undefined') return;

      try {
        const accounts: string[] = await window.ethereum.request({
          method: 'eth_accounts'
        });

        if (accounts.length > 0) {
          const chainId: string = await window.ethereum.request({
            method: 'eth_chainId'
          });
          
          setState(prev => ({
            ...prev,
            isConnected: true,
            address: accounts[0],
            chainId: chainId
          }));

          await updateBalanceInternal(accounts[0]);
        }
      } catch (error) {
        console.error('Failed to check existing connection:', error);
      }
    };

    checkAvailability();
    checkExistingConnection();
  }, [checkAvailability, updateBalanceInternal]);

  // Setup event listeners
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]): void => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== state.address) {
        setState(prev => ({ ...prev, address: accounts[0] }));
        updateBalanceInternal(accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string): void => {
      setState(prev => ({ ...prev, chainId }));
    };

    const handleDisconnect = (): void => {
      disconnect();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [state.address, disconnect, updateBalanceInternal]);

  // Computed values
  const isOnBNBChain = state.chainId === '0x38';
  const formattedAddress = state.address 
    ? `${state.address.slice(0, 6)}...${state.address.slice(-4)}` 
    : null;

  return {
    // State
    isConnected: state.isConnected,
    address: state.address,
    balance: state.balance,
    isLoading: state.isLoading,
    error: state.error,
    chainId: state.chainId,
    isTokenPocketAvailable: state.isTokenPocketAvailable,
    
    // Computed values
    isOnBNBChain,
    formattedAddress,
    
    // Functions
    connect,
    disconnect,
    updateBalance,
    switchToBNBChain,
    sendBNB,
    getTransactionHistory,
    checkAvailability,
    addToken,
    getTokenBalance,
  };
};

// Usage example component:
/*
import React from 'react';
import { useTokenPocket } from './useTokenPocket';

const MyWalletComponent: React.FC = () => {
  const {
    isConnected,
    address,
    balance,
    isLoading,
    error,
    formattedAddress,
    isOnBNBChain,
    connect,
    disconnect,
    sendBNB,
    addToken
  } = useTokenPocket();

  const handleConnect = async (): Promise<void> => {
    const result = await connect();
    if (result.success) {
      console.log('Connected to:', result.address);
    } else {
      console.error('Connection failed:', result.error);
    }
  };

  const handleSendBNB = async (): Promise<void> => {
    const result = await sendBNB('0x742d35Cc6634C0532925a3b8D24D6C56c8E92e5b', '0.1');
    if (result.success) {
      console.log('Transaction hash:', result.hash);
    } else {
      console.error('Transaction failed:', result.error);
    }
  };

  const handleAddToken = async (): Promise<void> => {
    const added = await addToken(
      '0x55d398326f99059ff775485246999027b3197955', // USDT
      'USDT',
      18
    );
    console.log('Token added:', added);
  };

  if (isLoading) {
    return <div>Connecting...</div>;
  }

  if (!isConnected) {
    return (
      <div>
        <button onClick={handleConnect}>
          Connect TokenPocket
        </button>
        {error && <p style={{color: 'red'}}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <h3>Wallet Connected</h3>
      <p>Address: {formattedAddress}</p>
      <p>Balance: {balance} BNB</p>
      <p>Network: {isOnBNBChain ? 'BNB Chain' : 'Wrong Network'}</p>
      
      <div>
        <button onClick={handleSendBNB}>Send 0.1 BNB</button>
        <button onClick={handleAddToken}>Add USDT Token</button>
        <button onClick={disconnect}>Disconnect</button>
      </div>
      
      {error && <p style={{color: 'red'}}>{error}</p>}
    </div>
  );
};

export default MyWalletComponent;
*/