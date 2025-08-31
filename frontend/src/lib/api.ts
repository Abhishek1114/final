import axios from 'axios';

const API_BASE_URL = 'http://localhost:5055/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Reduced timeout for better UX
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export interface LedgerResponse {
  success: boolean;
  events: CreditEvent[];
  count: number;
  fromBlock: number;
}

export interface UploadResponse {
  success: boolean;
  file: {
    id: string;
    originalName: string;
    filename: string;
    size: number;
    mimetype: string;
    uploadedAt: string;
    ipfsHash: string | null;
    encryptedPath: string;
  };
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('document', file);
  
  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
}

export async function getLedgerData(fromBlock?: number): Promise<LedgerResponse> {
  const params = fromBlock ? { fromBlock: fromBlock.toString() } : {};
  const response = await api.get<LedgerResponse>('/ledger', { params });
  return response.data;
}

export async function getTokenMetadata(tokenId: number) {
  const response = await api.get(`/token/${tokenId}`);
  return response.data;
}

export async function checkHealth() {
  const response = await api.get('/health');
  return response.data;
}

// Error handling with better error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - please try again');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      throw new Error('Cannot connect to backend server. Please ensure the backend is running on port 5055');
    } else if (error.response?.status === 404) {
      throw new Error('API endpoint not found');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error - please try again later');
    } else if (error.response?.status === 0) {
      throw new Error('Network error - please check your connection');
    }
    
    throw error;
  }
);