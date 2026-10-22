/**
 * Bộ định dạng tiền tệ và thời gian chuẩn Việt Nam cho FreshLeaf Juice
 */

/**
 * Chuẩn hóa giá trị số thành giá tiền Việt Nam Đồng hợp lệ
 * Đảm bảo các giá trị số trong database luôn là số nguyên thực tế (ví dụ: 35000, 40000, 45000, 50000, 75000)
 * Ngăn chặn tuyệt đối các giá trị cũ dạng USD (7, 8, 9, 7.95) hoặc viết tắt hàng nghìn (45, 50)
 */
export const sanitizePrice = (val: number | string | undefined | null, fallback = 45000): number => {
  if (val === undefined || val === null || val === '') return fallback;
  let num = typeof val === 'string' ? parseFloat(val.replace(/[^\d.-]/g, '')) : Number(val);
  if (isNaN(num) || num <= 0) return fallback;

  if (num < 1000) {
    // Khách hoặc nhân viên nhập viết tắt hàng nghìn (ví dụ 35 -> 35.000 ₫, 50 -> 50.000 ₫)
    if (num >= 30) {
      num = num * 1000;
    } else {
      // Giá trị cũ từ bản demo US ($7.95, $8, $9...) -> quy đổi sang giá đồ uống Việt Nam thực tế
      if (num <= 5) num = 35000;
      else if (num <= 7) num = 35000;
      else if (num <= 8) num = 40000;
      else if (num <= 9) num = 45000;
      else if (num <= 12) num = 50000;
      else num = Math.round(num * 5000);
    }
  }

  return Math.round(num);
};

/**
 * Định dạng số tiền sang chuẩn Việt Nam Đồng (VND):
 * 45000 -> 45.000 ₫
 * 50000 -> 50.000 ₫
 * 55000 -> 55.000 ₫
 * 75000 -> 75.000 ₫
 * 1250000 -> 1.250.000 ₫
 *
 * Tuyệt đối không bao giờ hiển thị: $7.95, 7 đ, 8 đ, 9 đ, USD
 */
export const formatVND = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || amount === '') {
    return '0 ₫';
  }

  let num = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : Number(amount);
  if (isNaN(num)) {
    return '0 ₫';
  }

  // Chuẩn hóa nếu là số nhỏ bất thường (do cache cũ 7, 8, 9 hoặc viết tắt)
  if (num > 0 && num < 1000) {
    num = sanitizePrice(num);
  }

  const rounded = Math.round(num);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted} ₫`;
};

/**
 * Alias cho formatVND để tương thích đồng bộ toàn dự án
 */
export const formatCurrency = formatVND;

/**
 * Định dạng số lượng (ví dụ số ly, số lượng nguyên liệu, lượt xem)
 */
export const formatNumber = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null || num === '') return '0';
  const val = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(val)) return '0';
  return Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Định dạng thời gian theo giờ Việt Nam (ví dụ 14:30)
 */
export const formatTime = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
};

/**
 * Định dạng ngày theo chuẩn Việt Nam (ví dụ 01/10/2026)
 */
export const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
};
