import mongoose, { Schema, Document } from 'mongoose';

export interface IInventory extends Document {
  id?: string;
  ingredientId: string;
  quantity: number;
  minStock: number;
  unit: string;
  location?: string;
  status?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

const InventorySchema = new Schema<IInventory>(
  {
    _id: { type: Schema.Types.Mixed },
    ingredientId: { type: String, required: true, index: true },
    quantity: { type: Number, required: true, default: 0, index: true },
    minStock: { type: Number, default: 5 },
    unit: { type: String, default: 'kg' },
    location: { type: String, default: 'Kho FreshLeaf' },
  },
  {
    collection: 'inventory',
    timestamps: true,
    strict: false,
    _id: false,
  }
);

InventorySchema.index({ ingredientId: 1, quantity: 1 });

InventorySchema.virtual('id').get(function () {
  return (this._id || (this as any).id)?.toString();
});

InventorySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = (ret._id || ret.id)?.toString();
    ret.quantity = Number(ret.quantity ?? 0);
    ret.minStock = Number(ret.minStock ?? 5);
    return ret;
  },
});
InventorySchema.set('toObject', { virtuals: true });

export const Inventory = mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema, 'inventory');
