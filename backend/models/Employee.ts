import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'staff' | 'barista' | 'manager' | 'admin';
  shift?: string;
  salary?: number;
  startDate?: Date;
  status?: string;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    role: { type: String, required: true },
    shift: { type: String, default: 'Ca sáng (07:00 - 15:00)' },
    salary: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    status: { type: String, default: 'active' },
  },
  {
    collection: 'employees',
    timestamps: true,
    strict: false,
    _id: false,
  }
);

EmployeeSchema.virtual('id').get(function () {
  return (this._id || (this as any).id)?.toString();
});
EmployeeSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = (ret._id || ret.id)?.toString();
    return ret;
  },
});
EmployeeSchema.set('toObject', { virtuals: true });

export const Employee = mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema, 'employees');
