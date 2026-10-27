import { Router, Request, Response } from 'express';
import { Review } from '../models/Review';
import { isDbConnected } from '../config/db';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

function formatReview(doc: any) {
  const r = doc.toObject ? doc.toObject({ virtuals: true }) : doc;
  const id = (r._id || r.id)?.toString();
  return {
    id,
    _id: id,
    productId: r.productId,
    customerId: r.customerId || r.userId,
    orderId: r.orderId,
    rating: Number(r.rating || 5),
    comment: r.comment,
    customerName: r.customerName || 'Khách hàng',
    createdAt: r.createdAt,
  };
}

// Handlers for reviews
export async function handleGetProductReviews(req: Request, res: Response): Promise<void> {
  try {
    const { productId } = req.params;

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const reviews = await Review.find({
      $or: [{ productId }, { productId: new RegExp(`^${productId}$`, 'i') }],
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews.map(formatReview),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function handlePostProductReview(req: Request, res: Response): Promise<void> {
  try {
    const { productId } = req.params;
    const { customerId, userId, orderId, rating, comment, customerName } = req.body;

    if (!rating || !comment) {
      res.status(400).json({
        success: false,
        message: 'Số sao đánh giá và nội dung bình luận là bắt buộc',
      });
      return;
    }

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const nextId = `REV${Math.floor(1000 + Math.random() * 9000)}`;
    const review = new Review({
      _id: nextId,
      productId,
      customerId: customerId || userId,
      userId: userId || customerId,
      orderId,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: comment.trim(),
      customerName: customerName || 'Khách hàng',
    });

    await review.save();

    res.status(201).json({
      success: true,
      data: formatReview(review),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/products/:productId/reviews
router.get('/:productId/reviews', handleGetProductReviews);
router.get('/products/:productId/reviews', handleGetProductReviews);

// POST /api/products/:productId/reviews
router.post('/:productId/reviews', authenticate, handlePostProductReview);
router.post('/products/:productId/reviews', authenticate, handlePostProductReview);

// GET /api/reviews
router.get('/', authenticate, authorize('MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.query;
    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }
    const filter = productId ? { productId } : {};
    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: reviews.map(formatReview),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/reviews/:id
router.put('/:id', authenticate, authorize('MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const updated = await Review.findOneAndUpdate(
      { $or: [{ _id: id }, { id }] },
      updates,
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
      return;
    }

    res.json({
      success: true,
      data: formatReview(updated),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/reviews/:id
router.delete('/:id', authenticate, authorize('MANAGER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      res.status(503).json({ success: false, message: 'Không thể kết nối MongoDB' });
      return;
    }

    const deleted = await Review.findOneAndDelete({ $or: [{ _id: id }, { id }] });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá để xóa' });
      return;
    }

    res.json({
      success: true,
      data: { message: `Đã xóa đánh giá ${id} thành công` },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
