const { ethers } = require('ethers');
const HydroCredTokenABI = require('../artifacts/contracts/HydroCredToken.sol/HydroCredToken.json').abi;

async function debugTransfer() {
  try {
    console.log('🔍 Debugging transfer issue...');
    
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
    
    // Check token #9 owner
    console.log('\n🔍 Checking token #9 owner...');
    try {
      const token9Owner = await contract.ownerOf(9);
      console.log('✅ Token #9 owner:', token9Owner);
      console.log('🔍 Expected owner:', newAddress);
      console.log('✅ Match:', token9Owner.toLowerCase() === newAddress.toLowerCase());
    } catch (error) {
      console.log('❌ Error getting token #9 owner:', error.message);
    }
    
    // Check recent Transfer events
    console.log('\n🔍 Checking recent Transfer events...');
    try {
      const transferFilter = contract.filters.Transfer();
      const transferEvents = await contract.queryFilter(transferFilter, -10000); // Last 10000 blocks
      
      console.log('📋 Found', transferEvents.length, 'transfer events');
      
      for (const event of transferEvents.slice(-5)) { // Show last 5 events
        if ('args' in event && event.args) {
          const block = await event.getBlock();
          console.log(`📋 Transfer: ${event.args[0]} → ${event.args[1]} (Token #${Number(event.args[2])}) at block ${event.blockNumber}`);
          console.log(`   Transaction: ${event.transactionHash}`);
          console.log(`   Timestamp: ${new Date(block.timestamp * 1000).toLocaleString()}`);
        }
      }
    } catch (error) {
      console.log('❌ Error getting transfer events:', error.message);
    }
    
    // Check if contract is paused
    console.log('\n🔍 Checking contract status...');
    try {
      const paused = await contract.paused();
      console.log('⏸️  Contract paused:', paused);
    } catch (error) {
      console.log('❌ Error checking paused status:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugTransfer();
