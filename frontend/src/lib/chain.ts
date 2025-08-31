import { ethers } from 'ethers';
import HydroCredTokenABI from '../abi/HydroCredToken.json';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0xaA7b945a4Cd4381DcF5D4Bc6e0E5cc76e6A3Fc39';
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://ethereum-sepolia.publicnode.com';

// Debug logging
console.log('🔍 Chain.ts environment variables:');
console.log('CONTRACT_ADDRESS:', CONTRACT_ADDRESS);
console.log('RPC_URL:', RPC_URL);

let provider: ethers.BrowserProvider | null = null;
let signer: ethers.JsonRpcSigner | null = null;
let contract: ethers.Contract | null = null;
let directProvider: ethers.JsonRpcProvider | null = null;

// Fallback RPC endpoints with better reliability
const FALLBACK_RPC_ENDPOINTS = [
  'https://rpc.sepolia.org',
  'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  'https://ethereum-sepolia.publicnode.com',
  'https://sepolia.drpc.org'
];

export async function getProvider(): Promise<ethers.BrowserProvider> {
  if (!provider) {
    if (!window.ethereum) throw new Error('MetaMask not found. Please install MetaMask.');
    provider = new ethers.BrowserProvider(window.ethereum);
  }
  return provider;
}

// Get direct RPC provider with fallback and connection testing
export async function getDirectProvider(): Promise<ethers.JsonRpcProvider> {
  if (!directProvider) {
    const urls = [RPC_URL, ...FALLBACK_RPC_ENDPOINTS];
    
    for (const url of urls) {
      try {
        console.log(`🔗 Testing RPC connection: ${url}`);
        const testProvider = new ethers.JsonRpcProvider(url);
        
        // Test the connection by getting the latest block
        await testProvider.getBlockNumber();
        
        directProvider = testProvider;
        console.log(`✅ Connected to RPC: ${url}`);
        break;
      } catch (error: any) {
        console.warn(`❌ Failed to connect to RPC URL: ${url}`, error?.message || 'Unknown error');
        continue;
      }
    }
    
    if (!directProvider) {
      throw new Error('All RPC endpoints failed. Please check your internet connection and try again.');
    }
  }
  return directProvider;
}

export async function getSigner(): Promise<ethers.JsonRpcSigner> {
  if (!signer) {
    const providerInstance = await getProvider();
    await providerInstance.send('eth_requestAccounts', []);
    signer = await providerInstance.getSigner();
  }
  return signer;
}

export async function getContract(): Promise<ethers.Contract> {
  if (!contract) {
    if (!CONTRACT_ADDRESS) throw new Error('Contract address not configured.');
    const signerInstance = await getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, HydroCredTokenABI, signerInstance);
  }
  return contract;
}

export async function getDirectReadOnlyContract(): Promise<ethers.Contract> {
  if (!CONTRACT_ADDRESS) throw new Error('Contract address not configured.');
  const provider = await getDirectProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, HydroCredTokenABI, provider);
}

export async function connectWallet(): Promise<string> {
  const signerInstance = await getSigner();
  return signerInstance.getAddress();
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const accounts = await (await getProvider()).listAccounts();
    return accounts.length > 0 ? accounts[0].address : null;
  } catch {
    return null;
  }
}

export async function batchIssueCredits(to: string, amount: number): Promise<ethers.ContractTransactionResponse> {
  return (await getContract()).batchIssue(to, amount);
}

export async function transferCredit(from: string, to: string, tokenId: number): Promise<ethers.ContractTransactionResponse> {
  return (await getContract()).transferFrom(from, to, tokenId);
}

export async function retireCredit(tokenId: number): Promise<ethers.ContractTransactionResponse> {
  return (await getContract()).retire(tokenId);
}

export async function getOwnedTokens(address: string): Promise<number[]> {
  console.log('🔄 Getting owned tokens for address:', address);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const contract = await getDirectReadOnlyContract();
      const tokens = await contract.tokensOfOwner(address);
      const tokenArray = tokens.map((token: bigint) => Number(token));
      console.log(`✅ Success! Found ${tokenArray.length} tokens:`, tokenArray);
      return tokenArray;
    } catch (error: any) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      if (attempt === 3) return [];
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return [];
}

export async function isTokenRetired(tokenId: number): Promise<boolean> {
  try {
    const contract = await getDirectReadOnlyContract();
    return await contract.isRetired(tokenId);
  } catch {
    return false;
  }
}

export async function getTokenOwner(tokenId: number): Promise<string> {
  const contract = await getDirectReadOnlyContract();
  return await contract.ownerOf(tokenId);
}

export async function hasRole(role: string, address: string): Promise<boolean> {
  const contract = await getDirectReadOnlyContract();
  return await contract.hasRole(role, address);
}

export async function isCertifier(address: string): Promise<boolean> {
  const contract = await getDirectReadOnlyContract();
  const certifierRole = await contract.CERTIFIER_ROLE();
  return await contract.hasRole(certifierRole, address);
}

export async function listenForTransfers(callback: (from: string, to: string, tokenId: number) => void) {
  const contractInstance = await getDirectReadOnlyContract();
  contractInstance.on('Transfer', (from: string, to: string, tokenId: bigint) => {
    console.log('🔄 Transfer event detected:', { from, to, tokenId: Number(tokenId) });
    callback(from, to, Number(tokenId));
  });
  console.log('👂 Listening for Transfer events...');
}

export async function waitForTransactionAndRefresh(tx: ethers.ContractTransactionResponse, refreshCallback: () => void) {
  const receipt = await tx.wait();
  if (receipt?.status === 1) setTimeout(refreshCallback, 2000);
}

export function formatTokenId(tokenId: number): string {
  return `#${tokenId.toString().padStart(4, '0')}`;
}

export function getExplorerUrl(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

export class ChainError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ChainError';
  }
}

export function handleChainError(error: any): ChainError {
  if (error.code === 4001) return new ChainError('Transaction rejected by user', 'USER_REJECTED');
  if (error.code === -32603) return new ChainError('Internal JSON-RPC error', 'RPC_ERROR');
  if (error.message?.includes('insufficient funds')) return new ChainError('Insufficient funds for transaction', 'INSUFFICIENT_FUNDS');
  if (error.message?.includes('user rejected')) return new ChainError('Transaction rejected by user', 'USER_REJECTED');
  return new ChainError(error.message || 'Unknown blockchain error', 'UNKNOWN');
}

