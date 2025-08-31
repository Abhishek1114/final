import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ExternalLink, RefreshCw, Filter, Search } from 'lucide-react';
import { getLedgerData, CreditEvent } from '../lib/api';
import { getExplorerUrl } from '../lib/chain';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Regulator: React.FC = () => {
  const [events, setEvents] = useState<CreditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'issued' | 'transferred' | 'retired'>('all');
  const [searchAddress, setSearchAddress] = useState('');

  useEffect(() => {
    loadLedgerData();
  }, []);

  const loadLedgerData = async () => {
    try {
      const data = await getLedgerData();
      setEvents(data.events);
    } catch (error) {
      console.error('Failed to load ledger data:', error);
      toast.error('Failed to load blockchain data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    loadLedgerData();
    toast.info('Refreshing ledger data...');
  };

  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.type === filter;
    const matchesSearch = !searchAddress || 
      event.to?.toLowerCase().includes(searchAddress.toLowerCase()) ||
      event.from?.toLowerCase().includes(searchAddress.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'issued':
        return '🏭';
      case 'transferred':
        return '↔️';
      case 'retired':
        return '🗑️';
      default:
        return '📋';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'issued':
        return 'text-green-400 border-green-700 bg-green-900/20';
      case 'transferred':
        return 'text-blue-400 border-blue-700 bg-blue-900/20';
      case 'retired':
        return 'text-orange-400 border-orange-700 bg-orange-900/20';
      default:
        return 'text-gray-400 border-gray-700 bg-gray-900/20';
    }
  };

  const formatEventDescription = (event: CreditEvent) => {
    switch (event.type) {
      case 'issued':
        return `${event.amount} credits issued to ${event.to?.slice(0, 6)}...${event.to?.slice(-4)}`;
      case 'transferred':
        return `Credit #${event.tokenId} transferred from ${event.from?.slice(0, 6)}...${event.from?.slice(-4)} to ${event.to?.slice(0, 6)}...${event.to?.slice(-4)}`;
      case 'retired':
        return `Credit #${event.tokenId} retired by ${event.from?.slice(0, 6)}...${event.from?.slice(-4)}`;
      default:
        return 'Unknown event';
    }
  };

  const stats = {
    totalEvents: events.length,
    totalIssued: events.filter(e => e.type === 'issued').reduce((sum, e) => sum + (e.amount || 0), 0),
    totalTransferred: events.filter(e => e.type === 'transferred').length,
    totalRetired: events.filter(e => e.type === 'retired').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-brand" />
                <h1 className="text-3xl font-bold">Regulator Dashboard</h1>
              </div>
              <button
                onClick={handleRefresh}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
            <p className="text-gray-400">Monitor and audit the green hydrogen credit system</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-brand">{stats.totalEvents}</h3>
              <p className="text-gray-400">Total Events</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-green-400">{stats.totalIssued}</h3>
              <p className="text-gray-400">Credits Issued</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-blue-400">{stats.totalTransferred}</h3>
              <p className="text-gray-400">Transfers</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="card text-center"
            >
              <h3 className="text-2xl font-bold text-orange-400">{stats.totalRetired}</h3>
              <p className="text-gray-400">Retired</p>
            </motion.div>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="card mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-brand" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="input"
                >
                  <option value="all">All Events</option>
                  <option value="issued">Issued</option>
                  <option value="transferred">Transferred</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2 flex-1">
                <Search className="h-4 w-4 text-brand" />
                <input
                  type="text"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="Search by address..."
                  className="input flex-1"
                />
              </div>
            </div>
          </motion.div>

          {/* Events List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="card"
          >
            <h2 className="text-xl font-semibold mb-6">Blockchain Events</h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No events found matching your criteria
                </p>
              ) : (
                filteredEvents.map((event, index) => (
                  <div
                    key={`${event.transactionHash}-${index}`}
                    className={`p-4 rounded-xl border transition-all ${getEventColor(event.type)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getEventIcon(event.type)}</span>
                        <div>
                          <p className="font-semibold capitalize">
                            {event.type}
                          </p>
                          <p className="text-sm text-gray-400">
                            {formatEventDescription(event)}
                          </p>
                        </div>
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
                    
                    <div className="text-xs text-gray-500 grid grid-cols-2 gap-4">
                      <p>Block: {event.blockNumber}</p>
                      <p>{new Date(event.timestamp * 1000).toLocaleString()}</p>
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

export default Regulator;