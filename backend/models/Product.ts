import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  id?: string;
  name: string;
  categoryId?: string;
  category?: string;
  price?: number;
  basePrice?: number;
  status?: string; // 'available' | 'out_of_stock'
  isAvailable?: boolean;
  tagline?: string;
  description?: string;
  themeColor?: string;
  bgGradient?: string;
  ingredients?: string[];
  calories?: number;
  prepTimeMin?: number;
  isFeatured?: boolean;
  isPopular?: boolean;
  nutrition?: any;
  benefits?: string[];
  imageUrl?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

const ProductSchema = new Schema<IProduct>(
  {
    _id: { type: Schema.Types.Mixed },
    name: { type: String, required: true, index: true },
    categoryId: { type: String, index: true },
    category: { type: String },
    price: { type: Number, required: true },
    basePrice: { type: Number },
    status: { type: String, default: 'available', index: true },
    isAvailable: { type: Boolean, default: true },
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    themeColor: { type: String, default: '#2D6A4F' },
    bgGradient: { type: String, default: 'from-[#E2F1E9] via-[#C5E3D3] to-[#9BCBB4]' },
    ingredients: { type: [String], default: [] },
    calories: { type: Number, default: 150 },
    prepTimeMin: { type: Number, default: 3 },
    isFeatured: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    nutrition: { type: Schema.Types.Mixed },
    benefits: { type: [String], default: [] },
    imageUrl: { type: String, default: '' },
  },
  {
    collection: 'products',
    timestamps: true,
    strict: false,
    _id: false, // allow custom string _id like 'P001'
  }
);

// Indexes supporting search, category, status
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ categoryId: 1, status: 1 });

ProductSchema.virtual('id').get(function () {
  return (this._id || (this as any).id)?.toString();
});

ProductSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = (ret._id || ret.id)?.toString();
    // Ensure both existing MongoDB fields and frontend compatibility fields are provided
    const numericPrice = Number(ret.price ?? ret.basePrice ?? 45000);
    ret.price = numericPrice;
    ret.basePrice = numericPrice;
    ret.categoryId = ret.categoryId || ret.category || 'CAT01';
    ret.category = ret.category || ret.categoryId;
    ret.status = ret.status || (ret.isAvailable !== false ? 'available' : 'out_of_stock');
    ret.isAvailable = ret.status === 'available';
    return ret;
  },
});
ProductSchema.set('toObject', { virtuals: true });

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema, 'products');
