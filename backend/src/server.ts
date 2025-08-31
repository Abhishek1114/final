import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { config, validateConfig } from './config/env';
import apiRoutes from './routes/api';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ], // Allow multiple frontend origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'HydroCred Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      upload: 'POST /api/upload',
      ledger: '/api/ledger',
      token: '/api/token/:tokenId'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 HydroCred Backend running on port ${PORT}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  
  const configValid = validateConfig();
  if (configValid) {
    console.log('✅ Configuration validated');
  } else {
    console.log('⚠️  Configuration incomplete - some features may not work');
  }
  
  console.log(`🌐 API available at http://localhost:${PORT}`);
});