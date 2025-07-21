// src/components/WalletDashboard.tsx
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
      <div className="wallet-dashboard not-connected">
        <div className="connection-required">
          <h3>🔐 Wallet Connection Required</h3>
          <p>Please connect your TokenPocket wallet to view the dashboard.</p>
        </div>
      </div>
    );
  }

  // Show wrong network message
  if (!isOnBNBChain) {
    return (
      <div className="wallet-dashboard wrong-network">
        <div className="network-warning">
          <h3>⚠️ Wrong Network</h3>
          <p>Please switch to BNB Smart Chain to use this dashboard.</p>
          <p>Current network is not supported.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-dashboard">
      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
          <button onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      {/* Wallet Overview Header */}
      <div className="dashboard-header">
        <div className="wallet-summary">
          <h2>💼 Wallet Dashboard</h2>
          <div className="address-section">
            <span className="address-label">Address:</span>
            <span className="address-value" onClick={copyAddress} title="Click to copy">
              {formattedAddress}
            </span>
          </div>
          <div className="balance-section">
            <span className="balance-amount">{balance} BNB</span>
            <button className="refresh-btn" onClick={updateBalance} title="Refresh balance">
              🔄
            </button>
          </div>
        </div>

        <div className="dashboard-actions">
          <button className="disconnect-btn" onClick={disconnect}>
            Disconnect
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab ${activeTab === 'tokens' ? 'active' : ''}`}
          onClick={() => setActiveTab('tokens')}
        >
          🪙 Tokens
        </button>
        <button 
          className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          📋 Transactions
        </button>
        <button 
          className={`tab ${activeTab === 'send' ? 'active' : ''}`}
          onClick={() => setActiveTab('send')}
        >
          💸 Send
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="stats-grid">
              <div className="stat-card">
                <h4>BNB Balance</h4>
                <p className="stat-value">{balance} BNB</p>
              </div>
              <div className="stat-card">
                <h4>Tokens</h4>
                <p className="stat-value">{tokenBalances.length}</p>
              </div>
              <div className="stat-card">
                <h4>Recent Transactions</h4>
                <p className="stat-value">{transactions.length}</p>
              </div>
            </div>

            <div className="recent-activity">
              <h4>Recent Activity</h4>
              {transactions.slice(0, 3).map((tx) => (
                <div key={tx.hash} className="activity-item">
                  <span className={`activity-type ${tx.type}`}>
                    {tx.type === 'sent' ? '📤' : '📥'}
                  </span>
                  <div className="activity-details">
                    <span className="activity-amount">{tx.value} BNB</span>
                    <span className="activity-hash">{tx.hash.slice(0, 10)}...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tokens Tab */}
        {activeTab === 'tokens' && (
          <div className="tokens-content">
            <div className="section-header">
              <h4>Token Balances</h4>
              <button onClick={loadTokenBalances} disabled={isLoadingTokens}>
                {isLoadingTokens ? '🔄' : '↻'} Refresh
              </button>
            </div>

            {isLoadingTokens ? (
              <div className="loading-state">Loading tokens...</div>
            ) : tokenBalances.length === 0 ? (
              <div className="empty-state">
                <p>No token balances found</p>
                <small>Only tokens with balance {'>'} 0 are displayed</small>
              </div>
            ) : (
              <div className="token-list">
                {tokenBalances.map((token) => (
                  <div key={token.symbol} className="token-item">
                    <div className="token-info">
                      <span className="token-symbol">{token.symbol}</span>
                      <span className="token-balance">{token.balance}</span>
                    </div>
                    <button 
                      className="add-token-btn"
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
          <div className="transactions-content">
            <div className="section-header">
              <h4>Transaction History</h4>
              <button onClick={loadTransactionHistory} disabled={isLoadingTransactions}>
                {isLoadingTransactions ? '🔄' : '↻'} Refresh
              </button>
            </div>

            {isLoadingTransactions ? (
              <div className="loading-state">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="empty-state">
                <p>No transactions found</p>
                <small>Your transaction history will appear here</small>
              </div>
            ) : (
              <div className="transaction-list">
                {transactions.map((tx) => (
                  <div key={tx.hash} className="transaction-item">
                    <div className="tx-icon">
                      {tx.type === 'sent' ? '📤' : '📥'}
                    </div>
                    <div className="tx-details">
                      <div className="tx-main">
                        <span className={`tx-type ${tx.type}`}>
                          {tx.type === 'sent' ? 'Sent' : 'Received'}
                        </span>
                        <span className="tx-amount">{tx.value} BNB</span>
                      </div>
                      <div className="tx-meta">
                        <span className="tx-hash">{tx.hash.slice(0, 20)}...</span>
                        <span className="tx-time">{formatTimestamp(tx.timestamp)}</span>
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
          <div className="send-content">
            <h4>Send BNB</h4>
            
            <form onSubmit={handleSendTransaction} className="send-form">
              <div className="form-group">
                <label htmlFor="recipient">Recipient Address:</label>
                <input
                  type="text"
                  id="recipient"
                  placeholder="0x..."
                  value={sendForm.recipient}
                  onChange={(e) => setSendForm(prev => ({ ...prev, recipient: e.target.value }))}
                  disabled={sendForm.isLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount (BNB):</label>
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
                />
                <small>Available: {balance} BNB</small>
              </div>

              <button 
                type="submit" 
                className="send-btn"
                disabled={sendForm.isLoading || !sendForm.recipient || !sendForm.amount}
              >
                {sendForm.isLoading ? 'Sending...' : 'Send BNB'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Error Display */}
      {walletError && (
        <div className="error-display">
          <p>⚠️ {walletError}</p>
        </div>
      )}
    </div>
  );
};

export default WalletDashboard;