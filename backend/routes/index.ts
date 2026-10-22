import { Router, Request, Response } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import customerRoutes from './customerRoutes';
import orderRoutes from './orderRoutes';
import kdsRoutes from './kdsRoutes';
import inventoryRoutes from './inventoryRoutes';
import recipeRoutes from './recipeRoutes';
import reviewRoutes from './reviewRoutes';
import promotionRoutes from './promotionRoutes';
import reportRoutes from './reportRoutes';
import { isDbConnected, DB_NAME } from '../config/db';

const apiRouter = Router();

// Sub-routers
apiRouter.use('/auth', authRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/kds', kdsRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/recipes', recipeRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/promotions', promotionRoutes);
apiRouter.use('/reports', reportRoutes);

// GET /api/health (Section 5)
apiRouter.get('/health', async (_req: Request, res: Response): Promise<void> => {
  const connected = isDbConnected();

  if (connected) {
    res.json({
      success: true,
      data: {
        api: 'running',
        database: 'connected',
        databaseName: DB_NAME,
      },
    });
  } else {
    res.status(503).json({
      success: false,
      message: 'Không thể kết nối MongoDB',
    });
  }
});

export default apiRouter;
