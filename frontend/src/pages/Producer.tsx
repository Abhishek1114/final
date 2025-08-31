import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Send, RefreshCw, Plus, Users } from 'lucide-react';
import { getWalletAddress, getOwnedTokens, transferCredit, isTokenRetired, handleChainError, waitForTransactionAndRefresh, listenForTransfers } from '../lib/chain';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../lib/api';

interface CreditToken {
  tokenId: number;
  isRetired: boolean;
}

interface CreditRequest {
  id: string;
  producerAddress: string;
  amount: number;
  state: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  reason?: string;
}

interface IncomingRequest {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  reason?: string;
}

interface Stats {
  totalCredits: number;
  activeCredits: number;
  pendingRequests: number;
  approvedRequests: number;
}

const Producer: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [credits, setCredits] = useState<CreditToken[]>([]);
  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCredits: 0,
    activeCredits: 0,
    pendingRequests: 0,
    approvedRequests: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState<number | null>(null);
  
  // Transfer form state
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [transferAddress, setTransferAddress] = useState('');
  
  // Request form state
  const [requestAmount, setRequestAmount] = useState<number>(1);
  const [isRequesting, setIsRequesting] = useState(false);

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
        await Promise.all([
          loadCredits(address),
          loadCreditRequests(address),
          loadIncomingRequests(address),
          loadStats(address),
        ]);
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

  const loadCreditRequests = async (address: string) => {
    try {
      const response = await api.get(`/credit-requests?producerAddress=${address}`);
      if (response.data.success) {
        setCreditRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Failed to load credit requests:', error);
    }
  };

  const loadIncomingRequests = async (address: string) => {
    try {
      const response = await api.get(`/incoming-requests/${address}`);
      if (response.data.success) {
        setIncomingRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Failed to load incoming requests:', error);
    }
  };

  const loadStats = async (address: string) => {
    try {
      const response = await api.get(`/stats/${address}`);
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
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
      Promise.all([
        loadCredits(walletAddress),
        loadCreditRequests(walletAddress),
        loadIncomingRequests(walletAddress),
        loadStats(walletAddress),
      ]);
      toast.info('Refreshing data...');
    }
  };

  const handleRequestTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress || !requestAmount) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsRequesting(true);
    
    try {
      const response = await api.post('/credit-requests', {
        producerAddress: walletAddress,
        amount: requestAmount,
        state: 'Gujarat', // This should be dynamic based on user location
      });
      
      if (response.data.success) {
        toast.success('Token request submitted successfully');
        setRequestAmount(1);
        await loadCreditRequests(walletAddress);
        await loadStats(walletAddress);
      }
    } catch (error) {
      console.error('Failed to request tokens:', error);
      toast.error('Failed to submit token request');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSendCredits = async (requestId: string) => {
    if (!walletAddress) return;
    
    try {
      const response = await api.post(`/incoming-requests/${requestId}/accept`);
      if (response.data.success) {
        toast.success('Credits sent successfully');
        await loadIncomingRequests(walletAddress);
        await loadStats(walletAddress);
      }
    } catch (error) {
      console.error('Failed to send credits:', error);
      toast.error('Failed to send credits');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!walletAddress) return;
    
    try {
      const response = await api.post(`/incoming-requests/${requestId}/reject`, {
        reason: 'Rejected by producer',
      });
      if (response.data.success) {
        toast.success('Request rejected');
        await loadIncomingRequests(walletAddress);
      }
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Failed to reject request');
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-brand">{stats.totalCredits}</h3>
              <p className="text-gray-400">Total Credits</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-green-400">{stats.activeCredits}</h3>
              <p className="text-gray-400">Active Credits</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-yellow-400">{stats.pendingRequests}</h3>
              <p className="text-gray-400">Pending Requests</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-blue-400">{stats.approvedRequests}</h3>
              <p className="text-gray-400">Approved Requests</p>
            </motion.div>
          </div>

          {/* Request Tokens Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="card mb-8"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Plus className="h-5 w-5 mr-2 text-brand" />
              Request Tokens
            </h2>
            
            <form onSubmit={handleRequestTokens} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(Number(e.target.value))}
                  className="input w-full"
                  required
                />
                <p className="text-sm text-gray-400 mt-1">1-1000</p>
              </div>

              <button
                type="submit"
                disabled={isRequesting}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {isRequesting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Request Tokens</span>
                  </>
                )}
              </button>
            </form>
            
            <p className="text-sm text-gray-400 mt-4 text-center">
              Request will be sent to State Admin of Gujarat
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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

          {/* Token Requests Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="card mb-8"
          >
            <h2 className="text-xl font-semibold mb-6">Token Requests</h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {creditRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No token requests found
                </p>
              ) : (
                creditRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-4 rounded-xl border transition-all ${
                      request.status === 'approved'
                        ? 'bg-green-900/20 border-green-600'
                        : request.status === 'rejected'
                        ? 'bg-red-900/20 border-red-600'
                        : 'bg-yellow-900/20 border-yellow-600'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          Request #{request.id.slice(-8)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {request.amount} tokens requested
                        </p>
                        <p className="text-sm text-gray-400">
                          State: {request.state}
                        </p>
                        <p className="text-sm text-gray-400">
                          Created: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'approved'
                            ? 'bg-green-500/20 text-green-400'
                            : request.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        {request.approvedAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(request.approvedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Incoming Credit Requests Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="card mb-8"
          >
            <h2 className="text-xl font-semibold mb-6">Incoming Credit Requests</h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {incomingRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No incoming requests found
                </p>
              ) : (
                incomingRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-4 rounded-xl border transition-all ${
                      request.status === 'accepted'
                        ? 'bg-green-900/20 border-green-600'
                        : request.status === 'rejected'
                        ? 'bg-red-900/20 border-red-600'
                        : 'bg-blue-900/20 border-blue-600'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          Request #{request.id.slice(-8)}
                        </p>
                        <p className="text-sm text-gray-400">
                          From: {request.fromAddress.slice(0, 6)}...{request.fromAddress.slice(-4)}
                        </p>
                        <p className="text-sm text-gray-400">
                          Credits Requested: {request.amount}
                        </p>
                        <p className="text-sm text-gray-400">
                          Created: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'accepted'
                            ? 'bg-green-500/20 text-green-400'
                            : request.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        
                        {request.status === 'pending' && (
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() => handleSendCredits(request.id)}
                              className="btn-primary text-xs px-3 py-1"
                            >
                              Send Credits
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="btn-secondary text-xs px-3 py-1"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Producer;