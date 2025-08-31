import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Send, RefreshCw, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getWalletAddress, getOwnedTokens, transferCredit, isTokenRetired, handleChainError, waitForTransactionAndRefresh, listenForTransfers } from '../lib/chain';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface CreditToken {
  tokenId: number;
  isRetired: boolean;
}

interface TokenRequest {
  id: string;
  producerAddress: string;
  state: string;
  city: string;
  tokensRequested: number;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  description?: string;
}

interface IncomingRequest {
  id: string;
  buyerAddress: string;
  buyerName: string;
  creditsRequested: number;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  message?: string;
}

const Producer: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [credits, setCredits] = useState<CreditToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState<number | null>(null);
  
  // Transfer form state
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [transferAddress, setTransferAddress] = useState('');

  // Request system state
  const [tokenRequests, setTokenRequests] = useState<TokenRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestTokens, setRequestTokens] = useState(1);
  const [requestDescription, setRequestDescription] = useState('');

  useEffect(() => {
    loadWalletAndCredits();
    loadRequests();
    
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
      loadRequests();
      toast.info('Refreshing credits...');
    }
  };

  const loadRequests = () => {
    if (!walletAddress) return;
    
    // Load token requests from localStorage
    const savedRequests = localStorage.getItem('tokenRequests');
    if (savedRequests) {
      const allRequests = JSON.parse(savedRequests);
      const myRequests = allRequests.filter((req: TokenRequest) => req.producerAddress === walletAddress);
      setTokenRequests(myRequests);
    }

    // Load incoming requests from localStorage
    const savedIncomingRequests = localStorage.getItem('incomingCreditRequests');
    if (savedIncomingRequests) {
      const allIncomingRequests = JSON.parse(savedIncomingRequests);
      const myIncomingRequests = allIncomingRequests.filter((req: IncomingRequest) => req.id.includes(walletAddress.slice(-4)));
      setIncomingRequests(myIncomingRequests);
    } else {
      // Initialize with mock incoming requests
      const mockIncomingRequests: IncomingRequest[] = [
        {
          id: `incoming-001-${walletAddress.slice(-4)}`,
          buyerAddress: '0x742d35Cc6634C0532925a3b8D39aA0F8C8b4C8f0',
          buyerName: 'Green Energy Corp',
          creditsRequested: 1,
          status: 'pending',
          requestDate: '2025-01-08',
          message: 'We need verified hydrogen credits for our carbon offset program'
        },
        {
          id: `incoming-002-${walletAddress.slice(-4)}`,
          buyerAddress: '0x8ba1f109551bD432803012645Hac136c34B5c4c3',
          buyerName: 'Sustainable Industries Ltd',
          creditsRequested: 1,
          status: 'pending',
          requestDate: '2025-01-08',
          message: 'Looking for high-quality hydrogen credits for our ESG goals'
        }
      ];
      setIncomingRequests(mockIncomingRequests);
      localStorage.setItem('incomingCreditRequests', JSON.stringify(mockIncomingRequests));
    }
  };

  const handleRequestTokens = () => {
    if (!walletAddress) {
      toast.error('Wallet not connected');
      return;
    }

    if (requestTokens < 1 || requestTokens > 1000) {
      toast.error('Token amount must be between 1 and 1000');
      return;
    }

    const newRequest: TokenRequest = {
      id: `req-${Date.now()}`,
      producerAddress: walletAddress,
      state: 'Gujarat',
      city: 'Ahmedabad',
      tokensRequested: requestTokens,
      status: 'pending',
      requestDate: new Date().toISOString().split('T')[0],
      description: requestDescription || 'Token request for hydrogen production verification'
    };

    // Save to localStorage (simulating backend)
    const existingRequests = JSON.parse(localStorage.getItem('tokenRequests') || '[]');
    const updatedRequests = [...existingRequests, newRequest];
    localStorage.setItem('tokenRequests', JSON.stringify(updatedRequests));

    setTokenRequests([...tokenRequests, newRequest]);
    setShowRequestForm(false);
    setRequestTokens(1);
    setRequestDescription('');
    
    toast.success('Token request submitted to State Admin');
  };

  const handleSendCredits = async (incomingRequest: IncomingRequest) => {
    if (activeCredits.length === 0) {
      toast.error('No active credits available to send');
      return;
    }

    if (activeCredits.length < incomingRequest.creditsRequested) {
      toast.error('Insufficient active credits');
      return;
    }

    setIsTransferring(activeCredits[0].tokenId);
    
    try {
      // Transfer the first available credit
      const tx = await transferCredit(walletAddress!, incomingRequest.buyerAddress, activeCredits[0].tokenId);
      
      toast.info('Credit transfer submitted. Waiting for confirmation...');
      
      await waitForTransactionAndRefresh(tx, () => {
        if (walletAddress) {
          loadCredits(walletAddress);
        }
      });
      
      // Update incoming request status
      const updatedIncomingRequests = incomingRequests.map(req => 
        req.id === incomingRequest.id 
          ? { ...req, status: 'approved' as const }
          : req
      );
      setIncomingRequests(updatedIncomingRequests);
      localStorage.setItem('incomingCreditRequests', JSON.stringify(updatedIncomingRequests));
      
      toast.success(`Credit sent to ${incomingRequest.buyerName}`);
      
    } catch (error) {
      const chainError = handleChainError(error);
      toast.error(chainError.message);
    } finally {
      setIsTransferring(null);
    }
  };

  const handleRejectIncomingRequest = (incomingRequest: IncomingRequest) => {
    const updatedIncomingRequests = incomingRequests.map(req => 
      req.id === incomingRequest.id 
        ? { ...req, status: 'rejected' as const }
        : req
    );
    setIncomingRequests(updatedIncomingRequests);
    localStorage.setItem('incomingCreditRequests', JSON.stringify(updatedIncomingRequests));
    
    toast.info(`Request from ${incomingRequest.buyerName} has been rejected`);
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
  const pendingRequests = tokenRequests.filter(req => req.status === 'pending');
  const approvedRequests = tokenRequests.filter(req => req.status === 'approved');
  const pendingIncomingRequests = incomingRequests.filter(req => req.status === 'pending');

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
            <p className="text-sm text-brand">State: Gujarat | City: Ahmedabad</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
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
              <h3 className="text-2xl font-bold text-orange-400">{pendingIncomingRequests.length}</h3>
              <p className="text-gray-400">Pending Requests</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-green-400">{approvedRequests.length}</h3>
              <p className="text-gray-400">Approved Requests</p>
            </motion.div>
          </div>

          {/* Request Tokens Section */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-brand" />
                  Request Tokens
                </h2>
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Request</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Number of Tokens</label>
                  <p className="text-gray-400 text-sm mb-4">1-1000</p>
                  <p className="text-gray-400 text-sm">Request will be sent to State Admin of Gujarat</p>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => setShowRequestForm(true)}
                    className="btn-primary"
                  >
                    Request Tokens
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Token Requests */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="card"
            >
              <h2 className="text-xl font-semibold mb-6">Token Requests</h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tokenRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No token requests yet. Click "Request Tokens" to get started.
                  </p>
                ) : (
                  tokenRequests.map((request) => (
                    <div key={request.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-semibold">Request #{request.id.split('-')[1]}</p>
                          <p className="text-sm text-gray-400">{request.tokensRequested} tokens requested</p>
                          <p className="text-xs text-gray-500">State: {request.state}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {request.status === 'pending' && (
                            <>
                              <Clock className="h-4 w-4 text-orange-400" />
                              <span className="text-sm text-orange-400">Pending</span>
                            </>
                          )}
                          {request.status === 'approved' && (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-400" />
                              <span className="text-sm text-green-400">Approved</span>
                            </>
                          )}
                          {request.status === 'rejected' && (
                            <>
                              <XCircle className="h-4 w-4 text-red-400" />
                              <span className="text-sm text-red-400">Rejected</span>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{request.requestDate}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Your Credits */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="card"
            >
              <h2 className="text-xl font-semibold mb-6">Your Credits</h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {credits.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No credits found. Request tokens from your State Admin to get started.
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

          {/* Incoming Credit Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="card mb-8"
          >
            <h2 className="text-xl font-semibold mb-6">Incoming Credit Requests</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomingRequests.filter(req => req.status === 'pending').length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">No pending credit requests</p>
                </div>
              ) : (
                incomingRequests
                  .filter(req => req.status === 'pending')
                  .map((request) => (
                    <div key={request.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                      <div className="mb-4">
                        <h3 className="font-semibold">{request.buyerName}</h3>
                        <p className="text-sm text-gray-400">State: Gujarat</p>
                        <p className="text-sm text-gray-400">Credits Requested: {request.creditsRequested}</p>
                        <p className="text-sm text-gray-400">Status: Approved</p>
                        {request.message && (
                          <p className="text-xs text-gray-300 mt-2">{request.message}</p>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSendCredits(request)}
                          disabled={isTransferring !== null || activeCredits.length === 0}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1 flex-1"
                        >
                          {isTransferring ? (
                            <>
                              <LoadingSpinner size="sm" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3" />
                              <span>Send Credits</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleRejectIncomingRequest(request)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1"
                        >
                          <XCircle className="h-3 w-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </motion.div>

          {/* Send Tokens to Buyers Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="card mb-8"
          >
            <h2 className="text-xl font-semibold mb-6">Send Tokens to Buyers</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quick Transfer */}
              <div>
                <h3 className="text-lg font-medium mb-4">Quick Transfer</h3>
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Token</label>
                    <select
                      value={selectedTokenId || ''}
                      onChange={(e) => setSelectedTokenId(Number(e.target.value))}
                      className="input w-full"
                      required
                    >
                      <option value="">Choose a token...</option>
                      {activeCredits.map((credit) => (
                        <option key={credit.tokenId} value={credit.tokenId}>
                          Token #{credit.tokenId}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Buyer Address</label>
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
                    disabled={isTransferring !== null || activeCredits.length === 0}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    {isTransferring === selectedTokenId ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Token</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Individual Token Sales */}
              <div>
                <h3 className="text-lg font-medium mb-4">Individual Token Sales</h3>
                {activeCredits.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No active credits available for sale
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400 mb-4">
                      Only active (non-retired) credits can be sold
                    </p>
                    {activeCredits.slice(0, 3).map((credit) => (
                      <div key={credit.tokenId} className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Token #{credit.tokenId}</p>
                            <p className="text-sm text-gray-400">Available for sale</p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedTokenId(credit.tokenId);
                              setTransferAddress('');
                            }}
                            className="text-brand hover:text-brand-accent text-sm"
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Request Form Modal */}
          {showRequestForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card max-w-md mx-4"
              >
                <h3 className="text-xl font-bold mb-4">Request Tokens from State Admin</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Tokens</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={requestTokens}
                      onChange={(e) => setRequestTokens(Number(e.target.value))}
                      className="input w-full"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Range: 1-1000 tokens</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                    <textarea
                      value={requestDescription}
                      onChange={(e) => setRequestDescription(e.target.value)}
                      placeholder="Reason for token request..."
                      className="input w-full h-24 resize-none"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowRequestForm(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestTokens}
                    className="btn-primary flex-1"
                  >
                    Submit Request
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Producer;