import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  id?: string;
  name: string;
  phone: string;
  points?: number;
  loyaltyPoints?: number;
  email?: string;
  tier?: string;
  address?: string;
  totalOrders?: number;
  totalSpent?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    _id: { type: Schema.Types.Mixed },
    name: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    points: { type: Number, default: 0 },
    loyaltyPoints: { type: Number, default: 0 },
    email: { type: String },
    tier: { type: String, default: 'Thành viên Mới' },
    address: { type: String, default: '' },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
  },
  {
    collection: 'customers',
    timestamps: true,
    strict: false,
    _id: false, // allow custom string _id like 'C00001'
  }
);

CustomerSchema.virtual('id').get(function () {
  return (this._id || (this as any).id)?.toString();
});

CustomerSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = (ret._id || ret.id)?.toString();
    ret.points = Number(ret.points ?? ret.loyaltyPoints ?? 0);
    ret.loyaltyPoints = ret.points;
    return ret;
  },
});
CustomerSchema.set('toObject', { virtuals: true });

export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema, 'customers');
