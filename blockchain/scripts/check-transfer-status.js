const { ethers } = require('ethers');
const HydroCredTokenABI = require('../artifacts/contracts/HydroCredToken.sol/HydroCredToken.json').abi;

async function checkTransferStatus() {
  try {
    console.log('🔍 Checking transfer status...');
    
    // Use the working RPC endpoint
    const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/demo');
    const contractAddress = '0xa1B7a0745D37f48f7E5328E31dF4Be64b693C62d';
    
    // Addresses involved
    const adminAddress = '0x34a0eF8AC40f455C76cE7332844a55442F6e71c9';
    const newAddress = '0xd15B1985392D70cEb22d44Df0dab03425277Ce14';
    
    console.log('📋 Contract address:', contractAddress);
    console.log('👑 Admin address:', adminAddress);
    console.log('🎯 New address:', newAddress);
    
    const contract = new ethers.Contract(contractAddress, HydroCredTokenABI, provider);
    
    // Check admin's tokens
    console.log('\n🔍 Checking admin tokens...');
    try {
      const adminTokens = await contract.tokensOfOwner(adminAddress);
      console.log('✅ Admin tokens:', adminTokens.map(t => Number(t)));
    } catch (error) {
      console.log('❌ Error getting admin tokens:', error.message);
    }
    
    // Check new address tokens
    console.log('\n🔍 Checking new address tokens...');
    try {
      const newTokens = await contract.tokensOfOwner(newAddress);
      console.log('✅ New address tokens:', newTokens.map(t => Number(t)));
    } catch (error) {
      console.log('❌ Error getting new address tokens:', error.message);
    }
    
    // Check specific token owners
    console.log('\n🔍 Checking specific token owners...');
    for (let i = 1; i <= 10; i++) {
      try {
        const owner = await contract.ownerOf(i);
        console.log(`Token #${i}: ${owner}`);
      } catch (error) {
        console.log(`Token #${i}: Does not exist`);
      }
    }
    
    // Check total supply
    console.log('\n🔍 Checking total supply...');
    try {
      const totalSupply = await contract.totalSupply();
      console.log('✅ Total supply:', totalSupply.toString());
    } catch (error) {
      console.log('❌ Error getting total supply:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkTransferStatus();
