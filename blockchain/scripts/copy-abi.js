const fs = require('fs');
const path = require('path');

// Copy ABI to frontend and backend
const artifactPath = path.join(__dirname, '../artifacts/contracts/HydroCredToken.sol/HydroCredToken.json');
const frontendAbiPath = path.join(__dirname, '../../frontend/src/abi');
const backendAbiPath = path.join(__dirname, '../../backend/src/abi');

if (fs.existsSync(artifactPath)) {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const abi = JSON.stringify(artifact.abi, null, 2);
  
  // Ensure directories exist
  fs.mkdirSync(frontendAbiPath, { recursive: true });
  fs.mkdirSync(backendAbiPath, { recursive: true });
  
  // Write ABI files
  fs.writeFileSync(path.join(frontendAbiPath, 'HydroCredToken.json'), abi);
  fs.writeFileSync(path.join(backendAbiPath, 'HydroCredToken.json'), abi);
  
  console.log('✅ ABI copied to frontend and backend');
} else {
  console.log('❌ Contract artifact not found. Run compile first.');
}