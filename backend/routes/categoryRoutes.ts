import { Router, Request, Response } from 'express';
import { Category } from '../models/Category';
import { isDbConnected } from '../config/db';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

function formatCategory(doc: any) {
  const c = doc.toObject ? doc.toObject({ virtuals: true }) : doc;
  const id = (c._id || c.id || c.categoryId || c.code)?.toString();
  return {
    id,
    _id: id,
    categoryId: id,
    code: c.code || id,
    name: c.name,
    description: c.description || '',
    displayOrder: c.displayOrder || 0,
    isActive: c.isActive !== false,
  };
}

// GET /api/categories
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const categories = await Category.find().sort({ displayOrder: 1 });
    res.json({
      success: true,
      data: categories.map(formatCategory),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi truy vấn danh mục' });
  }
});

// POST /api/categories
router.post('/', authenticate, authorize('MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, categoryId, description, displayOrder } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' });
      return;
    }

    const id = categoryId || code || `CAT${Math.floor(10 + Math.random() * 90)}`;
    const cat = new Category({
      _id: id,
      name,
      code: id,
      categoryId: id,
      description: description || '',
      displayOrder: Number(displayOrder) || 0,
      isActive: true,
    });

    await cat.save();
    res.status(201).json({
      success: true,
      data: formatCategory(cat),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/categories/:id
router.put('/:id', authenticate, authorize('MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await Category.findOneAndUpdate(
      { $or: [{ _id: id }, { id }, { code: id }, { categoryId: id }] },
      updates,
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
      return;
    }

    res.json({
      success: true,
      data: formatCategory(updated),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', authenticate, authorize('MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Category.findOneAndDelete({
      $or: [{ _id: id }, { id }, { code: id }, { categoryId: id }],
    });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Không tìm thấy danh mục để xóa' });
      return;
    }

    res.json({
      success: true,
      data: { message: `Đã xóa danh mục ${id} thành công` },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
