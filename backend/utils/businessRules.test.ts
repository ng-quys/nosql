import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateItemPrice, calculatePromotionDiscount } from './orderPricing';
import { parseProductCsv, productsToCsv } from './productCsv';

test('tính giá size và topping từ bảng giá server, không tin giá client', () => {
  const result = calculateItemPrice(40000, 'large', [{ id: 'b_chia', price: 1 }, { id: 'b_suachua', price: 1 }]);
  assert.equal(result.unitPrice, 62000);
  assert.deepEqual(result.boosters.map((item) => item.price), [5000, 7000]);
});

test('từ chối topping lạ hoặc trùng', () => {
  assert.throws(() => calculateItemPrice(40000, 'medium', [{ id: 'fake' }]), /Topping/);
  assert.throws(() => calculateItemPrice(40000, 'medium', [{ id: 'b_chia' }, { id: 'b_chia' }]), /Topping/);
});

test('khuyến mãi phần trăm tuân thủ đơn tối thiểu và trần giảm', () => {
  const promotion = { type: 'percentage', discount: 20, minOrderAmount: 80000, maxDiscount: 15000, isActive: true };
  assert.equal(calculatePromotionDiscount(promotion, 70000), 0);
  assert.equal(calculatePromotionDiscount(promotion, 100000), 15000);
});

test('chuẩn hóa khuyến mãi demo cũ fixed 15 thành giảm 15 phần trăm', () => {
  const promotion = { type: 'fixed', discount: 15, minOrderAmount: 0, isActive: true };
  assert.equal(calculatePromotionDiscount(promotion, 41000), 6150);
});

test('giữ nguyên khuyến mãi giảm số tiền cố định hợp lệ', () => {
  const promotion = { type: 'fixed', discount: 20000, minOrderAmount: 0, isActive: true };
  assert.equal(calculatePromotionDiscount(promotion, 41000), 20000);
});

test('CSV kiểm tra cột bắt buộc và đọc được dấu phẩy trong chuỗi', () => {
  const rows = parseProductCsv('name,categoryId,price,description\n"Xoài, dừa",smoothie,45000,"Tươi, mát"');
  assert.equal(rows[0].data.name, 'Xoài, dừa');
  assert.equal(rows[0].errors.length, 0);
  assert.throws(() => parseProductCsv('name,price\nXoài,45000'), /categoryId/);
});

test('CSV export escape dữ liệu và giữ BOM cho Excel Windows', () => {
  const csv = productsToCsv([{ name: 'Xoài, dừa', categoryId: 'smoothie', price: 45000 }]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /"Xoài, dừa"/);
});
