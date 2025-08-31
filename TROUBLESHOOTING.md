# HydroCred Troubleshooting Guide

## 🔧 Common Issues and Solutions

### 1. Blockchain Connection Issues

#### Problem: "Failed to connect to blockchain" or "All RPC endpoints failed"

**Solutions:**
1. **Run the connection test:**
   ```bash
   npm run test:connection
   ```

2. **Check your internet connection**

3. **Try different RPC endpoints manually:**
   - https://eth-sepolia.g.alchemy.com/v2/demo
   - https://rpc.sepolia.org
   - https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161
   - https://ethereum-sepolia.publicnode.com
   - https://sepolia.drpc.org

4. **Update environment variables:**
   Create `.env` files in the root, frontend, and backend directories:
   ```bash
   # Root .env
   RPC_URL=https://rpc.sepolia.org
   CONTRACT_ADDRESS=0xaA7b945a4Cd4381DcF5D4Bc6e0E5cc76e6A3Fc39
   
   # Frontend .env.local
   VITE_RPC_URL=https://rpc.sepolia.org
   VITE_CONTRACT_ADDRESS=0xaA7b945a4Cd4381DcF5D4Bc6e0E5cc76e6A3Fc39
   ```

### 2. Backend API Connection Issues

#### Problem: "Cannot connect to backend server"

**Solutions:**
1. **Ensure backend is running:**
   ```bash
   npm -w backend run dev
   ```

2. **Check if port 5055 is available:**
   ```bash
   # Windows
   netstat -ano | findstr :5055
   
   # Linux/Mac
   lsof -i :5055
   ```

3. **Check backend logs for errors**

4. **Verify CORS configuration** (should allow localhost:5173)

### 3. MetaMask Connection Issues

#### Problem: "MetaMask not found" or wallet connection fails

**Solutions:**
1. **Install MetaMask extension**
2. **Connect to Sepolia testnet**
3. **Ensure MetaMask is unlocked**
4. **Check if MetaMask is connected to the correct network**

### 4. Contract Interaction Issues

#### Problem: "Contract address not configured" or contract calls fail

**Solutions:**
1. **Verify contract address:**
   - Current: `0xaA7b945a4Cd4381DcF5D4Bc6e0E5cc76e6A3Fc39`
   - Check: https://sepolia.etherscan.io/address/0xaA7b945a4Cd4381DcF5D4Bc6e0E5cc76e6A3Fc39

2. **Ensure contract is deployed and verified**

3. **Check if you have the correct ABI file**

### 5. Transaction Issues

#### Problem: Transactions fail or timeout

**Solutions:**
1. **Check gas fees and network congestion**
2. **Ensure sufficient ETH for gas**
3. **Try increasing gas limit**
4. **Check transaction on Etherscan**

## 🚀 Quick Fix Commands

### Reset and Restart Everything
```bash
# Stop all processes
# Clear node_modules and reinstall
rm -rf node_modules */node_modules
npm install

# Restart development servers
npm run dev
```

### Test Individual Components
```bash
# Test blockchain connection
npm run test:connection

# Test backend only
npm -w backend run dev

# Test frontend only
npm -w frontend run dev
```

### Check Logs
```bash
# Backend logs
npm -w backend run dev

# Frontend logs (in browser console)
# Open DevTools (F12) and check Console tab
```

## 🔍 Debug Mode

Enable debug logging by setting environment variables:
```bash
# Add to .env files
DEBUG=true
NODE_ENV=development
```

## 📞 Getting Help

If issues persist:
1. Run `npm run test:connection` and share the output
2. Check browser console for errors
3. Check backend terminal for errors
4. Verify all environment variables are set correctly
5. Ensure all dependencies are installed

## 🔄 Environment Setup Checklist

- [ ] Node.js 18+ installed
- [ ] All dependencies installed (`npm install`)
- [ ] `.env` files created with correct values
- [ ] MetaMask installed and connected to Sepolia
- [ ] Backend running on port 5055
- [ ] Frontend running on port 5173
- [ ] Contract deployed and verified
- [ ] RPC endpoint accessible
