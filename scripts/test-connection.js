const { ethers } = require('ethers');
const axios = require('axios');

// Configuration
const CONTRACT_ADDRESS = '0xaA7b945a4Cd4381DcF5D4Bc6e0E5cc76e6A3Fc39';
const RPC_URLS = [
  'https://eth-sepolia.g.alchemy.com/v2/demo',
  'https://rpc.sepolia.org',
  'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  'https://ethereum-sepolia.publicnode.com',
  'https://sepolia.drpc.org'
];

// Contract ABI (minimal for testing)
const CONTRACT_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokensOfOwner(address owner) view returns (uint256[])',
  'function isRetired(uint256 tokenId) view returns (bool)',
  'function CERTIFIER_ROLE() view returns (bytes32)'
];

async function testRPCConnections() {
  console.log('🔍 Testing RPC Connections...\n');
  
  for (const rpcUrl of RPC_URLS) {
    try {
      console.log(`📡 Testing: ${rpcUrl}`);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Test basic connection
      const blockNumber = await provider.getBlockNumber();
      console.log(`✅ Connected! Block: ${blockNumber}`);
      
      // Test contract interaction
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      try {
        const name = await contract.name();
        const symbol = await contract.symbol();
        const totalSupply = await contract.totalSupply();
        
        console.log(`📋 Contract Info:`);
        console.log(`   Name: ${name}`);
        console.log(`   Symbol: ${symbol}`);
        console.log(`   Total Supply: ${totalSupply.toString()}`);
        console.log(`✅ Contract accessible!\n`);
        
        return rpcUrl; // Return the first working RPC
      } catch (contractError) {
        console.log(`❌ Contract error: ${contractError.message}\n`);
      }
      
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}\n`);
    }
  }
  
  throw new Error('No RPC endpoints are working');
}

async function testBackendAPI() {
  console.log('🔍 Testing Backend API...\n');
  
  try {
    const response = await axios.get('http://localhost:5055/api/health', {
      timeout: 5000
    });
    console.log('✅ Backend API is running');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Backend API error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend is running: npm run backend:dev');
    }
  }
}

async function main() {
  console.log('🚀 HydroCred Connection Test\n');
  console.log('=' .repeat(50));
  
  try {
    // Test RPC connections
    const workingRPC = await testRPCConnections();
    console.log(`🎯 Recommended RPC URL: ${workingRPC}`);
    
    console.log('\n' + '=' .repeat(50));
    
    // Test backend API
    await testBackendAPI();
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Connection test completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check your internet connection');
    console.log('2. Ensure the backend is running: npm run backend:dev');
    console.log('3. Try using a different RPC endpoint');
    console.log('4. Check if the contract address is correct');
  }
}

main();
