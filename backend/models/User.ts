import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  id?: string;
  username?: string;
  email?: string;
  name?: string;
  password?: string;
  role: string;
  phone?: string;
  avatar?: string;
  points?: number;
  loyaltyPoints?: number;
  tier?: string;
  isActive?: boolean;
  tokenVersion?: number;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: Schema.Types.Mixed },
    username: { type: String, index: true, sparse: true, trim: true },
    email: { type: String, index: true, sparse: true, lowercase: true, trim: true },
    name: { type: String, default: 'Thành viên FreshLeaf' },
    password: { type: String },
    role: { type: String, default: 'CUSTOMER' },
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    points: { type: Number, default: 0 },
    loyaltyPoints: { type: Number, default: 0 },
    tier: { type: String, default: 'Thành viên Mới' },
    isActive: { type: Boolean, default: true, index: true },
    tokenVersion: { type: Number, default: 0 },
  },
  {
    collection: 'users',
    timestamps: true,
    strict: false,
    _id: false,
  }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  // If already hashed with bcrypt (starts with $2a$ or $2b$), don't re-hash
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return true;
  // If plain text stored in existing legacy database:
  if (this.password === candidatePassword) return true;
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch {
    return false;
  }
};

UserSchema.virtual('id').get(function () {
  return this._id?.toString();
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = (ret._id || ret.id)?.toString();
    delete ret.password;
    return ret;
  },
});
UserSchema.set('toObject', { virtuals: true });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema, 'users');
