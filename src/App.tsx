// src/App.tsx - Complete Integration
import React from 'react';
import TokenPocketWalletConnector from './components/TokenPocketWalletConnector';
import WalletDashboard from './components/WalletDashboard';
import { useTokenPocket } from './hooks/useTokenPocket';

const App: React.FC = () => {
  const { isConnected, isOnBNBChain } = useTokenPocket();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(0,0,0,.03) 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      }}></div>
      
      {/* Header */}
      <header className="relative z-10 pt-8 pb-4 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-white bg-opacity-80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-gray-200 mb-6">
            <span className="text-2xl">🚀</span>
            <span className="font-bold text-gray-800">Web3 DApp</span>
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">v2.0</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
            TokenPocket Integration
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Connect your wallet to the <span className="font-semibold text-yellow-600">BNB Smart Chain</span> ecosystem
          </p>
          
          {/* Connection Status Indicator */}
          {isConnected && (
            <div className="mt-4 inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Wallet Connected</span>
            </div>
          )}
          
          {/* Tech Stack - Only show when not connected */}
          {!isConnected && (
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">⚛️</span>
                  <span className="text-sm font-semibold text-gray-700">React</span>
                </div>
              </div>
              <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📘</span>
                  <span className="text-sm font-semibold text-gray-700">TypeScript</span>
                </div>
              </div>
              <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🎨</span>
                  <span className="text-sm font-semibold text-gray-700">Tailwind CSS</span>
                </div>
              </div>
              <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🌐</span>
                  <span className="text-sm font-semibold text-gray-700">Web3</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* Main Content - Conditional Rendering */}
      <main className="relative z-10 px-4 pb-12">
        {isConnected && isOnBNBChain ? (
          <WalletDashboard />
        ) : (
          <TokenPocketWalletConnector />
        )}
      </main>

      {/* Footer - Only show when not connected */}
      {!isConnected && (
        <footer className="relative z-10 mt-12 border-t border-gray-200 bg-white bg-opacity-80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center space-x-8">
                <a 
                  href="https://bscscan.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-gray-50 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-lg font-bold">📊</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">BSC Explorer</span>
                </a>
                
                <a 
                  href="https://testnet.binance.org/faucet-smart" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-gray-50 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-lg font-bold">🚰</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Testnet Faucet</span>
                </a>
                
                <a 
                  href="https://tokenpocket.pro" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-gray-50 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-lg font-bold">📱</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">TokenPocket</span>
                </a>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <p className="text-gray-600 text-sm">
                  Built with ❤️ for the decentralized future • 
                  <span className="font-semibold"> Secure, Fast, Reliable</span>
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;