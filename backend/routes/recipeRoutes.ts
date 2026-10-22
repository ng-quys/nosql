import { Router, Request, Response } from 'express';
import { Recipe } from '../models/Recipe';
import { isDbConnected } from '../config/db';

const router = Router();

function formatRecipe(doc: any) {
  const r = doc.toObject ? doc.toObject({ virtuals: true }) : doc;
  const id = (r._id || r.id)?.toString();
  return {
    id,
    _id: id,
    productId: r.productId,
    ingredientId: r.ingredientId,
    quantity: Number(r.quantity || 1),
    unit: r.unit || 'g',
    name: r.name,
    instructions: r.instructions,
  };
}

// GET /api/recipes/product/:productId
// Returns recipes for a specific product
router.get('/product/:productId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const recipes = await Recipe.find({
      $or: [{ productId }, { productId: new RegExp(`^${productId}$`, 'i') }],
    });

    res.json({
      success: true,
      data: recipes.map(formatRecipe),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/recipes
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, ingredientId, quantity, unit, name, instructions } = req.body;

    if (!productId || !ingredientId || quantity === undefined) {
      res.status(400).json({
        success: false,
        message: 'productId, ingredientId và quantity là bắt buộc',
      });
      return;
    }

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const nextId = `REC${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecipe = new Recipe({
      _id: nextId,
      productId,
      ingredientId,
      quantity: Number(quantity),
      unit: unit || 'g',
      name,
      instructions,
    });

    await newRecipe.save();

    res.status(201).json({
      success: true,
      data: formatRecipe(newRecipe),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/recipes/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const updated = await Recipe.findOneAndUpdate(
      { $or: [{ _id: id }, { id }] },
      updates,
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Không tìm thấy công thức pha chế' });
      return;
    }

    res.json({
      success: true,
      data: formatRecipe(updated),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/recipes/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const deleted = await Recipe.findOneAndDelete({ $or: [{ _id: id }, { id }] });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Không tìm thấy công thức pha chế để xóa' });
      return;
    }

    res.json({
      success: true,
      data: { message: `Đã xóa công thức ${id} thành công` },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
