export const SIZE_SURCHARGES: Record<string, number> = { small: 0, medium: 5000, large: 10000 };
export const BOOSTER_PRICES: Record<string, { name: string; price: number }> = {
  b_chia: { name: 'Hạt chia hữu cơ', price: 5000 },
  b_thachdua: { name: 'Thạch dừa giòn', price: 5000 },
  b_tranchau: { name: 'Trân châu trắng giòn', price: 5000 },
  b_suachua: { name: 'Thêm sữa chua lên men', price: 7000 },
};

export function calculateItemPrice(basePrice: number, size: unknown, boosters: unknown) {
  const normalizedSize = String(size || 'medium').toLowerCase();
  if (!(normalizedSize in SIZE_SURCHARGES)) throw new Error('Kích cỡ món uống không hợp lệ');
  if (!Array.isArray(boosters)) throw new Error('Danh sách topping không hợp lệ');
  if (boosters.length > 4) throw new Error('Mỗi món chỉ được chọn tối đa 4 topping');
  const seen = new Set<string>();
  const verifiedBoosters = boosters.map((entry: any) => {
    const id = String(entry?.id || entry || '');
    if (!BOOSTER_PRICES[id] || seen.has(id)) throw new Error('Topping không hợp lệ hoặc bị trùng');
    seen.add(id);
    return { id, ...BOOSTER_PRICES[id] };
  });
  const unitPrice = Math.round(Number(basePrice)) + SIZE_SURCHARGES[normalizedSize] + verifiedBoosters.reduce((sum, item) => sum + item.price, 0);
  return { size: normalizedSize, boosters: verifiedBoosters, unitPrice };
}

export function calculatePromotionDiscount(promotion: any, subtotal: number): number {
  if (!promotion || promotion.isActive === false || promotion.status === 'inactive') return 0;
  if (subtotal < Number(promotion.minOrderAmount || 0)) return 0;
  const value = Number(promotion.discount ?? promotion.discountValue ?? 0);
  const type = promotion.type || promotion.discountType || 'fixed';
  const raw = type === 'percentage' ? Math.round(subtotal * value / 100) : Math.round(value);
  return Math.max(0, Math.min(subtotal, promotion.maxDiscount ? Math.min(raw, Number(promotion.maxDiscount)) : raw));
}
