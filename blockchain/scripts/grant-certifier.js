const { ethers } = require('ethers');
const HydroCredTokenABI = require('../artifacts/contracts/HydroCredToken.sol/HydroCredToken.json').abi;

async function grantCertifierRole() {
  try {
    console.log('🔐 Granting certifier role...');
    
    // Use the working RPC endpoint
    const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/demo');
    const contractAddress = '0xa1B7a0745D37f48f7E5328E31dF4Be64b693C62d';
    
    // The address that needs certifier role
    const targetAddress = '0x34a0eF8AC40f455C76cE7332844a55442F6e71c9';
    
    console.log('📋 Contract address:', contractAddress);
    console.log('🎯 Target address:', targetAddress);
    
    // Create contract instance (read-only for checking)
    const contract = new ethers.Contract(contractAddress, HydroCredTokenABI, provider);
    
    // Check if the address already has certifier role
    try {
      const certifierRole = await contract.CERTIFIER_ROLE();
      console.log('🔑 CERTIFIER_ROLE:', certifierRole);
      
      const hasRole = await contract.hasRole(certifierRole, targetAddress);
      console.log('✅ Has certifier role:', hasRole);
      
      if (hasRole) {
        console.log('🎉 Address already has certifier role!');
        return;
      }
    } catch (error) {
      console.log('❌ Error checking role:', error.message);
    }
    
    // Check who has DEFAULT_ADMIN_ROLE
    try {
      const defaultAdminRole = await contract.DEFAULT_ADMIN_ROLE();
      console.log('👑 DEFAULT_ADMIN_ROLE:', defaultAdminRole);
      
      // Get the deployer address from contract-address.json
      const contractInfo = require('../contract-address.json');
      const deployerAddress = contractInfo.deployer;
      console.log('🏗️  Deployer address:', deployerAddress);
      
      const deployerHasAdminRole = await contract.hasRole(defaultAdminRole, deployerAddress);
      console.log('👑 Deployer has admin role:', deployerHasAdminRole);
      
    } catch (error) {
      console.log('❌ Error checking admin role:', error.message);
    }
    
    console.log('\n💡 To grant certifier role, you need to:');
    console.log('1. Connect with the deployer wallet (0x34a0eF8AC40f455C76cE7332844a55442F6e71c9)');
    console.log('2. Call the setCertifier() function with your address');
    console.log('3. Or use the grantRole() function with CERTIFIER_ROLE and your address');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

grantCertifierRole();
