import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, Leaf, BarChart3 } from 'lucide-react';

const Home: React.FC = () => {
  const roles = [
    {
      title: 'Certifier',
      description: 'Issue verified green hydrogen credits to producers',
      icon: <Shield className="h-8 w-8" />,
      path: '/certifier',
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Producer',
      description: 'Manage and transfer your hydrogen production credits',
      icon: <Leaf className="h-8 w-8" />,
      path: '/producer',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Buyer',
      description: 'Purchase and retire credits for carbon offset',
      icon: <Users className="h-8 w-8" />,
      path: '/buyer',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Regulator',
      description: 'Monitor and audit the credit system',
      icon: <BarChart3 className="h-8 w-8" />,
      path: '/regulator',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <img src="/hydrocred.png" alt="HydroCred" className="h-24 w-24 mx-auto mb-6" />
              <h1 className="text-6xl font-bold mb-4">
                <span className="gradient-text">HydroCred</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Blockchain-powered green hydrogen credit system with immutable audit trails.
                Issue, transfer, and retire verified hydrogen production credits.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4 mb-16"
            >
              <div className="bg-gray-800/50 px-6 py-3 rounded-xl border border-gray-700">
                <span className="text-brand font-semibold">Ethereum Testnet</span>
              </div>
              <div className="bg-gray-800/50 px-6 py-3 rounded-xl border border-gray-700">
                <span className="text-brand font-semibold">ERC-721 Standard</span>
              </div>
              <div className="bg-gray-800/50 px-6 py-3 rounded-xl border border-gray-700">
                <span className="text-brand font-semibold">Immutable Ledger</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-accent/5 rounded-full blur-3xl"></div>
        </div>
      </motion.div>

      {/* Roles Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Choose Your Role</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Select your role to access the appropriate dashboard and functionality
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role, index) => (
            <motion.div
              key={role.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
            >
              <Link to={role.path} className="block group">
                <div className="card hover:bg-gray-800/70 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-4 text-white`}>
                    {role.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-brand transition-colors">
                    {role.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {role.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="bg-gray-900/50 py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why HydroCred?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Immutable Verification</h3>
              <p className="text-gray-400">Every credit is cryptographically verified and recorded on the blockchain</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Leaf className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Green Energy Focus</h3>
              <p className="text-gray-400">Specifically designed for green hydrogen production credits</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete Audit Trail</h3>
              <p className="text-gray-400">Track every credit from issuance to retirement with full transparency</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;