import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  id?: string;
  orderId?: string;
  customerId?: string;
  userId?: string;
  productId: string;
  rating: number;
  comment: string;
  customerName?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

const ReviewSchema = new Schema<IReview>(
  {
    _id: { type: Schema.Types.Mixed },
    orderId: { type: String },
    customerId: { type: String, index: true },
    userId: { type: String },
    productId: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    customerName: { type: String, default: 'Khách hàng' },
  },
  {
    collection: 'reviews',
    timestamps: true,
    strict: false,
    _id: false,
  }
);

ReviewSchema.index({ productId: 1, customerId: 1 });

ReviewSchema.virtual('id').get(function () {
  return (this._id || (this as any).id)?.toString();
});

ReviewSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = (ret._id || ret.id)?.toString();
    ret.customerId = ret.customerId || ret.userId;
    return ret;
  },
});
ReviewSchema.set('toObject', { virtuals: true });

export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema, 'reviews');
