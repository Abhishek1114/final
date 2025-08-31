import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, ExternalLink } from 'lucide-react';
import { batchIssueCredits, getWalletAddress, isCertifier, getExplorerUrl, handleChainError } from '../lib/chain';
import { getLedgerData, CreditEvent } from '../lib/api';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Certifier: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isCertifierRole, setIsCertifierRole] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issuedCredits, setIssuedCredits] = useState<CreditEvent[]>([]);
  
  // Form state
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    checkCertifierStatus();
    loadIssuedCredits();
  }, []);

  const checkCertifierStatus = async () => {
    try {
      const address = await getWalletAddress();
      setWalletAddress(address);
      
      if (address) {
        const certifierStatus = await isCertifier(address);
        setIsCertifierRole(certifierStatus);
      }
    } catch (error) {
      console.error('Failed to check certifier status:', error);
      toast.error('Failed to connect to blockchain');
    } finally {
      setIsLoading(false);
    }
  };

  const loadIssuedCredits = async () => {
    try {
      const data = await getLedgerData();
      const issued = data.events.filter(event => event.type === 'issued');
      setIssuedCredits(issued);
    } catch (error) {
      console.error('Failed to load issued credits:', error);
      toast.error('Failed to load credit history');
    }
  };

  const handleIssueCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientAddress || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > 1000) {
      toast.error('Amount must be between 1 and 1000');
      return;
    }

    setIsIssuing(true);
    
    try {
      const tx = await batchIssueCredits(recipientAddress, amountNum);
      
      toast.info('Transaction submitted. Waiting for confirmation...');
      
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        toast.success(`Successfully issued ${amountNum} credits to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`);
        setRecipientAddress('');
        setAmount('');
        loadIssuedCredits(); // Refresh the list
      } else {
        toast.error('Transaction failed');
      }
    } catch (error) {
      const chainError = handleChainError(error);
      toast.error(chainError.message);
    } finally {
      setIsIssuing(false);
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
          <Shield className="h-16 w-16 text-brand mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400">Please connect your wallet to access the certifier dashboard</p>
        </motion.div>
      </div>
    );
  }

  if (!isCertifierRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center card max-w-md"
        >
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-4">
            Your wallet address is not authorized as a certifier.
          </p>
          <p className="text-sm text-gray-500">
            Current address: {walletAddress}
          </p>
        </motion.div>
      </div>
    );
  }

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
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="h-8 w-8 text-brand" />
              <h1 className="text-3xl font-bold">Certifier Dashboard</h1>
            </div>
            <p className="text-gray-400">Issue verified green hydrogen credits to producers</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Issue Credits Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card"
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-brand" />
                Issue New Credits
              </h2>
              
              <form onSubmit={handleIssueCredits} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Producer Address
                  </label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="0x..."
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Amount (1-1000 credits)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100"
                    min="1"
                    max="1000"
                    className="input w-full"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isIssuing}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {isIssuing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Issuing Credits...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Issue Credits</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Issued Credits History */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="card"
            >
              <h2 className="text-xl font-semibold mb-6">Recent Issuances</h2>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {issuedCredits.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No credits issued yet</p>
                ) : (
                  issuedCredits.slice(0, 10).map((event, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-brand">
                            {event.amount} Credits Issued
                          </p>
                          <p className="text-sm text-gray-400">
                            To: {event.to?.slice(0, 6)}...{event.to?.slice(-4)}
                          </p>
                        </div>
                        <a
                          href={getExplorerUrl(event.transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand hover:text-brand-accent transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <p>Token IDs: #{event.fromId} - #{event.toId}</p>
                        <p>Block: {event.blockNumber}</p>
                        <p>{new Date(event.timestamp * 1000).toLocaleString()}</p>
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

export default Certifier;