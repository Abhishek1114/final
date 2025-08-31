# HydroCred Deployment Guide 🚀

## Quick Setup (5 minutes)

### 1. Prerequisites
- Node.js 18+ installed
- MetaMask browser extension
- Ethereum testnet access (Sepolia recommended)

### 2. Environment Setup

Create `.env` file in the root directory:

```bash
# Get these from Infura.io or Alchemy
RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_wallet_private_key_here

# Optional: For contract verification
EXPLORER_API_KEY=your_etherscan_api_key

# Backend settings
PORT=5055
AES_KEY=your_32_character_encryption_key_here
```

### 3. Install & Deploy

```bash
# Install all dependencies
npm install

# Compile smart contracts
npm run chain:compile

# Run tests (optional but recommended)
npm run chain:test

# Deploy to testnet
npm run chain:deploy

# Update contract addresses in frontend/backend
npm run update-contract-address
```

### 4. Start the Application

```bash
# Start both frontend and backend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5055

## Demo Workflow

### Step 1: Connect MetaMask
1. Open http://localhost:5173
2. Click "Connect Wallet"
3. Approve MetaMask connection
4. Switch to Sepolia testnet if needed

### Step 2: Issue Credits (Certifier Role)
1. Go to "Certifier" page
2. The deployer wallet is automatically set as certifier
3. Enter a producer address (can be any Ethereum address)
4. Enter amount (1-1000 credits)
5. Click "Issue Credits"
6. Approve transaction in MetaMask

### Step 3: Transfer Credits (Producer Role)
1. Go to "Producer" page with the producer wallet
2. View your issued credits
3. Select a credit to transfer
4. Enter buyer address
5. Click "Transfer Credit"
6. Approve transaction

### Step 4: Retire Credits (Buyer Role)
1. Go to "Buyer" page with the buyer wallet
2. View your received credits
3. Click "Retire" on any credit
4. Confirm retirement (permanent action)
5. Download retirement proof

### Step 5: Audit Trail (Regulator View)
1. Go to "Regulator" page
2. View all blockchain events
3. Filter by event type or address
4. Click external links to view on block explorer

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │    Backend      │    │   Blockchain    │
│   (React App)   │◄──►│  (Express API)  │◄──►│ (Smart Contract)│
│  localhost:5173 │    │ localhost:5055  │    │  Sepolia Net    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Key Features Implemented

✅ **Smart Contract (ERC-721)**
- Batch credit issuance
- Role-based access control
- Credit retirement system
- Transfer restrictions for retired credits
- Complete event logging

✅ **Backend API**
- Blockchain event monitoring
- File upload system (ready for IPFS)
- RESTful API endpoints
- Data encryption utilities

✅ **Frontend DApp**
- Role-based dashboards
- MetaMask integration
- Real-time transaction status
- Responsive dark theme
- Transaction history

✅ **Developer Experience**
- TypeScript throughout
- Comprehensive tests
- Automated deployment scripts
- Hot reload development

## Production Deployment

### Mainnet Deployment
1. Update `RPC_URL` to mainnet provider
2. Ensure sufficient ETH for deployment
3. Run `npm run chain:deploy`
4. Update frontend environment variables

### IPFS Integration (Future)
The backend is prepared for IPFS document storage:
- Replace file upload storage with IPFS
- Update `ipfsHash` fields in API responses
- Add IPFS gateway configuration

### Security Considerations
- Store private keys securely (use hardware wallets)
- Enable contract verification on Etherscan
- Implement proper access controls
- Regular security audits recommended

## Troubleshooting

**"Contract not deployed"**
- Ensure `.env` has correct `RPC_URL` and `PRIVATE_KEY`
- Run `npm run chain:deploy`
- Check contract address is updated with `npm run update-contract-address`

**MetaMask connection issues**
- Refresh page and try again
- Ensure correct network (Sepolia)
- Check MetaMask is unlocked

**Transaction failures**
- Ensure sufficient testnet ETH
- Check gas price settings
- Verify wallet permissions

**Backend API errors**
- Ensure backend is running on port 5055
- Check contract address is configured
- Verify RPC URL is accessible

## Support

For issues or questions:
1. Check the main README.md
2. Review smart contract tests
3. Verify environment configuration
4. Check browser console for errors

Built with ❤️ for a sustainable hydrogen future! 🌱