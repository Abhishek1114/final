import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, X, RefreshCw, Clock } from 'lucide-react';
import { getWalletAddress, batchIssueCredits, handleChainError, waitForTransactionAndRefresh, isCertifier } from '../lib/chain';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface TokenRequest {
  id: string;
  producerAddress: string;
  producerName: string;
  state: string;
  city: string;
  tokensRequested: number;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  description?: string;
}

const StateAdmin: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCertifierAccount, setIsCertifierAccount] = useState(false);
  const [requests, setRequests] = useState<TokenRequest[]>([]);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  // Mock data - in a real app, this would come from a backend API
  const mockRequests: TokenRequest[] = [
    {
      id: 'req-001',
      producerAddress: '0x34a0...71c9',
      producerName: 'Gujarat Green Hydrogen Co.',
      state: 'Gujarat',
      city: 'Ahmedabad',
      tokensRequested: 1,
      status: 'pending',
      requestDate: '2025-01-08',
      description: 'Initial token request for hydrogen production verification'
    },
    {
      id: 'req-002',
      producerAddress: '0x34a0...71c9',
      producerName: 'Gujarat Green Hydrogen Co.',
      state: 'Gujarat',
      city: 'Ahmedabad',
      tokensRequested: 1,
      status: 'pending',
      requestDate: '2025-01-08',
      description: 'Additional token request for increased production capacity'
    }
  ];

  useEffect(() => {
    loadWalletAndRequests();
  }, []);

  const loadWalletAndRequests = async () => {
    try {
      const address = await getWalletAddress();
      setWalletAddress(address);
      
      if (address) {
        const hasCertifierRole = await isCertifier(address);
        setIsCertifierAccount(hasCertifierRole);
        
        // Load requests from localStorage or API
        const savedRequests = localStorage.getItem('tokenRequests');
        if (savedRequests) {
          setRequests(JSON.parse(savedRequests));
        } else {
          // Initialize with mock data
          setRequests(mockRequests);
          localStorage.setItem('tokenRequests', JSON.stringify(mockRequests));
        }
      }
    } catch (error) {
      console.error('Failed to load wallet and requests:', error);
      toast.error('Failed to connect to blockchain');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRequest = async (request: TokenRequest) => {
    if (!walletAddress || !isCertifierAccount) {
      toast.error('You need certifier role to approve requests');
      return;
    }

    setProcessingRequest(request.id);
    
    try {
      // Issue tokens to the producer
      const tx = await batchIssueCredits(request.producerAddress, request.tokensRequested);
      
      toast.info('Token issuance submitted. Waiting for confirmation...');
      
      await waitForTransactionAndRefresh(tx, () => {
        // Update request status
        const updatedRequests = requests.map(req => 
          req.id === request.id 
            ? { ...req, status: 'approved' as const }
            : req
        );
        setRequests(updatedRequests);
        localStorage.setItem('tokenRequests', JSON.stringify(updatedRequests));
        
        toast.success(`Successfully issued ${request.tokensRequested} tokens to ${request.producerName}`);
      });
      
    } catch (error) {
      const chainError = handleChainError(error);
      toast.error(chainError.message);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = (request: TokenRequest) => {
    const updatedRequests = requests.map(req => 
      req.id === request.id 
        ? { ...req, status: 'rejected' as const }
        : req
    );
    setRequests(updatedRequests);
    localStorage.setItem('tokenRequests', JSON.stringify(updatedRequests));
    
    toast.info(`Request from ${request.producerName} has been rejected`);
  };

  const handleRefresh = () => {
    loadWalletAndRequests();
    toast.info('Refreshing requests...');
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
          <Shield className="h-16 w-16 text-brand mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400">Please connect your wallet to access the state admin dashboard</p>
        </motion.div>
      </div>
    );
  }

  if (!isCertifierAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">You need certifier role to access the state admin dashboard</p>
          <p className="text-sm text-gray-500 mt-2">Current address: {walletAddress}</p>
        </motion.div>
      </div>
    );
  }

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const processedRequests = requests.filter(req => req.status !== 'pending');

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
                <Shield className="h-8 w-8 text-brand" />
                <h1 className="text-3xl font-bold">State Admin Dashboard</h1>
              </div>
              <button
                onClick={handleRefresh}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
            <p className="text-gray-400">Manage producer token requests for Gujarat state</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-orange-400">{pendingRequests.length}</h3>
              <p className="text-gray-400">Pending Requests</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-green-400">
                {requests.filter(req => req.status === 'approved').length}
              </h3>
              <p className="text-gray-400">Approved Requests</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-red-400">
                {requests.filter(req => req.status === 'rejected').length}
              </h3>
              <p className="text-gray-400">Rejected Requests</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pending Requests */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="card"
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-orange-400" />
                Pending Requests
              </h2>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {pendingRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No pending requests
                  </p>
                ) : (
                  pendingRequests.map((request) => (
                    <div key={request.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-brand">{request.producerName}</h3>
                          <p className="text-sm text-gray-400">{request.state} | {request.city}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Address: {request.producerAddress}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-white">{request.tokensRequested}</p>
                          <p className="text-xs text-gray-400">tokens</p>
                        </div>
                      </div>
                      
                      {request.description && (
                        <p className="text-sm text-gray-300 mb-3">{request.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Requested: {request.requestDate}
                        </span>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRejectRequest(request)}
                            disabled={processingRequest === request.id}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center space-x-1"
                          >
                            <X className="h-3 w-3" />
                            <span>Reject</span>
                          </button>
                          
                          <button
                            onClick={() => handleApproveRequest(request)}
                            disabled={processingRequest === request.id}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center space-x-1"
                          >
                            {processingRequest === request.id ? (
                              <>
                                <LoadingSpinner size="sm" />
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <Check className="h-3 w-3" />
                                <span>Approve</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Processed Requests */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="card"
            >
              <h2 className="text-xl font-semibold mb-6">Request History</h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {processedRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No processed requests yet
                  </p>
                ) : (
                  processedRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`p-4 rounded-xl border transition-all ${
                        request.status === 'approved'
                          ? 'bg-green-900/20 border-green-700/50'
                          : 'bg-red-900/20 border-red-700/50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{request.producerName}</p>
                          <p className="text-sm text-gray-400">{request.tokensRequested} tokens</p>
                          <p className="text-xs text-gray-500">{request.requestDate}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            request.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className={`text-sm font-medium ${
                            request.status === 'approved' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
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

export default StateAdmin;