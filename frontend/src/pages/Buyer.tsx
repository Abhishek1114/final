import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Trash2, Download, RefreshCw, MessageCircle, Send } from 'lucide-react';
import { getWalletAddress, getOwnedTokens, retireCredit, isTokenRetired, handleChainError, waitForTransactionAndRefresh, listenForTransfers } from '../lib/chain';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface CreditToken {
  tokenId: number;
  isRetired: boolean;
}

interface Producer {
  id: string;
  name: string;
  address: string;
  state: string;
  city: string;
  verified: boolean;
  totalCredits: number;
  availableCredits: number;
  description: string;
  verificationDate: string;
}

const Buyer: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [credits, setCredits] = useState<CreditToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetiring, setIsRetiring] = useState<number | null>(null);
  
  // Retirement confirmation state
  const [confirmRetirement, setConfirmRetirement] = useState<number | null>(null);

  // Producers state
  const [producers, setProducers] = useState<Producer[]>([]);
  const [showRequestModal, setShowRequestModal] = useState<Producer | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestedCredits, setRequestedCredits] = useState(1);

  useEffect(() => {
    loadWalletAndCredits();
    loadProducers();
    
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

  const handleRetireCredit = async (tokenId: number) => {
    setIsRetiring(tokenId);
    
    try {
      const tx = await retireCredit(tokenId);
      
      toast.info('Retirement submitted. Waiting for confirmation...');
      
      // Use the new transaction handling
      await waitForTransactionAndRefresh(tx, () => {
        if (walletAddress) {
          loadCredits(walletAddress);
        }
      });
      
      toast.success(`Credit #${tokenId} retired successfully`);
      setConfirmRetirement(null);
      
    } catch (error) {
      const chainError = handleChainError(error);
      toast.error(chainError.message);
    } finally {
      setIsRetiring(null);
    }
  };

  const downloadRetirementProof = (tokenId: number) => {
    const proof = {
      creditId: tokenId,
      retiredBy: walletAddress,
      retiredAt: new Date().toISOString(),
      blockchain: 'Ethereum Sepolia Testnet',
      contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,
      purpose: 'Carbon offset via green hydrogen credit retirement',
      verification: 'This credit has been permanently retired and cannot be transferred.',
    };
    
    const dataStr = JSON.stringify(proof, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `hydrocred-retirement-proof-${tokenId}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Retirement proof downloaded');
  };

  const handleRefresh = () => {
    if (walletAddress) {
      loadCredits(walletAddress);
      loadProducers();
      toast.info('Refreshing credits...');
    }
  };

  const loadProducers = () => {
    // Mock verified producers data - in a real app, this would come from a backend API
    const mockProducers: Producer[] = [
      {
        id: 'prod-001',
        name: 'Gujarat Green Hydrogen Co.',
        address: '0x34a0...71c9',
        state: 'Gujarat',
        city: 'Ahmedabad',
        verified: true,
        totalCredits: 50,
        availableCredits: 12,
        description: 'Leading hydrogen producer in Gujarat with state-of-the-art electrolysis facilities',
        verificationDate: '2024-12-15'
      },
      {
        id: 'prod-002',
        name: 'Renewable Energy Solutions Ltd',
        address: '0x742d35Cc6634C0532925a3b8D39aA0F8C8b4C8f0',
        state: 'Gujarat',
        city: 'Surat',
        verified: true,
        totalCredits: 35,
        availableCredits: 8,
        description: 'Certified green hydrogen production using solar-powered electrolysis',
        verificationDate: '2024-11-20'
      },
      {
        id: 'prod-003',
        name: 'Clean Energy Gujarat Pvt Ltd',
        address: '0x8ba1f109551bD432803012645Hac136c34B5c4c3',
        state: 'Gujarat',
        city: 'Vadodara',
        verified: true,
        totalCredits: 28,
        availableCredits: 5,
        description: 'Sustainable hydrogen production with zero carbon footprint certification',
        verificationDate: '2024-10-05'
      }
    ];
    
    setProducers(mockProducers);
  };

  const handleRequestCredits = (producer: Producer) => {
    setShowRequestModal(producer);
    setRequestMessage('');
    setRequestedCredits(1);
  };

  const submitCreditRequest = () => {
    if (!showRequestModal || !walletAddress) return;

    // Create a request to the producer
    const request = {
      id: `incoming-${Date.now()}-${walletAddress.slice(-4)}`,
      buyerAddress: walletAddress,
      buyerName: 'Buyer Company', // In a real app, this would come from user profile
      creditsRequested: requestedCredits,
      status: 'pending' as const,
      requestDate: new Date().toISOString().split('T')[0],
      message: requestMessage || `Request for ${requestedCredits} verified hydrogen credits`
    };

    // Save to localStorage (simulating backend)
    const existingRequests = JSON.parse(localStorage.getItem('incomingCreditRequests') || '[]');
    existingRequests.push(request);
    localStorage.setItem('incomingCreditRequests', JSON.stringify(existingRequests));

    toast.success(`Credit request sent to ${showRequestModal.name}`);
    setShowRequestModal(null);
    setRequestMessage('');
    setRequestedCredits(1);
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
          <Users className="h-16 w-16 text-brand mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400">Please connect your wallet to access the buyer dashboard</p>
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
                <Users className="h-8 w-8 text-brand" />
                <h1 className="text-3xl font-bold">Buyer Dashboard</h1>
              </div>
              <button
                onClick={handleRefresh}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
            <p className="text-gray-400">Purchase and retire credits for carbon offset</p>
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
              <p className="text-gray-400">Available to Retire</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-orange-400">{retiredCredits.length}</h3>
              <p className="text-gray-400">Retired for Offset</p>
            </motion.div>
          </div>

          {/* Verified Producers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="card mb-8"
          >
            <h2 className="text-xl font-semibold mb-6">Verified Producers</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {producers.map((producer) => (
                <div key={producer.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-600 hover:border-brand/50 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-brand">{producer.name}</h3>
                      <p className="text-sm text-gray-400">{producer.state} | {producer.city}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Address: {producer.address}
                      </p>
                    </div>
                    {producer.verified && (
                      <div className="bg-green-600/20 text-green-400 text-xs px-2 py-1 rounded-full">
                        Verified
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                    {producer.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-400">Total Credits</p>
                      <p className="font-semibold text-white">{producer.totalCredits}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Available</p>
                      <p className="font-semibold text-green-400">{producer.availableCredits}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRequestCredits(producer)}
                      disabled={producer.availableCredits === 0}
                      className="bg-brand hover:bg-brand-accent text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MessageCircle className="h-3 w-3" />
                      <span>Request Credits</span>
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Verified: {new Date(producer.verificationDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Credits Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Credits */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="card"
            >
              <h2 className="text-xl font-semibold mb-6">Active Credits</h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activeCredits.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No active credits. Purchase credits from producers to get started.
                  </p>
                ) : (
                  activeCredits.map((credit) => (
                    <div key={credit.tokenId} className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-semibold text-brand">
                            Credit #{credit.tokenId}
                          </p>
                          <p className="text-sm text-gray-400">
                            1 verified green hydrogen unit
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setConfirmRetirement(credit.tokenId)}
                            disabled={isRetiring === credit.tokenId}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center space-x-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Retire</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span className="text-xs text-green-400 font-medium">Active</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Retired Credits */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="card"
            >
              <h2 className="text-xl font-semibold mb-6">Retired Credits</h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {retiredCredits.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No retired credits yet
                  </p>
                ) : (
                  retiredCredits.map((credit) => (
                    <div key={credit.tokenId} className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 opacity-80">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-semibold text-gray-300">
                            Credit #{credit.tokenId}
                          </p>
                          <p className="text-sm text-gray-500">
                            Permanently retired
                          </p>
                        </div>
                        
                        <button
                          onClick={() => downloadRetirementProof(credit.tokenId)}
                          className="bg-brand hover:bg-brand-accent text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center space-x-1"
                        >
                          <Download className="h-3 w-3" />
                          <span>Proof</span>
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="w-3 h-3 bg-gray-500 rounded-full" />
                        <span className="text-xs text-gray-500 font-medium">Retired</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Retirement Confirmation Modal */}
          {confirmRetirement && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card max-w-md mx-4"
              >
                <h3 className="text-xl font-bold mb-4">Confirm Credit Retirement</h3>
                <p className="text-gray-400 mb-6">
                  Are you sure you want to retire Credit #{confirmRetirement}? 
                  This action is permanent and cannot be undone.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setConfirmRetirement(null)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRetireCredit(confirmRetirement)}
                    disabled={isRetiring === confirmRetirement}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 flex-1 flex items-center justify-center space-x-2"
                  >
                    {isRetiring === confirmRetirement ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Retiring...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        <span>Retire Credit</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Credit Request Modal */}
          {showRequestModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card max-w-md mx-4"
              >
                <h3 className="text-xl font-bold mb-4">Request Credits from {showRequestModal.name}</h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-sm text-gray-400">Producer Details</p>
                    <p className="font-medium">{showRequestModal.name}</p>
                    <p className="text-sm text-gray-400">{showRequestModal.state} | {showRequestModal.city}</p>
                    <p className="text-sm text-green-400">Available Credits: {showRequestModal.availableCredits}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Credits</label>
                    <input
                      type="number"
                      min="1"
                      max={showRequestModal.availableCredits}
                      value={requestedCredits}
                      onChange={(e) => setRequestedCredits(Number(e.target.value))}
                      className="input w-full"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max: {showRequestModal.availableCredits} credits
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Message (Optional)</label>
                    <textarea
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="Tell the producer why you need these credits..."
                      className="input w-full h-24 resize-none"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowRequestModal(null)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitCreditRequest}
                    className="btn-primary flex-1 flex items-center justify-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send Request</span>
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

export default Buyer;