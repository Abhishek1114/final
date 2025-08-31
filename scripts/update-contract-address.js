const fs = require('fs');
const path = require('path');

// Read contract address from blockchain deployment
const contractAddressFile = path.join(__dirname, '../blockchain/contract-address.json');

if (!fs.existsSync(contractAddressFile)) {
  console.log('❌ Contract address file not found. Deploy the contract first.');
  process.exit(1);
}

const contractInfo = JSON.parse(fs.readFileSync(contractAddressFile, 'utf8'));
const contractAddress = contractInfo.address;

console.log(`📝 Updating contract address: ${contractAddress}`);

// Update frontend .env.local
const frontendEnvPath = path.join(__dirname, '../frontend/.env.local');
const frontendEnvContent = `VITE_CONTRACT_ADDRESS=${contractAddress}\n`;
fs.writeFileSync(frontendEnvPath, frontendEnvContent);
console.log('✅ Updated frontend/.env.local');

// Update backend .env.local
const backendEnvPath = path.join(__dirname, '../backend/.env.local');
const backendEnvContent = `CONTRACT_ADDRESS=${contractAddress}\n`;
fs.writeFileSync(backendEnvPath, backendEnvContent);
console.log('✅ Updated backend/.env.local');

console.log('🎉 Contract address updated in all environments');