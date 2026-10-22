import mongoose, { Schema, Document } from 'mongoose';

export interface IRecipe extends Document {
  id?: string;
  productId: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  name?: string;
  instructions?: string;
}

const RecipeSchema = new Schema<IRecipe>(
  {
    _id: { type: Schema.Types.Mixed },
    productId: { type: String, required: true, index: true },
    ingredientId: { type: String, required: true, index: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, default: 'g' },
    name: { type: String },
    instructions: { type: String },
  },
  {
    collection: 'recipes',
    timestamps: true,
    strict: false,
    _id: false,
  }
);

RecipeSchema.index({ productId: 1, ingredientId: 1 });

RecipeSchema.virtual('id').get(function () {
  return (this._id || (this as any).id)?.toString();
});

RecipeSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = (ret._id || ret.id)?.toString();
    return ret;
  },
});
RecipeSchema.set('toObject', { virtuals: true });

export const Recipe = mongoose.models.Recipe || mongoose.model<IRecipe>('Recipe', RecipeSchema, 'recipes');
