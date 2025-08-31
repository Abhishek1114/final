import { ethers } from 'ethers';
import { config } from '../config/env';
import HydroCredTokenABI from '../abi/HydroCredToken.json';

let provider: ethers.JsonRpcProvider | null = null;
let contract: ethers.Contract | null = null;

export async function getProvider() {
  if (!provider && config.rpcUrl) {
    console.log('🔗 Connecting to RPC:', config.rpcUrl);
    try {
      provider = new ethers.JsonRpcProvider(config.rpcUrl);
      // Test the connection
      await provider.getBlockNumber();
      console.log('✅ Backend RPC connection successful');
    } catch (error: any) {
      console.error('❌ Backend RPC connection failed:', error.message);
      throw new Error(`Failed to connect to blockchain: ${error.message}`);
    }
  }
  return provider;
}

export async function getContract() {
  if (!contract && config.contractAddress) {
    const providerInstance = await getProvider();
    if (providerInstance) {
      console.log('📋 Creating contract instance for:', config.contractAddress);
      contract = new ethers.Contract(
        config.contractAddress,
        HydroCredTokenABI,
        providerInstance
      );
    }
  }
  return contract;
}

export interface CreditEvent {
  type: 'issued' | 'transferred' | 'retired';
  tokenId?: number;
  from?: string;
  to?: string;
  amount?: number;
  fromId?: number;
  toId?: number;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

export async function getCreditEvents(fromBlock: number = 0): Promise<CreditEvent[]> {
  const contractInstance = await getContract();
  if (!contractInstance) {
    throw new Error('Contract not initialized');
  }

  const events: CreditEvent[] = [];

  try {
    console.log('🔍 Fetching credit events from block:', fromBlock);
    
    // Get CreditsIssued events
    console.log('📋 Fetching CreditsIssued events...');
    const issuedFilter = contractInstance.filters.CreditsIssued();
    const issuedEvents = await contractInstance.queryFilter(issuedFilter, fromBlock);
    console.log('✅ Found', issuedEvents.length, 'CreditsIssued events');
    
    for (const event of issuedEvents) {
      if ('args' in event && event.args) {
        const block = await event.getBlock();
        events.push({
          type: 'issued',
          to: event.args[0] as string,
          amount: Number(event.args[1]),
          fromId: Number(event.args[2]),
          toId: Number(event.args[3]),
          timestamp: block.timestamp,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
        });
      }
    }

    // Get Transfer events (excluding mints)
    console.log('📋 Fetching Transfer events...');
    const transferFilter = contractInstance.filters.Transfer();
    const transferEvents = await contractInstance.queryFilter(transferFilter, fromBlock);
    console.log('✅ Found', transferEvents.length, 'Transfer events');
    
    for (const event of transferEvents) {
      if ('args' in event && event.args && event.args[0] !== ethers.ZeroAddress) { // Exclude mints
        const block = await event.getBlock();
        events.push({
          type: 'transferred',
          tokenId: Number(event.args[2]),
          from: event.args[0] as string,
          to: event.args[1] as string,
          timestamp: block.timestamp,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
        });
      }
    }

    // Get CreditRetired events
    console.log('📋 Fetching CreditRetired events...');
    const retiredFilter = contractInstance.filters.CreditRetired();
    const retiredEvents = await contractInstance.queryFilter(retiredFilter, fromBlock);
    console.log('✅ Found', retiredEvents.length, 'CreditRetired events');
    
    for (const event of retiredEvents) {
      if ('args' in event && event.args) {
        const block = await event.getBlock();
        events.push({
          type: 'retired',
          tokenId: Number(event.args[1]),
          from: event.args[0] as string,
          timestamp: block.timestamp,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
        });
      }
    }

    // Sort by block number and timestamp
    events.sort((a, b) => {
      if (a.blockNumber !== b.blockNumber) {
        return a.blockNumber - b.blockNumber;
      }
      return a.timestamp - b.timestamp;
    });

    console.log('🎉 Total events found:', events.length);
    return events;
  } catch (error) {
    console.error('❌ Error fetching credit events:', error);
    throw error;
  }
}

export async function getTokenOwner(tokenId: number): Promise<string> {
  const contractInstance = await getContract();
  if (!contractInstance) {
    throw new Error('Contract not initialized');
  }
  
  try {
    return await contractInstance.ownerOf(tokenId);
  } catch (error) {
    throw new Error(`Token ${tokenId} does not exist`);
  }
}

export async function isTokenRetired(tokenId: number): Promise<boolean> {
  const contractInstance = await getContract();
  if (!contractInstance) {
    throw new Error('Contract not initialized');
  }
  
  return await contractInstance.isRetired(tokenId);
}