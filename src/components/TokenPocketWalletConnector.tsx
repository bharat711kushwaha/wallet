import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Type definitions for Ethereum provider
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

// Network configuration type
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

// Wallet state interface
interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  isLoading: boolean;
  error: string | null;
  chainId: string | null;
}

// Wallet info interface
interface WalletInfo {
  isTokenPocketAvailable: boolean;
  isMetaMaskAvailable: boolean;
  isSafePalAvailable: boolean;
}

// Connection result interface
interface ConnectionResult {
  success: boolean;
  address?: string;
  error?: string;
}

// BNB Chain configuration
const BNB_CHAIN_CONFIG: NetworkConfig = {
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

const TokenPocketWalletConnector: React.FC = () => {
  // State management with proper TypeScript types
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: '0',
    isLoading: false,
    error: null,
    chainId: null
  });

  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    isTokenPocketAvailable: false,
    isMetaMaskAvailable: false,
    isSafePalAvailable: false
  });

  // Check wallet availability on component mount
  useEffect(() => {
    checkWalletAvailability();
    checkExistingConnection();
  }, []);

  // Setup event listeners when wallet is detected
  useEffect(() => {
    if (window.ethereum) {
      setupEventListeners();
    }
    return () => {
      removeEventListeners();
    };
  }, []);

  // Check which wallets are available
  const checkWalletAvailability = useCallback((): void => {
    const isEthereumAvailable = typeof window.ethereum !== 'undefined';
    
    if (isEthereumAvailable && window.ethereum) {
      setWalletInfo({
        isTokenPocketAvailable: Boolean(window.ethereum.isTokenPocket),
        isMetaMaskAvailable: Boolean(window.ethereum.isMetaMask),
        isSafePalAvailable: Boolean(window.ethereum.isSafePal)
      });
    } else {
      console.log('No wallet detected');
      setWalletInfo({
        isTokenPocketAvailable: false,
        isMetaMaskAvailable: false,
        isSafePalAvailable: false
      });
    }
  }, []);

  // Check if already connected
  const checkExistingConnection = useCallback(async (): Promise<void> => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      const accounts: string[] = await window.ethereum.request({
        method: 'eth_accounts'
      });

      if (accounts.length > 0) {
        const chainId: string = await window.ethereum.request({
          method: 'eth_chainId'
        });
        
        setWalletState(prev => ({
          ...prev,
          isConnected: true,
          address: accounts[0],
          chainId: chainId
        }));

        // Get balance if connected
        await updateBalance(accounts[0]);
      }
    } catch (error) {
      console.error('Failed to check existing connection:', error);
    }
  }, []);

  // Main connection function
  const connectTokenPocket = useCallback(async (): Promise<ConnectionResult> => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if TokenPocket is available
      if (!window.ethereum) {
        throw new Error('TokenPocket not found! Please install TokenPocket app and use its built-in browser.');
      }

      if (!window.ethereum.isTokenPocket) {
        throw new Error('Please use TokenPocket browser to connect. Open this website in TokenPocket app\'s DApp browser.');
      }

      // Request account access
      const accounts: string[] = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Check and switch to BNB Chain
      await ensureBNBChain();

      // Get current chain ID
      const chainId: string = await window.ethereum.request({
        method: 'eth_chainId'
      });

      // Update state
      setWalletState(prev => ({
        ...prev,
        isConnected: true,
        address: accounts[0],
        chainId: chainId,
        isLoading: false
      }));

      // Get balance
      await updateBalance(accounts[0]);

      // Save connection state to localStorage
      localStorage.setItem('tokenPocketConnected', 'true');
      localStorage.setItem('lastConnectedAddress', accounts[0]);

      console.log('✅ TokenPocket connected successfully!');
      
      return { success: true, address: accounts[0] };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('TokenPocket connection failed:', error);
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      return { success: false, error: errorMessage };
    }
  }, []);

  // Ensure we're on BNB Chain
  const ensureBNBChain = useCallback(async (): Promise<void> => {
    if (!window.ethereum) return;

    const currentChainId: string = await window.ethereum.request({
      method: 'eth_chainId'
    });

    if (currentChainId !== BNB_CHAIN_CONFIG.chainId) {
      try {
        // Try to switch to BNB Chain
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: BNB_CHAIN_CONFIG.chainId }],
        });
      } catch (switchError: any) {
        // If BNB Chain is not added, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BNB_CHAIN_CONFIG],
          });
        } else {
          throw switchError;
        }
      }
    }
  }, []);

  // Update balance
  const updateBalance = useCallback(async (address: string): Promise<void> => {
    try {
      if (!window.ethereum) return;

      // Ethers v6 compatibility
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const balance = await provider.getBalance(address);
      const balanceInBNB = ethers.formatEther(balance);

      setWalletState(prev => ({
        ...prev,
        balance: parseFloat(balanceInBNB).toFixed(4)
      }));
    } catch (error) {
      console.error('Failed to get balance:', error);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback((): void => {
    setWalletState({
      isConnected: false,
      address: null,
      balance: '0',
      isLoading: false,
      error: null,
      chainId: null
    });

    localStorage.removeItem('tokenPocketConnected');
    localStorage.removeItem('lastConnectedAddress');
  }, []);

  // Setup event listeners
  const setupEventListeners = useCallback((): void => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }
  }, []);

  // Remove event listeners
  const removeEventListeners = useCallback((): void => {
    if (window.ethereum && window.ethereum.removeListener) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('disconnect', handleDisconnect);
    }
  }, []);

  // Event handlers
  const handleAccountsChanged = useCallback((accounts: string[]): void => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else if (accounts[0] !== walletState.address) {
      setWalletState(prev => ({
        ...prev,
        address: accounts[0]
      }));
      updateBalance(accounts[0]);
    }
  }, [walletState.address, disconnectWallet, updateBalance]);

  const handleChainChanged = useCallback((chainId: string): void => {
    setWalletState(prev => ({
      ...prev,
      chainId: chainId
    }));
    window.location.reload(); // Refresh page on chain change
  }, []);

  const handleDisconnect = useCallback((): void => {
    disconnectWallet();
  }, [disconnectWallet]);

  // Format address for display
  const formatAddress = useCallback((address: string | null): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Get network name
  const getNetworkName = useCallback((chainId: string | null): string => {
    switch (chainId) {
      case '0x38':
        return 'BNB Smart Chain';
      case '0x61':
        return 'BNB Testnet';
      case '0x1':
        return 'Ethereum';
      default:
        return chainId ? `Network ${chainId}` : 'Unknown Network';
    }
  }, []);

  // Copy address to clipboard
  const copyAddress = useCallback(async (): Promise<void> => {
    if (walletState.address) {
      try {
        await navigator.clipboard.writeText(walletState.address);
        console.log('Address copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  }, [walletState.address]);

  // Refresh balance
  const refreshBalance = useCallback((): void => {
    if (walletState.address) {
      updateBalance(walletState.address);
    }
  }, [walletState.address, updateBalance]);

  return (
    <div className="w-full max-w-lg mx-auto mt-8 mb-8">
      {/* Main Card Container */}
      <div className="bg-white backdrop-blur-sm bg-opacity-95 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 px-6 py-8 text-white">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">💼</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              TokenPocket Wallet
            </h1>
            <p className="text-blue-100 text-sm font-medium">
              Connect to BNB Smart Chain • Secure • Fast
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-6 py-6 space-y-6">

          {/* Wallet Detection Status */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
                Wallet Detection
              </h3>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white border">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🟢</span>
                  <span className="font-medium text-gray-700">TokenPocket</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  walletInfo.isTokenPocketAvailable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {walletInfo.isTokenPocketAvailable ? '✅ Available' : '❌ Not Found'}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white border">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🦊</span>
                  <span className="font-medium text-gray-700">MetaMask</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  walletInfo.isMetaMaskAvailable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {walletInfo.isMetaMaskAvailable ? '✅ Available' : '⚪ Not Found'}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white border">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🛡️</span>
                  <span className="font-medium text-gray-700">SafePal</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  walletInfo.isSafePalAvailable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {walletInfo.isSafePalAvailable ? '✅ Available' : '⚪ Not Found'}
                </span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {walletState.error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <span className="text-red-500 text-lg">⚠️</span>
                <div>
                  <div className="font-semibold text-red-800 text-sm">Connection Error</div>
                  <div className="text-red-700 text-sm mt-1">{walletState.error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Connection Status */}
          {!walletState.isConnected ? (
            <div className="space-y-4">
              <button
                onClick={connectTokenPocket}
                disabled={walletState.isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                {walletState.isLoading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">🔗</span>
                    <span>Connect TokenPocket</span>
                  </div>
                )}
              </button>
              
              {!walletInfo.isTokenPocketAvailable && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-amber-600 text-lg mt-0.5">💡</span>
                    <div>
                      <div className="font-semibold text-amber-800 text-sm mb-2">How to connect:</div>
                      <ol className="text-amber-700 text-sm space-y-1 list-decimal list-inside">
                        <li>Install TokenPocket mobile app</li>
                        <li>Open TokenPocket app on your phone</li>
                        <li>Navigate to "Discover" section</li>
                        <li>Enter this website URL in the browser</li>
                        <li>Return here and click Connect</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connected Status */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-800 font-bold text-sm">WALLET CONNECTED</span>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors duration-200"
                  >
                    Disconnect
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-white rounded-lg p-3 border">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm font-medium">Wallet Address</span>
                      <button 
                        onClick={copyAddress}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="font-mono text-sm font-bold text-gray-800 mt-1">
                      {formatAddress(walletState.address)}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm font-medium">Balance</span>
                      <button 
                        onClick={refreshBalance}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline"
                      >
                        Refresh
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xl font-bold text-gray-800">{walletState.balance}</span>
                      <span className="text-sm font-semibold text-gray-600">BNB</span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border">
                    <span className="text-gray-600 text-sm font-medium">Network</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="font-semibold text-gray-800 text-sm">
                        {getNetworkName(walletState.chainId)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={refreshBalance}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-lg">🔄</span>
                    <span className="text-xs">Refresh</span>
                  </div>
                </button>
                
                <button
                  onClick={copyAddress}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-lg">📋</span>
                    <span className="text-xs">Copy</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-t border-gray-100">
          <div className="text-center">
            <h4 className="font-semibold text-gray-800 text-sm mb-2">📱 Mobile Instructions</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Use TokenPocket app's built-in DApp browser</div>
              <div>• Ensure you're connected to BNB Smart Chain</div>
              <div>• Keep your recovery phrase secure and private</div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info Card */}
      <div className="mt-6 bg-white bg-opacity-80 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-center space-x-6 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <span>⚡</span>
            <span>Fast</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>🔒</span>
            <span>Secure</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>💰</span>
            <span>Low Fees</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenPocketWalletConnector;