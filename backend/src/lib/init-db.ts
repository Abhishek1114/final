import { db } from './database';

export async function initializeDatabase() {
  console.log('🔧 Initializing database with sample data...');

  // Add sample producers
  const producers = [
    {
      address: '0x34a0...71c9',
      name: 'Green Hydrogen Solutions',
      state: 'Gujarat',
      city: 'Ahmedabad',
    },
    {
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      name: 'EcoFuel Industries',
      state: 'Maharashtra',
      city: 'Mumbai',
    },
    {
      address: '0x8ba1f109551bD432803012645Hac136c772c3c',
      name: 'Clean Energy Corp',
      state: 'Karnataka',
      city: 'Bangalore',
    },
  ];

  for (const producer of producers) {
    await db.addProducer(producer);
  }

  // Verify some producers
  await db.verifyProducer('0x34a0...71c9', 'State Admin');
  await db.verifyProducer('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', 'State Admin');

  // Add sample credit requests
  const creditRequests = [
    {
      producerAddress: '0x34a0...71c9',
      amount: 1,
      state: 'Gujarat',
    },
    {
      producerAddress: '0x34a0...71c9',
      amount: 1,
      state: 'Gujarat',
    },
  ];

  for (const request of creditRequests) {
    const createdRequest = await db.createCreditRequest(request);
    // Approve the requests
    await db.approveCreditRequest(createdRequest.id, 'State Admin');
  }

  // Add sample incoming requests
  const incomingRequests = [
    {
      fromAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      toAddress: '0x34a0...71c9',
      amount: 1,
    },
    {
      fromAddress: '0x8ba1f109551bD432803012645Hac136c772c3c',
      toAddress: '0x34a0...71c9',
      amount: 1,
    },
  ];

  for (const request of incomingRequests) {
    await db.createIncomingRequest(request);
  }

  console.log('✅ Database initialized with sample data');
}