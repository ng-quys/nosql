import mongoose, { Schema, Document } from 'mongoose';

export interface IIngredient extends Document {
  id?: string;
  name: string;
  unit: string;
  category?: string;
  costPerUnit?: number;
  supplier?: string;
}

const IngredientSchema = new Schema<IIngredient>(
  {
    _id: { type: Schema.Types.Mixed },
    name: { type: String, required: true },
    unit: { type: String, default: 'kg' },
    category: { type: String, default: 'fruit' },
    costPerUnit: { type: Number, default: 0 },
    supplier: { type: String, default: '' },
  },
  {
    collection: 'ingredients',
    timestamps: true,
    strict: false,
    _id: false,
  }
);

IngredientSchema.virtual('id').get(function () {
  return (this._id || (this as any).id)?.toString();
});

IngredientSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = (ret._id || ret.id)?.toString();
    return ret;
  },
});
IngredientSchema.set('toObject', { virtuals: true });

export const Ingredient = mongoose.models.Ingredient || mongoose.model<IIngredient>('Ingredient', IngredientSchema, 'ingredients');
