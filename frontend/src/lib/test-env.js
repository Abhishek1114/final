// Test environment variables
console.log('🔍 Testing environment variables...');
console.log('VITE_CONTRACT_ADDRESS:', import.meta.env.VITE_CONTRACT_ADDRESS);
console.log('VITE_RPC_URL:', import.meta.env.VITE_RPC_URL);

// Test if contract address is configured
if (import.meta.env.VITE_CONTRACT_ADDRESS) {
  console.log('✅ Contract address is configured');
} else {
  console.log('❌ Contract address is NOT configured');
}

if (import.meta.env.VITE_RPC_URL) {
  console.log('✅ RPC URL is configured');
} else {
  console.log('❌ RPC URL is NOT configured');
}
