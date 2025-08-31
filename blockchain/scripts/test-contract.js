const { ethers } = require('ethers');
const HydroCredTokenABI = require('../artifacts/contracts/HydroCredToken.sol/HydroCredToken.json').abi;

async function testContract() {
  try {
    // Connect to Sepolia network using free RPC
    const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
    
    const contractAddress = '0xa1B7a0745D37f48f7E5328E31dF4Be64b693C62d';
    const contract = new ethers.Contract(contractAddress, HydroCredTokenABI, provider);
    
    console.log('Testing contract at:', contractAddress);
    
    // Test basic contract functions
    try {
      const name = await contract.name();
      console.log('Contract name:', name);
    } catch (error) {
      console.log('Error getting name:', error.message);
    }
    
    try {
      const symbol = await contract.symbol();
      console.log('Contract symbol:', symbol);
    } catch (error) {
      console.log('Error getting symbol:', error.message);
    }
    
    try {
      const certifierRole = await contract.CERTIFIER_ROLE();
      console.log('CERTIFIER_ROLE:', certifierRole);
    } catch (error) {
      console.log('Error getting CERTIFIER_ROLE:', error.message);
    }
    
    try {
      const totalSupply = await contract.totalSupply();
      console.log('Total supply:', totalSupply.toString());
    } catch (error) {
      console.log('Error getting total supply:', error.message);
    }
    
    // Test with a known address (deployer address)
    const testAddress = '0x34a0eF8AC40f455C76cE7332844a55442F6e71c9';
    try {
      const balance = await contract.balanceOf(testAddress);
      console.log('Balance of deployer:', balance.toString());
      
      if (balance > 0) {
        const tokens = await contract.tokensOfOwner(testAddress);
        console.log('Tokens of deployer:', tokens.map(t => t.toString()));
      }
    } catch (error) {
      console.log('Error getting balance/tokens:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testContract();
