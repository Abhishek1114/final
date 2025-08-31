const { ethers } = require('ethers');
const HydroCredTokenABI = require('../artifacts/contracts/HydroCredToken.sol/HydroCredToken.json').abi;

async function verifyContract() {
  try {
    console.log('🔍 Verifying contract accessibility...');
    
    // Try multiple RPC endpoints
    const rpcEndpoints = [
      'https://eth-sepolia.g.alchemy.com/v2/demo',
      'https://rpc.sepolia.org',
      'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
    ];
    
    let provider = null;
    let workingEndpoint = null;
    
    for (const endpoint of rpcEndpoints) {
      try {
        console.log(`📡 Trying endpoint: ${endpoint}`);
        provider = new ethers.JsonRpcProvider(endpoint);
        await provider.getNetwork();
        workingEndpoint = endpoint;
        console.log(`✅ Connected to network via: ${endpoint}`);
        break;
      } catch (error) {
        console.log(`❌ Failed to connect to: ${endpoint}`);
        continue;
      }
    }
    
    if (!provider) {
      throw new Error('Could not connect to any RPC endpoint');
    }
    
    const contractAddress = '0xa1B7a0745D37f48f7E5328E31dF4Be64b693C62d';
    
    console.log('📋 Creating contract instance...');
    const contract = new ethers.Contract(contractAddress, HydroCredTokenABI, provider);
    
    console.log('🔍 Testing basic contract functions...');
    
    // Test 1: Get contract name
    try {
      const name = await contract.name();
      console.log('✅ Contract name:', name);
    } catch (error) {
      console.log('❌ Error getting name:', error.message);
    }
    
    // Test 2: Get contract symbol
    try {
      const symbol = await contract.symbol();
      console.log('✅ Contract symbol:', symbol);
    } catch (error) {
      console.log('❌ Error getting symbol:', error.message);
    }
    
    // Test 3: Get CERTIFIER_ROLE
    try {
      const certifierRole = await contract.CERTIFIER_ROLE();
      console.log('✅ CERTIFIER_ROLE:', certifierRole);
    } catch (error) {
      console.log('❌ Error getting CERTIFIER_ROLE:', error.message);
    }
    
    // Test 4: Get total supply
    try {
      const totalSupply = await contract.totalSupply();
      console.log('✅ Total supply:', totalSupply.toString());
    } catch (error) {
      console.log('❌ Error getting total supply:', error.message);
    }
    
    // Test 5: Check if contract is paused
    try {
      const paused = await contract.paused();
      console.log('✅ Contract paused:', paused);
    } catch (error) {
      console.log('❌ Error getting paused status:', error.message);
    }
    
    console.log('\n🎉 Contract verification completed!');
    console.log('💡 Working RPC endpoint:', workingEndpoint);
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyContract();
