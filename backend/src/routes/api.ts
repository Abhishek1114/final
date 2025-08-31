import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { getCreditEvents, getOwnedTokens, isTokenRetired } from '../lib/chain';
import { encrypt, hash } from '../lib/crypto';
import { db, ProducerSchema, CreditRequestSchema, IncomingRequestSchema } from '../lib/database';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'HydroCred Backend API'
  });
});

// File upload endpoint
router.post('/upload', upload.single('document'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileMetadata = {
      id: hash(req.file.filename),
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      // Placeholder for future IPFS integration
      ipfsHash: null,
      encryptedPath: encrypt(req.file.path)
    };

    res.json({
      success: true,
      file: fileMetadata
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Get ledger data (blockchain events)
router.get('/ledger', async (req: Request, res: Response) => {
  try {
    const fromBlockSchema = z.object({
      fromBlock: z.string().optional().transform(val => val ? parseInt(val) : 0)
    });
    
    const { fromBlock } = fromBlockSchema.parse(req.query);
    
    const events = await getCreditEvents(fromBlock);
    
    res.json({
      success: true,
      events,
      count: events.length,
      fromBlock
    });
  } catch (error) {
    console.error('Ledger fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ledger data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific token information
router.get('/token/:tokenId', async (req: Request, res: Response) => {
  try {
    const tokenIdSchema = z.object({
      tokenId: z.string().transform(val => parseInt(val))
    });
    
    const { tokenId } = tokenIdSchema.parse(req.params);
    
    // This would fetch token metadata from IPFS in the future
    res.json({
      success: true,
      tokenId,
      metadata: {
        // Placeholder metadata
        name: `HydroCred Token #${tokenId}`,
        description: 'Green Hydrogen Production Credit',
        attributes: [
          { trait_type: 'Type', value: 'Green Hydrogen Credit' },
          { trait_type: 'Unit', value: '1 verified unit' }
        ]
      }
    });
  } catch (error) {
    console.error('Token fetch error:', error);
    res.status(400).json({ error: 'Invalid token ID' });
  }
});

// Producer management endpoints
router.post('/producers', async (req: Request, res: Response) => {
  try {
    const producerData = ProducerSchema.parse(req.body);
    const producer = await db.addProducer(producerData);
    res.json({ success: true, producer });
  } catch (error) {
    console.error('Producer creation error:', error);
    res.status(400).json({ error: 'Invalid producer data' });
  }
});

router.get('/producers', async (req: Request, res: Response) => {
  try {
    const { verified } = req.query;
    const producers = verified === 'true' 
      ? await db.getVerifiedProducers()
      : await db.getAllProducers();
    res.json({ success: true, producers });
  } catch (error) {
    console.error('Producer fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch producers' });
  }
});

router.post('/producers/:address/verify', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { verifiedBy } = req.body;
    const producer = await db.verifyProducer(address, verifiedBy);
    res.json({ success: true, producer });
  } catch (error) {
    console.error('Producer verification error:', error);
    res.status(400).json({ error: 'Failed to verify producer' });
  }
});

// Credit request endpoints
router.post('/credit-requests', async (req: Request, res: Response) => {
  try {
    const requestData = CreditRequestSchema.parse(req.body);
    const request = await db.createCreditRequest(requestData);
    res.json({ success: true, request });
  } catch (error) {
    console.error('Credit request creation error:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
});

router.get('/credit-requests', async (req: Request, res: Response) => {
  try {
    const { producerAddress } = req.query;
    const requests = await db.getCreditRequests(producerAddress as string);
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Credit request fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch credit requests' });
  }
});

router.post('/credit-requests/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;
    const request = await db.approveCreditRequest(id, approvedBy);
    res.json({ success: true, request });
  } catch (error) {
    console.error('Credit request approval error:', error);
    res.status(400).json({ error: 'Failed to approve request' });
  }
});

router.post('/credit-requests/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectedBy, reason } = req.body;
    const request = await db.rejectCreditRequest(id, rejectedBy, reason);
    res.json({ success: true, request });
  } catch (error) {
    console.error('Credit request rejection error:', error);
    res.status(400).json({ error: 'Failed to reject request' });
  }
});

// Incoming request endpoints
router.post('/incoming-requests', async (req: Request, res: Response) => {
  try {
    const requestData = IncomingRequestSchema.parse(req.body);
    const request = await db.createIncomingRequest(requestData);
    res.json({ success: true, request });
  } catch (error) {
    console.error('Incoming request creation error:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
});

router.get('/incoming-requests/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const requests = await db.getIncomingRequests(address);
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Incoming request fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch incoming requests' });
  }
});

router.post('/incoming-requests/:id/accept', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const request = await db.acceptIncomingRequest(id);
    res.json({ success: true, request });
  } catch (error) {
    console.error('Incoming request acceptance error:', error);
    res.status(400).json({ error: 'Failed to accept request' });
  }
});

router.post('/incoming-requests/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const request = await db.rejectIncomingRequest(id, reason);
    res.json({ success: true, request });
  } catch (error) {
    console.error('Incoming request rejection error:', error);
    res.status(400).json({ error: 'Failed to reject request' });
  }
});

// Stats endpoint
router.get('/stats/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    // Get database stats
    const dbStats = await db.getStats(address);
    
    // Get blockchain stats
    let totalCredits = 0;
    let activeCredits = 0;
    
    try {
      const tokenIds = await getOwnedTokens(address);
      totalCredits = tokenIds.length;
      
      const creditsWithStatus = await Promise.all(
        tokenIds.map(async (tokenId) => ({
          tokenId,
          isRetired: await isTokenRetired(tokenId),
        }))
      );
      
      activeCredits = creditsWithStatus.filter(c => !c.isRetired).length;
    } catch (error) {
      console.warn('Failed to fetch blockchain stats:', error);
    }
    
    const stats = {
      ...dbStats,
      totalCredits,
      activeCredits,
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;