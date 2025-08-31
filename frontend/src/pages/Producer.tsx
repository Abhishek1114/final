import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Send, RefreshCw } from 'lucide-react';
import { getWalletAddress, getOwnedTokens, transferCredit, isTokenRetired, handleChainError, waitForTransactionAndRefresh, listenForTransfers } from '../lib/chain';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface CreditToken {
  tokenId: number;
  isRetired: boolean;
}

const Producer: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [credits, setCredits] = useState<CreditToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState<number | null>(null);
  
  // Transfer form state
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [transferAddress, setTransferAddress] = useState('');

  useEffect(() => {
    loadWalletAndCredits();
    
    // Set up transfer event listener
    const setupTransferListener = async () => {
      await listenForTransfers((from, to, tokenId) => {
        console.log('🔄 Transfer detected, refreshing credits...');
        if (walletAddress) {
          loadCredits(walletAddress);
        }
      });
    };
    
    setupTransferListener();
  }, [walletAddress]);

  const loadWalletAndCredits = async () => {
    try {
      const address = await getWalletAddress();
      setWalletAddress(address);
      
      if (address) {
        await loadCredits(address);
      }
    } catch (error) {
      console.error('Failed to load wallet and credits:', error);
      toast.error('Failed to connect to blockchain');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCredits = async (address: string) => {
    try {
      console.log('🔄 Loading credits for address:', address);
      const tokenIds = await getOwnedTokens(address);
      console.log('📋 Found token IDs:', tokenIds);
      
      const creditsWithStatus = await Promise.all(
        tokenIds.map(async (tokenId) => ({
          tokenId,
          isRetired: await isTokenRetired(tokenId),
        }))
      );
      
      console.log('✅ Credits loaded:', creditsWithStatus);
      setCredits(creditsWithStatus);
    } catch (error) {
      console.error('Failed to load credits:', error);
      toast.error('Failed to load your credits');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTokenId || !transferAddress || !walletAddress) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsTransferring(selectedTokenId);
    
    try {
      const tx = await transferCredit(walletAddress, transferAddress, selectedTokenId);
      
      toast.info('Transfer submitted. Waiting for confirmation...');
      
      // Use the new transaction handling
      await waitForTransactionAndRefresh(tx, () => {
        if (walletAddress) {
          loadCredits(walletAddress);
        }
      });
      
      toast.success(`Credit #${selectedTokenId} transferred successfully`);
      setSelectedTokenId(null);
      setTransferAddress('');
      
    } catch (error) {
      const chainError = handleChainError(error);
      toast.error(chainError.message);
    } finally {
      setIsTransferring(null);
    }
  };

  const handleRefresh = () => {
    if (walletAddress) {
      loadCredits(walletAddress);
      toast.info('Refreshing credits...');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Leaf className="h-16 w-16 text-brand mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400">Please connect your wallet to access the producer dashboard</p>
        </motion.div>
      </div>
    );
  }

  const activeCredits = credits.filter(c => !c.isRetired);
  const retiredCredits = credits.filter(c => c.isRetired);

  return (
    <div className="min-h-screen bg-gradient-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <Leaf className="h-8 w-8 text-brand" />
                <h1 className="text-3xl font-bold">Producer Dashboard</h1>
              </div>
              <button
                onClick={handleRefresh}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
            <p className="text-gray-400">Manage your green hydrogen production credits</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-brand">{credits.length}</h3>
              <p className="text-gray-400">Total Credits</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-green-400">{activeCredits.length}</h3>
              <p className="text-gray-400">Active Credits</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-gray-400">{retiredCredits.length}</h3>
              <p className="text-gray-400">Retired Credits</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Transfer Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="card"
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Send className="h-5 w-5 mr-2 text-brand" />
                Transfer Credit
              </h2>
              
              {activeCredits.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No active credits available for transfer
                </p>
              ) : (
                <form onSubmit={handleTransfer} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Credit to Transfer
                    </label>
                    <select
                      value={selectedTokenId || ''}
                      onChange={(e) => setSelectedTokenId(Number(e.target.value))}
                      className="input w-full"
                      required
                    >
                      <option value="">Choose a credit...</option>
                      {activeCredits.map((credit) => (
                        <option key={credit.tokenId} value={credit.tokenId}>
                          Credit #{credit.tokenId}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      value={transferAddress}
                      onChange={(e) => setTransferAddress(e.target.value)}
                      placeholder="0x..."
                      className="input w-full"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isTransferring !== null}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    {isTransferring === selectedTokenId ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Transferring...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Transfer Credit</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Credits List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="card"
            >
              <h2 className="text-xl font-semibold mb-6">Your Credits</h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {credits.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No credits found. Contact a certifier to get credits issued.
                  </p>
                ) : (
                  credits.map((credit) => (
                    <div
                      key={credit.tokenId}
                      className={`p-4 rounded-xl border transition-all ${
                        credit.isRetired
                          ? 'bg-gray-900/50 border-gray-700 opacity-60'
                          : 'bg-gray-800/50 border-gray-600 hover:border-brand/50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">
                            Credit #{credit.tokenId}
                          </p>
                          <p className="text-sm text-gray-400">
                            Status: {credit.isRetired ? 'Retired' : 'Active'}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            credit.isRetired ? 'bg-gray-500' : 'bg-green-500'
                          }`} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Producer;