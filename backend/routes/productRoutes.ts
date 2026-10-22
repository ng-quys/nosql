import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { isDbConnected } from '../config/db';
import { authenticate, authorize } from '../middleware/auth';
import { handleGetProductReviews, handlePostProductReview } from './reviewRoutes';

const router = Router();

function formatProduct(doc: any) {
  const p = doc.toObject ? doc.toObject({ virtuals: true }) : doc;
  const id = (p._id || p.id)?.toString();
  const numericPrice = Math.round(Number(p.price ?? p.basePrice ?? 45000));
  const categoryId = p.categoryId || p.category || 'CAT01';
  const status = p.status || (p.isAvailable !== false ? 'available' : 'out_of_stock');

  return {
    id,
    _id: id,
    name: p.name,
    categoryId,
    category: categoryId,
    price: numericPrice,
    basePrice: numericPrice,
    status,
    isAvailable: status === 'available',
    tagline: p.tagline || '',
    description: p.description || '',
    themeColor: p.themeColor || '#2D6A4F',
    bgGradient: p.bgGradient || 'from-[#E2F1E9] via-[#C5E3D3] to-[#9BCBB4]',
    ingredients: Array.isArray(p.ingredients) ? p.ingredients : [],
    calories: p.calories || 150,
    prepTimeMin: p.prepTimeMin || 3,
    isFeatured: Boolean(p.isFeatured),
    isPopular: Boolean(p.isPopular),
    nutrition: p.nutrition || { protein: '2g', carbs: '25g', sugars: '15g', fiber: '3g' },
    benefits: Array.isArray(p.benefits) ? p.benefits : [],
    imageUrl: p.imageUrl || '',
  };
}

// GET /api/products
// Support: search, category (uses categoryId), status, sorting, pagination
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, categoryId, search, status, sort, page, limit } = req.query;

    if (!isDbConnected()) {
      res.status(503).json({
        success: false,
        message: 'Không thể kết nối MongoDB Atlas để tải danh sách sản phẩm',
      });
      return;
    }

    const query: any = {};

    // IMPORTANT: Category filtering MUST use categoryId
    const targetCat = categoryId || category;
    if (targetCat && targetCat !== 'all') {
      query.$or = [
        { categoryId: targetCat },
        { category: targetCat },
        { categoryId: new RegExp(`^${targetCat}$`, 'i') },
      ];
    }

    // Keyword search (name, description, ingredients, tags)
    if (search && typeof search === 'string' && search.trim() !== '') {
      const trimmed = search.trim();
      const terms = [trimmed];
      const lower = trimmed.toLowerCase();
      if (lower.includes('xoai') || lower.includes('xoài')) terms.push('mango');
      if (lower.includes('bo') || lower.includes('bơ')) terms.push('avocado');
      if (lower.includes('cam')) terms.push('orange');
      if (lower.includes('dau') || lower.includes('dâu')) terms.push('strawberry');
      if (lower.includes('thom') || lower.includes('thơm') || lower.includes('khom') || lower.includes('dứa')) terms.push('pineapple');
      if (lower.includes('chanh day') || lower.includes('chanh dây')) terms.push('passion');
      if (lower.includes('sinh to') || lower.includes('sinh tố')) terms.push('smoothie');
      if (lower.includes('nuoc ep') || lower.includes('nước ép')) terms.push('juice');

      const searchConditions: any[] = [];
      terms.forEach((term) => {
        const regex = new RegExp(term, 'i');
        searchConditions.push(
          { name: regex },
          { description: regex },
          { tagline: regex },
          { ingredients: regex }
        );
      });

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    // Availability status filtering
    if (status && typeof status === 'string') {
      query.status = status;
    }

    // Sorting
    let sortObj: any = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { price: 1, basePrice: 1 };
    else if (sort === 'price_desc') sortObj = { price: -1, basePrice: -1 };
    else if (sort === 'popular') sortObj = { isPopular: -1, price: 1 };
    else if (sort === 'name_asc') sortObj = { name: 1 };

    // Pagination
    const pageNum = page ? Math.max(1, parseInt(page as string, 10)) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit as string, 10))) : 0;
    const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;

    let mongoQuery = Product.find(query).sort(sortObj);
    if (limitNum > 0) {
      mongoQuery = mongoQuery.skip(skip).limit(limitNum);
    }

    const [items, total] = await Promise.all([
      mongoQuery.exec(),
      Product.countDocuments(query),
    ]);

    const formatted = items.map(formatProduct);

    res.json({
      success: true,
      data: formatted,
      pagination: limitNum > 0 ? {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      } : undefined,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi truy vấn sản phẩm' });
  }
});

// GET /api/products/:productId/reviews
router.get('/:productId/reviews', handleGetProductReviews);

// POST /api/products/:productId/reviews
router.post('/:productId/reviews', handlePostProductReview);

// GET /api/products/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    let product = await Product.findOne({
      $or: [{ _id: id }, { id }, { name: id }],
    });

    if (!product && id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    }

    if (!product) {
      res.status(404).json({ success: false, message: `Không tìm thấy sản phẩm ${id}` });
      return;
    }

    res.json({
      success: true,
      data: formatProduct(product),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/products
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, categoryId, category, price, basePrice, status, isAvailable, ...rest } = req.body;

    if (!name || (price === undefined && basePrice === undefined)) {
      res.status(400).json({ success: false, message: 'Tên và giá sản phẩm là bắt buộc' });
      return;
    }

    const numericPrice = Math.round(Number(price ?? basePrice));
    const targetCat = categoryId || category || 'CAT01';
    const targetStatus = status || (isAvailable !== false ? 'available' : 'out_of_stock');

    const nextId = `P${Math.floor(100 + Math.random() * 900)}`;

    const newProd = new Product({
      _id: nextId,
      name,
      categoryId: targetCat,
      category: targetCat,
      price: numericPrice,
      basePrice: numericPrice,
      status: targetStatus,
      isAvailable: targetStatus === 'available',
      ...rest,
    });

    await newProd.save();

    res.status(201).json({
      success: true,
      data: formatProduct(newProd),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.price !== undefined || updates.basePrice !== undefined) {
      const p = Math.round(Number(updates.price ?? updates.basePrice));
      updates.price = p;
      updates.basePrice = p;
    }
    if (updates.categoryId || updates.category) {
      const c = updates.categoryId || updates.category;
      updates.categoryId = c;
      updates.category = c;
    }
    if (updates.status || updates.isAvailable !== undefined) {
      const s = updates.status || (updates.isAvailable ? 'available' : 'out_of_stock');
      updates.status = s;
      updates.isAvailable = s === 'available';
    }

    const updated = await Product.findOneAndUpdate(
      { $or: [{ _id: id }, { id }] },
      updates,
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm để cập nhật' });
      return;
    }

    res.json({
      success: true,
      data: formatProduct(updated),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Product.findOneAndDelete({ $or: [{ _id: id }, { id }] });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm để xóa' });
      return;
    }

    res.json({
      success: true,
      data: { message: `Đã xóa sản phẩm ${id} thành công` },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
