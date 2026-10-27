import mongoose, { Schema, Document } from 'mongoose';
import { getPromotionTerms } from '../utils/orderPricing';

export interface IPromotion extends Document {
  id?: string;
  code: string;
  title?: string;
  description?: string;
  discount?: number;
  discountValue?: number;
  type?: string;
  discountType?: string;
  minOrderAmount?: number;
  maxDiscount?: number;
  startAt?: Date;
  endAt?: Date;
  usageLimit?: number;
  perCustomerLimit?: number;
  usedCount?: number;
  scope?: 'all' | 'category' | 'products';
  categoryIds?: string[];
  productIds?: string[];
  usageByCustomer?: Map<string, number>;
  archivedAt?: Date;
  status?: string;
  isActive?: boolean;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    _id: { type: Schema.Types.Mixed },
    code: { type: String, required: true, uppercase: true },
    title: { type: String },
    description: { type: String, default: '' },
    discount: { type: Number },
    discountValue: { type: Number },
    type: { type: String, default: 'fixed' },
    discountType: { type: String, default: 'fixed' },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    startAt: { type: Date },
    endAt: { type: Date },
    usageLimit: { type: Number, default: 0 },
    perCustomerLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    scope: { type: String, enum: ['all', 'category', 'products'], default: 'all' },
    categoryIds: { type: [String], default: [] },
    productIds: { type: [String], default: [] },
    usageByCustomer: { type: Map, of: Number, default: {} },
    archivedAt: { type: Date },
    status: { type: String, default: 'active' },
    isActive: { type: Boolean, default: true },
  },
  {
    collection: 'promotions',
    timestamps: true,
    strict: false,
    _id: false,
  }
);

PromotionSchema.index({ code: 1 }, { unique: true });
PromotionSchema.index({ isActive: 1, startAt: 1, endAt: 1 });

PromotionSchema.virtual('id').get(function () {
  return (this._id || (this as any).id || this.code)?.toString();
});

PromotionSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = (ret._id || ret.id || ret.code)?.toString();
    const { value: discountVal, type: discType } = getPromotionTerms(ret);
    const statusVal = ret.status || (ret.isActive !== false ? 'active' : 'inactive');

    ret.discount = discountVal;
    ret.discountValue = discountVal;
    ret.type = discType;
    ret.discountType = discType;
    ret.status = statusVal;
    ret.isActive = statusVal === 'active';
    ret.title = ret.title || `Khuyến mãi ${ret.code} (${discType === 'percentage' ? `${discountVal}%` : `${discountVal} ₫`})`;
    return ret;
  },
});
PromotionSchema.set('toObject', { virtuals: true });

export const Promotion = mongoose.models.Promotion || mongoose.model<IPromotion>('Promotion', PromotionSchema, 'promotions');
