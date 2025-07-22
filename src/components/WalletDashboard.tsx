// src/components/WalletDashboard.tsx - Complete Tailwind CSS Version
import React, { useState, useEffect, useCallback } from 'react';
import { useTokenPocket } from '../hooks/useTokenPocket';
import { TOKEN_ADDRESSES } from '../utils/constants';

// Type definitions
interface TokenBalance {
  symbol: string;
  balance: string;
  address: string;
  decimals: number;
}

interface TransactionDisplay {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  blockNumber: number;
  timestamp?: number;
  type: 'sent' | 'received';
  status: 'success' | 'pending' | 'failed';
}

interface SendTransactionForm {
  recipient: string;
  amount: string;
  isLoading: boolean;
}

// ERC20 token ABI (minimal required functions)
const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

const WalletDashboard: React.FC = () => {
  const {
    isConnected,
    address,
    balance,
    formattedAddress,
    isOnBNBChain,
    disconnect,
    sendBNB,
    addToken,
    getTokenBalance,
    getTransactionHistory,
    updateBalance,
    error: walletError
  } = useTokenPocket();

  // State management
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [transactions, setTransactions] = useState<TransactionDisplay[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tokens' | 'transactions' | 'send'>('overview');
  const [sendForm, setSendForm] = useState<SendTransactionForm>({
    recipient: '',
    amount: '',
    isLoading: false
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Show notification
  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  // Load token balances
  const loadTokenBalances = useCallback(async (): Promise<void> => {
    if (!isConnected || !isOnBNBChain) return;

    setIsLoadingTokens(true);
    const balances: TokenBalance[] = [];

    try {
      for (const [symbol, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {
        try {
          const balance = await getTokenBalance(tokenAddress, TOKEN_ABI);
          const numericBalance = parseFloat(balance);
          
          if (numericBalance > 0 || symbol === 'USDT') { // Always show USDT even if 0
            balances.push({
              symbol,
              balance: numericBalance.toFixed(4),
              address: tokenAddress,
              decimals: 18 // BEP20 standard
            });
          }
        } catch (error) {
          console.error(`Failed to get ${symbol} balance:`, error);
        }
      }
      setTokenBalances(balances);
    } catch (error) {
      console.error('Failed to load token balances:', error);
      showNotification('error', 'Failed to load token balances');
    } finally {
      setIsLoadingTokens(false);
    }
  }, [isConnected, isOnBNBChain, getTokenBalance, showNotification]);

  // Load transaction history
  const loadTransactionHistory = useCallback(async (): Promise<void> => {
    if (!isConnected || !address) return;

    setIsLoadingTransactions(true);
    try {
      const history = await getTransactionHistory(10);
      
      const displayTransactions: TransactionDisplay[] = history.map(tx => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: parseFloat(tx.value.toString()).toFixed(4),
        blockNumber: tx.blockNumber,
        timestamp: tx.timestamp,
        type: tx.from.toLowerCase() === address.toLowerCase() ? 'sent' : 'received',
        status: 'success' // Assuming successful since it's in history
      }));

      setTransactions(displayTransactions);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      showNotification('error', 'Failed to load transaction history');
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [isConnected, address, getTransactionHistory, showNotification]);

  // Handle send transaction
  const handleSendTransaction = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!sendForm.recipient || !sendForm.amount) {
      showNotification('error', 'Please fill in all fields');
      return;
    }

    if (parseFloat(sendForm.amount) <= 0) {
      showNotification('error', 'Amount must be greater than 0');
      return;
    }

    if (parseFloat(sendForm.amount) > parseFloat(balance)) {
      showNotification('error', 'Insufficient balance');
      return;
    }

    setSendForm(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await sendBNB(sendForm.recipient, sendForm.amount);
      
      if (result.success && result.hash) {
        showNotification('success', `Transaction sent! Hash: ${result.hash.slice(0, 10)}...`);
        setSendForm({ recipient: '', amount: '', isLoading: false });
        setActiveTab('transactions');
        
        // Refresh balance and transactions
        setTimeout(() => {
          updateBalance();
          loadTransactionHistory();
        }, 2000);
      } else {
        showNotification('error', result.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      showNotification('error', 'Transaction failed. Please try again.');
    } finally {
      setSendForm(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle add token to wallet
  const handleAddToken = async (token: TokenBalance): Promise<void> => {
    try {
      const added = await addToken(token.address, token.symbol, token.decimals);
      if (added) {
        showNotification('success', `${token.symbol} added to wallet!`);
      } else {
        showNotification('error', `Failed to add ${token.symbol} to wallet`);
      }
    } catch (error) {
      console.error('Failed to add token:', error);
      showNotification('error', `Error adding ${token.symbol} to wallet`);
    }
  };

  // Copy address to clipboard
  const copyAddress = async (): Promise<void> => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        showNotification('success', 'Address copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy address:', error);
        showNotification('error', 'Failed to copy address');
      }
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number | undefined): string => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Load data on mount and when connected
  useEffect(() => {
    if (isConnected && isOnBNBChain) {
      loadTokenBalances();
      loadTransactionHistory();
    }
  }, [isConnected, isOnBNBChain, loadTokenBalances, loadTransactionHistory]);

  // Show connection required message
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Wallet Connection Required</h3>
          <p className="text-gray-600">Please connect your TokenPocket wallet to view the dashboard.</p>
        </div>
      </div>
    );
  }

  // Show wrong network message
  if (!isOnBNBChain) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-bold text-amber-800 mb-4">Wrong Network</h3>
          <p className="text-amber-700 mb-2">Please switch to BNB Smart Chain to use this dashboard.</p>
          <p className="text-amber-600">Current network is not supported.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg border-l-4 ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-500 text-green-800' 
            : notification.type === 'error'
            ? 'bg-red-50 border-red-500 text-red-800'
            : 'bg-blue-50 border-blue-500 text-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-4 text-gray-500 hover:text-gray-700 font-bold text-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Wallet Overview Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 px-6 py-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold flex items-center">
                <span className="text-4xl mr-3">💼</span>
                Wallet Dashboard
              </h2>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-200 font-medium">Address:</span>
                  <button 
                    onClick={copyAddress} 
                    className="bg-black bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg transition-all duration-200 font-mono text-sm"
                    title="Click to copy"
                  >
                    {formattedAddress}
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-bold">{balance} BNB</span>
                  <button 
                    onClick={updateBalance} 
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-all duration-200"
                    title="Refresh balance"
                  >
                    🔄
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 md:mt-0">
              <button 
                onClick={disconnect}
                className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200 shadow-lg"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button 
            className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${
              activeTab === 'overview' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="text-lg mr-2">📊</span>
            Overview
          </button>
          <button 
            className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${
              activeTab === 'tokens' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('tokens')}
          >
            <span className="text-lg mr-2">🪙</span>
            Tokens
          </button>
          <button 
            className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${
              activeTab === 'transactions' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('transactions')}
          >
            <span className="text-lg mr-2">📋</span>
            Transactions
          </button>
          <button 
            className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${
              activeTab === 'send' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('send')}
          >
            <span className="text-lg mr-2">💸</span>
            Send
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                  <h4 className="text-lg font-semibold mb-2">BNB Balance</h4>
                  <p className="text-3xl font-bold">{balance} BNB</p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                  <h4 className="text-lg font-semibold mb-2">Tokens</h4>
                  <p className="text-3xl font-bold">{tokenBalances.length}</p>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                  <h4 className="text-lg font-semibold mb-2">Recent Transactions</h4>
                  <p className="text-3xl font-bold">{transactions.length}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h4>
                {transactions.slice(0, 3).length > 0 ? (
                  <div className="space-y-3">
                    {transactions.slice(0, 3).map((tx) => (
                      <div key={tx.hash} className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">
                            {tx.type === 'sent' ? '📤' : '📥'}
                          </span>
                          <div>
                            <div className="font-medium text-gray-800">{tx.value} BNB</div>
                            <div className="text-sm text-gray-500 font-mono">{tx.hash.slice(0, 20)}...</div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          tx.type === 'sent' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {tx.type === 'sent' ? 'Sent' : 'Received'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📝</div>
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tokens Tab */}
          {activeTab === 'tokens' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-semibold text-gray-800">Token Balances</h4>
                <button 
                  onClick={loadTokenBalances} 
                  disabled={isLoadingTokens}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <span className={isLoadingTokens ? 'animate-spin' : ''}>{isLoadingTokens ? '🔄' : '↻'}</span>
                  <span>Refresh</span>
                </button>
              </div>

              {isLoadingTokens ? (
                <div className="text-center py-12">
                  <div className="animate-spin text-4xl mb-4">🔄</div>
                  <p className="text-gray-600">Loading tokens...</p>
                </div>
              ) : tokenBalances.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <div className="text-4xl mb-4">🪙</div>
                  <p className="text-gray-600 font-medium">No token balances found</p>
                  <small className="text-gray-500">Only tokens with balance {'>'} 0 are displayed</small>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tokenBalances.map((token) => (
                    <div key={token.symbol} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-bold text-gray-800">{token.symbol}</span>
                        <span className="text-2xl font-bold text-blue-600">{token.balance}</span>
                      </div>
                      <button 
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-all duration-200 font-medium"
                        onClick={() => handleAddToken(token)}
                      >
                        Add to Wallet
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-semibold text-gray-800">Transaction History</h4>
                <button 
                  onClick={loadTransactionHistory} 
                  disabled={isLoadingTransactions}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <span className={isLoadingTransactions ? 'animate-spin' : ''}>{isLoadingTransactions ? '🔄' : '↻'}</span>
                  <span>Refresh</span>
                </button>
              </div>

              {isLoadingTransactions ? (
                <div className="text-center py-12">
                  <div className="animate-spin text-4xl mb-4">🔄</div>
                  <p className="text-gray-600">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-gray-600 font-medium">No transactions found</p>
                  <small className="text-gray-500">Your transaction history will appear here</small>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.hash} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl">
                          {tx.type === 'sent' ? '📤' : '📥'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`font-semibold capitalize ${
                              tx.type === 'sent' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {tx.type}
                            </span>
                            <span className="text-lg font-bold text-gray-800">{tx.value} BNB</span>
                          </div>
                          <div className="text-sm text-gray-500 space-y-1">
                            <div className="font-mono">{tx.hash.slice(0, 30)}...</div>
                            <div>{formatTimestamp(tx.timestamp)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Send Tab */}
          {activeTab === 'send' && (
            <div className="max-w-2xl mx-auto">
              <h4 className="text-xl font-semibold text-gray-800 mb-6">Send BNB</h4>
              
              <form onSubmit={handleSendTransaction} className="space-y-6">
                <div>
                  <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Address:
                  </label>
                  <input
                    type="text"
                    id="recipient"
                    placeholder="0x..."
                    value={sendForm.recipient}
                    onChange={(e) => setSendForm(prev => ({ ...prev, recipient: e.target.value }))}
                    disabled={sendForm.isLoading}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-mono text-sm disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (BNB):
                  </label>
                  <input
                    type="number"
                    id="amount"
                    placeholder="0.0"
                    step="0.0001"
                    min="0"
                    max={balance}
                    value={sendForm.amount}
                    onChange={(e) => setSendForm(prev => ({ ...prev, amount: e.target.value }))}
                    disabled={sendForm.isLoading}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                  />
                  <small className="text-gray-500 mt-1 block">Available: {balance} BNB</small>
                </div>

                <button 
                  type="submit" 
                  disabled={sendForm.isLoading || !sendForm.recipient || !sendForm.amount}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {sendForm.isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin text-lg">🔄</div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-lg">💸</span>
                      <span>Send BNB</span>
                    </div>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {walletError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <span className="text-red-500 text-2xl">⚠️</span>
            <p className="text-red-800 font-medium">{walletError}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletDashboard;