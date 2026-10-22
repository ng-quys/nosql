import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB, DB_NAME } from './config/db';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config();

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || (process.env.PORT && process.env.PORT !== '8080' && process.env.PORT !== '3000' ? process.env.PORT : '5000'), 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount all REST API routes under /api
app.use('/api', apiRouter);

// Centralized error handler
app.use(errorHandler);

// Root route
app.get('/', (_req, res) => {
  res.json({
    message: 'FreshLeaf Juice REST API Server',
    database: DB_NAME,
    endpoints: [
      '/api/products',
      '/api/categories',
      '/api/customers',
      '/api/orders',
      '/api/kds/orders',
      '/api/inventory',
      '/api/recipes',
      '/api/reviews',
      '/api/promotions',
      '/api/reports/revenue',
      '/api/reports/top-products',
      '/api/auth/me',
      '/api/health',
    ],
  });
});

async function startServer() {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FreshLeaf Backend] Running on http://localhost:${PORT}`);
    console.log(`[FreshLeaf Backend] Connected database target: ${DB_NAME}`);
  });
}

startServer();

export default app;
