import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  id?: string;
  name: string;
  code?: string;
  categoryId?: string;
  slug?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

const CategorySchema = new Schema<ICategory>(
  {
    _id: { type: Schema.Types.Mixed },
    name: { type: String, required: true },
    code: { type: String },
    categoryId: { type: String },
    slug: { type: String },
    description: { type: String, default: '' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    collection: 'categories',
    timestamps: true,
    strict: false,
    _id: false,
  }
);

CategorySchema.virtual('id').get(function () {
  return (this._id || (this as any).id)?.toString();
});

CategorySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = (ret._id || ret.id || ret.code || ret.categoryId)?.toString();
    ret.code = ret.code || ret.id;
    ret.categoryId = ret.categoryId || ret.id;
    return ret;
  },
});
CategorySchema.set('toObject', { virtuals: true });

export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema, 'categories');
