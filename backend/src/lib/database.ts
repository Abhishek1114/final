import { z } from 'zod';

// Types
export interface Producer {
  address: string;
  name: string;
  state: string;
  city: string;
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface CreditRequest {
  id: string;
  producerAddress: string;
  amount: number;
  state: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  reason?: string;
}

export interface IncomingRequest {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  reason?: string;
}

// In-memory storage (in production, this would be a real database)
class Database {
  private producers: Map<string, Producer> = new Map();
  private creditRequests: Map<string, CreditRequest> = new Map();
  private incomingRequests: Map<string, IncomingRequest> = new Map();

  // Producer management
  async addProducer(producer: Omit<Producer, 'isVerified' | 'verifiedAt' | 'verifiedBy'>): Promise<Producer> {
    const newProducer: Producer = {
      ...producer,
      isVerified: false,
    };
    this.producers.set(producer.address.toLowerCase(), newProducer);
    return newProducer;
  }

  async getProducer(address: string): Promise<Producer | null> {
    return this.producers.get(address.toLowerCase()) || null;
  }

  async getAllProducers(): Promise<Producer[]> {
    return Array.from(this.producers.values());
  }

  async getVerifiedProducers(): Promise<Producer[]> {
    return Array.from(this.producers.values()).filter(p => p.isVerified);
  }

  async verifyProducer(address: string, verifiedBy: string): Promise<Producer> {
    const producer = this.producers.get(address.toLowerCase());
    if (!producer) {
      throw new Error('Producer not found');
    }
    
    producer.isVerified = true;
    producer.verifiedAt = new Date();
    producer.verifiedBy = verifiedBy;
    
    this.producers.set(address.toLowerCase(), producer);
    return producer;
  }

  // Credit request management
  async createCreditRequest(request: Omit<CreditRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<CreditRequest> {
    const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRequest: CreditRequest = {
      ...request,
      id,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.creditRequests.set(id, newRequest);
    return newRequest;
  }

  async getCreditRequests(producerAddress?: string): Promise<CreditRequest[]> {
    const requests = Array.from(this.creditRequests.values());
    if (producerAddress) {
      return requests.filter(r => r.producerAddress.toLowerCase() === producerAddress.toLowerCase());
    }
    return requests;
  }

  async approveCreditRequest(requestId: string, approvedBy: string): Promise<CreditRequest> {
    const request = this.creditRequests.get(requestId);
    if (!request) {
      throw new Error('Credit request not found');
    }
    
    request.status = 'approved';
    request.approvedAt = new Date();
    request.approvedBy = approvedBy;
    request.updatedAt = new Date();
    
    this.creditRequests.set(requestId, request);
    return request;
  }

  async rejectCreditRequest(requestId: string, rejectedBy: string, reason?: string): Promise<CreditRequest> {
    const request = this.creditRequests.get(requestId);
    if (!request) {
      throw new Error('Credit request not found');
    }
    
    request.status = 'rejected';
    request.rejectedAt = new Date();
    request.rejectedBy = rejectedBy;
    request.reason = reason;
    request.updatedAt = new Date();
    
    this.creditRequests.set(requestId, request);
    return request;
  }

  // Incoming request management
  async createIncomingRequest(request: Omit<IncomingRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<IncomingRequest> {
    const id = `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRequest: IncomingRequest = {
      ...request,
      id,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.incomingRequests.set(id, newRequest);
    return newRequest;
  }

  async getIncomingRequests(address: string): Promise<IncomingRequest[]> {
    return Array.from(this.incomingRequests.values())
      .filter(r => r.toAddress.toLowerCase() === address.toLowerCase());
  }

  async acceptIncomingRequest(requestId: string): Promise<IncomingRequest> {
    const request = this.incomingRequests.get(requestId);
    if (!request) {
      throw new Error('Incoming request not found');
    }
    
    request.status = 'accepted';
    request.acceptedAt = new Date();
    request.updatedAt = new Date();
    
    this.incomingRequests.set(requestId, request);
    return request;
  }

  async rejectIncomingRequest(requestId: string, reason?: string): Promise<IncomingRequest> {
    const request = this.incomingRequests.get(requestId);
    if (!request) {
      throw new Error('Incoming request not found');
    }
    
    request.status = 'rejected';
    request.rejectedAt = new Date();
    request.reason = reason;
    request.updatedAt = new Date();
    
    this.incomingRequests.set(requestId, request);
    return request;
  }

  // Statistics
  async getStats(address: string): Promise<{
    totalCredits: number;
    activeCredits: number;
    pendingRequests: number;
    approvedRequests: number;
  }> {
    const requests = await this.getCreditRequests(address);
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const approvedRequests = requests.filter(r => r.status === 'approved').length;
    
    // Note: These would be fetched from blockchain in real implementation
    return {
      totalCredits: 0, // Will be updated by blockchain integration
      activeCredits: 0, // Will be updated by blockchain integration
      pendingRequests,
      approvedRequests,
    };
  }
}

// Export singleton instance
export const db = new Database();

// Validation schemas
export const ProducerSchema = z.object({
  address: z.string().min(42).max(42),
  name: z.string().min(1),
  state: z.string().min(1),
  city: z.string().min(1),
});

export const CreditRequestSchema = z.object({
  producerAddress: z.string().min(42).max(42),
  amount: z.number().min(1).max(1000),
  state: z.string().min(1),
});

export const IncomingRequestSchema = z.object({
  fromAddress: z.string().min(42).max(42),
  toAddress: z.string().min(42).max(42),
  amount: z.number().min(1),
});