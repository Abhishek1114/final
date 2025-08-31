const { ethers } = require('ethers');
const HydroCredTokenABI = require('../artifacts/contracts/HydroCredToken.sol/HydroCredToken.json').abi;

async function testFrontendRPC() {
  try {
    console.log('🔍 Testing frontend RPC connection...');
    
    // Use the exact same RPC URL as frontend
    const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/demo';
    const CONTRACT_ADDRESS = '0xa1B7a0745D37f48f7E5328E31dF4Be64b693C62d';
    
    console.log('📋 RPC URL:', RPC_URL);
    console.log('📋 Contract address:', CONTRACT_ADDRESS);
    
    // Create provider exactly like frontend
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, HydroCredTokenABI, provider);
    
    // Test addresses
    const adminAddress = '0x34a0eF8AC40f455C76cE7332844a55442F6e71c9';
    const newAddress = '0xd15B1985392D70cEb22d44Df0dab03425277Ce14';
    
    console.log('\n🔍 Testing admin tokens...');
    try {
      const adminTokens = await contract.tokensOfOwner(adminAddress);
      console.log('✅ Admin tokens:', adminTokens.map(t => Number(t)));
    } catch (error) {
      console.log('❌ Error getting admin tokens:', error.message);
    }
    
    console.log('\n🔍 Testing new address tokens...');
    try {
      const newTokens = await contract.tokensOfOwner(newAddress);
      console.log('✅ New address tokens:', newTokens.map(t => Number(t)));
    } catch (error) {
      console.log('❌ Error getting new address tokens:', error.message);
    }
    
    console.log('\n🔍 Testing total supply...');
    try {
      const totalSupply = await contract.totalSupply();
      console.log('✅ Total supply:', totalSupply.toString());
    } catch (error) {
      console.log('❌ Error getting total supply:', error.message);
    }
    
    console.log('\n🔍 Testing network connection...');
    try {
      const network = await provider.getNetwork();
      console.log('✅ Network:', network.name, 'Chain ID:', network.chainId);
    } catch (error) {
      console.log('❌ Error getting network:', error.message);
    }
    
    console.log('\n🔍 Testing block number...');
    try {
      const blockNumber = await provider.getBlockNumber();
      console.log('✅ Current block:', blockNumber);
    } catch (error) {
      console.log('❌ Error getting block number:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendRPC();
