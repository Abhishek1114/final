const { ethers } = require('ethers');

async function testConnection() {
  try {
    console.log('🔍 Testing simple connection...');
    
    // Use the same RPC and contract as frontend
    const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/demo';
    const CONTRACT_ADDRESS = '0xa1B7a0745D37f48f7E5328E31dF4Be64b693C62d';
    
    console.log('📋 RPC URL:', RPC_URL);
    console.log('📋 Contract address:', CONTRACT_ADDRESS);
    
    // Create provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Test basic connection
    const blockNumber = await provider.getBlockNumber();
    console.log('✅ Current block:', blockNumber);
    
    // Test contract connection
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ['function totalSupply() view returns (uint256)'], provider);
    const totalSupply = await contract.totalSupply();
    console.log('✅ Total supply:', totalSupply.toString());
    
    // Test specific addresses
    const adminAddress = '0x34a0eF8AC40f455C76cE7332844a55442F6e71c9';
    const newAddress = '0xd15B1985392D70cEb22d44Df0dab03425277Ce14';
    
    // Test tokensOfOwner function
    const tokensOfOwnerABI = ['function tokensOfOwner(address owner) view returns (uint256[])'];
    const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, tokensOfOwnerABI, provider);
    
    console.log('\n🔍 Testing admin tokens...');
    const adminTokens = await tokenContract.tokensOfOwner(adminAddress);
    console.log('✅ Admin tokens:', adminTokens.map(t => Number(t)));
    
    console.log('\n🔍 Testing new address tokens...');
    const newTokens = await tokenContract.tokensOfOwner(newAddress);
    console.log('✅ New address tokens:', newTokens.map(t => Number(t)));
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testConnection();
