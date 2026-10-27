import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Inventory } from '../models/Inventory';
import { Ingredient } from '../models/Ingredient';
import { isDbConnected } from '../config/db';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Helper aggregation pipeline: inventory -> (ingredientId) -> ingredients
function buildInventoryPipeline(matchQuery: any = {}) {
  const pipeline: any[] = [];

  if (Object.keys(matchQuery).length > 0) {
    pipeline.push({ $match: matchQuery });
  }

  pipeline.push(
    {
      $lookup: {
        from: 'ingredients',
        let: { ingId: '$ingredientId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$_id', '$$ingId'] },
                  { $eq: ['$id', '$$ingId'] },
                ],
              },
            },
          },
        ],
        as: 'ingDoc',
      },
    },
    {
      $unwind: { path: '$ingDoc', preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        id: { $ifNull: ['$_id', '$id'] },
        _id: { $ifNull: ['$_id', '$id'] },
        ingredientId: '$ingredientId',
        name: { $ifNull: ['$ingDoc.name', '$name', 'Nguyên liệu'] },
        quantity: { $ifNull: ['$quantity', 0] },
        minStock: { $ifNull: ['$minStock', 5] },
        unit: { $ifNull: ['$ingDoc.unit', '$unit', 'kg'] },
        category: '$ingDoc.category',
        costPerUnit: '$ingDoc.costPerUnit',
        status: {
          $cond: {
            if: { $lte: ['$quantity', '$minStock'] },
            then: 'low_stock',
            else: 'normal',
          },
        },
      },
    }
  );

  return pipeline;
}

// GET /api/inventory
// Reads from inventory collection and joins ingredients via ingredientId
router.get('/', authenticate, authorize('MANAGER', 'STAFF', 'BARISTA'), async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const items = await Inventory.aggregate(buildInventoryPipeline());

    // If inventory collection has items, return them
    if (items.length > 0) {
      res.json({
        success: true,
        data: items,
      });
      return;
    }

    // Fallback: if inventory collection is not yet populated but ingredients has items
    const rawIngredients = await Ingredient.find();
    const fallback = rawIngredients.map((ing: any) => ({
      id: ing._id?.toString(),
      _id: ing._id?.toString(),
      ingredientId: ing._id?.toString(),
      name: ing.name,
      quantity: Number(ing.currentStock ?? ing.quantity ?? 20),
      minStock: Number(ing.minThreshold ?? ing.minStock ?? 5),
      unit: ing.unit || 'kg',
      status:
        Number(ing.currentStock ?? ing.quantity ?? 20) <= Number(ing.minThreshold ?? ing.minStock ?? 5)
          ? 'low_stock'
          : 'normal',
    }));

    res.json({
      success: true,
      data: fallback,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/inventory/low-stock
// Low stock condition: quantity <= minStock
router.get('/low-stock', authenticate, authorize('MANAGER', 'STAFF', 'BARISTA'), async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    // Query where quantity <= minStock
    const lowStockItems = await Inventory.aggregate(
      buildInventoryPipeline({
        $expr: { $lte: ['$quantity', '$minStock'] },
      })
    );

    res.json({
      success: true,
      data: lowStockItems,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/inventory/:id
// Updates quantity and/or minStock
router.put('/:id', authenticate, authorize('MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity, minStock, ...rest } = req.body;

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const updateFields: any = { ...rest };
    if (quantity !== undefined) updateFields.quantity = Number(quantity);
    if (minStock !== undefined) updateFields.minStock = Number(minStock);

    let updated = await Inventory.findOneAndUpdate(
      { $or: [{ _id: id }, { id }, { ingredientId: id }] },
      updateFields,
      { new: true }
    );

    if (!updated) {
      // Try updating in ingredients if id refers to ingredient
      await Ingredient.findOneAndUpdate(
        { $or: [{ _id: id }, { id }] },
        updateFields
      );
    }

    // Return the joined document
    const [result] = await Inventory.aggregate(
      buildInventoryPipeline({
        $or: [{ _id: id }, { id }, { ingredientId: id }],
      })
    );

    res.json({
      success: true,
      data: result || { id, ...updateFields },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/inventory/:id/restock
// Increments inventory quantity
router.put('/:id/restock', authenticate, authorize('MANAGER', 'STAFF'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const addAmt = Number(amount || 0);

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    await Inventory.findOneAndUpdate(
      { $or: [{ _id: id }, { id }, { ingredientId: id }] },
      { $inc: { quantity: addAmt } },
      { new: true }
    );

    const [result] = await Inventory.aggregate(
      buildInventoryPipeline({
        $or: [{ _id: id }, { id }, { ingredientId: id }],
      })
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
