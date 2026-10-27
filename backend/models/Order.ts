import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: string;
  categoryId?: string;
  qty: number;
  unitPrice: number;
  amount: number;
  name?: string;
  quantity?: number;
  sugar?: string;
  ice?: string;
  size?: string;
  boosters?: any[];
  note?: string;
  notes?: string;
  drink?: any;
}

export interface IOrder extends Document {
  id?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  orderNumber?: string;
  tableNumber?: number | string;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  totalAmount?: number;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  payment?: string | any;
  paymentMethod?: string;
  paymentStatus?: string;
  orderType?: string;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  promotionCode?: string;
  promotionSnapshot?: any;
  promotionCustomerKey?: string;
  promotionUsageCounted?: boolean;
  promotionUsageRefunded?: boolean;
  checkoutRequestId?: string;
}

const OrderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    categoryId: { type: String },
    qty: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    amount: { type: Number, required: true },
    name: { type: String },
    quantity: { type: Number },
    sugar: { type: String, default: '100%' },
    ice: { type: String, default: 'regular' },
    size: { type: String, default: 'medium' },
    boosters: { type: [Schema.Types.Mixed], default: [] },
    note: { type: String, default: '' },
    notes: { type: String, default: '' },
    promotionCode: { type: String },
    promotionSnapshot: { type: Schema.Types.Mixed },
    promotionCustomerKey: { type: String },
    promotionUsageCounted: { type: Boolean, default: false },
    promotionUsageRefunded: { type: Boolean, default: false },
    checkoutRequestId: { type: String },
    drink: { type: Schema.Types.Mixed },
  },
  { _id: false, strict: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    _id: { type: Schema.Types.Mixed },
    customerId: { type: String, index: true },
    customerName: { type: String },
    customerPhone: { type: String },
    orderNumber: { type: String },
    tableNumber: { type: Schema.Types.Mixed, default: 1 },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    totalAmount: { type: Number },
    status: {
      type: String,
      enum: ['pending', 'preparing', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    payment: { type: Schema.Types.Mixed, default: 'cash' },
    paymentMethod: { type: String, default: 'cash' },
    paymentStatus: { type: String, default: 'paid' },
    orderType: { type: String, default: 'dine_in' },
    notes: { type: String, default: '' },
    createdAt: { type: Schema.Types.Mixed, default: () => new Date().toISOString(), index: true },
  },
  {
    collection: 'orders',
    timestamps: true,
    strict: false,
    _id: false, // allow custom string _id like 'ORD000001'
  }
);

OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ checkoutRequestId: 1 }, { unique: true, sparse: true });

OrderSchema.virtual('id').get(function () {
  return (this._id || (this as any).id)?.toString();
});

OrderSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = (ret._id || ret.id)?.toString();
    ret.orderNumber = ret.orderNumber || ret.id;
    const numericTotal = Number(ret.total ?? ret.totalAmount ?? 0);
    ret.total = numericTotal;
    ret.totalAmount = numericTotal;
    ret.subtotal = Number(ret.subtotal ?? numericTotal);
    ret.discount = Number(ret.discount ?? 0);
    ret.items = (ret.items || []).map((it: any) => ({
      ...it,
      qty: Number(it.qty ?? it.quantity ?? 1),
      quantity: Number(it.quantity ?? it.qty ?? 1),
      unitPrice: Number(it.unitPrice ?? 0),
      amount: Number(it.amount ?? (it.unitPrice || 0) * (it.qty || it.quantity || 1)),
    }));
    return ret;
  },
});
OrderSchema.set('toObject', { virtuals: true });

export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema, 'orders');
