import path from 'path';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const uri = process.env.MONGODB_URI;
const password = process.env.TEST_USER_PASSWORD;
if (!uri || !password || password.length < 12) throw new Error('Thiếu MONGODB_URI hoặc TEST_USER_PASSWORD hợp lệ');

const accounts = [
  { username: 'demo_customer', name: 'Demo Khách hàng', role: 'CUSTOMER', email: 'demo.customer@freshleaf.test' },
  { username: 'demo_staff', name: 'Demo Thu ngân', role: 'STAFF', email: 'demo.staff@freshleaf.test' },
  { username: 'demo_barista', name: 'Demo Pha chế', role: 'BARISTA', email: 'demo.barista@freshleaf.test' },
  { username: 'demo_manager', name: 'Demo Quản lý', role: 'MANAGER', email: 'demo.manager@freshleaf.test' },
];

await mongoose.connect(uri, { dbName: 'freshleaf', serverSelectionTimeoutMS: 10000 });
const result: Array<{ username: string; role: string; result: string; verified: boolean }> = [];
for (const account of accounts) {
  const existing = await User.findOne({ username: account.username });
  if (existing) {
    const verified = existing.isActive !== false
      && String(existing.role).toUpperCase() === account.role
      && await existing.comparePassword(password);
    result.push({ username: account.username, role: account.role, result: 'already-exists', verified });
    continue;
  }
  await new User({
    _id: `USR_${randomUUID()}`,
    ...account,
    password,
    phone: '',
    isActive: true,
    tokenVersion: 0,
  }).save();
  const created = await User.findOne({ username: account.username });
  const verified = Boolean(created && created.isActive !== false && await created.comparePassword(password));
  result.push({ username: account.username, role: account.role, result: 'created', verified });
}
console.log(JSON.stringify(result));
await mongoose.disconnect();
