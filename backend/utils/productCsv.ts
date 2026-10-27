export const PRODUCT_CSV_HEADERS = ['name', 'categoryId', 'price', 'status', 'description', 'ingredients', 'calories', 'prepTimeMin', 'isFeatured', 'isPopular'];

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') { current += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { cells.push(current.trim()); current = ''; }
    else current += char;
  }
  if (quoted) throw new Error('Dấu nháy kép trong CSV chưa được đóng');
  cells.push(current.trim());
  return cells;
}

export function parseProductCsv(csv: string) {
  const lines = String(csv || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error('CSV phải có dòng tiêu đề và ít nhất một sản phẩm');
  if (lines.length > 501) throw new Error('Mỗi lần chỉ được import tối đa 500 sản phẩm');
  const headers = splitCsvLine(lines[0]);
  const missing = ['name', 'categoryId', 'price'].filter((required) => !headers.includes(required));
  if (missing.length) throw new Error(`Thiếu cột bắt buộc: ${missing.join(', ')}`);
  const seenNames = new Set<string>();
  return lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line);
    const raw = Object.fromEntries(headers.map((header, i) => [header, values[i] ?? '']));
    const errors: string[] = [];
    const price = Math.round(Number(raw.price));
    if (!raw.name) errors.push('Thiếu tên sản phẩm');
    const normalizedName = raw.name.toLowerCase();
    if (normalizedName && seenNames.has(normalizedName)) errors.push('Tên sản phẩm bị trùng trong file');
    seenNames.add(normalizedName);
    if (!raw.categoryId) errors.push('Thiếu categoryId');
    if (!Number.isFinite(price) || price <= 0) errors.push('Giá phải là số dương');
    if (raw.status && !['available', 'out_of_stock'].includes(raw.status)) errors.push('status chỉ nhận available hoặc out_of_stock');
    return {
      row: index + 2,
      errors,
      data: {
        name: raw.name,
        categoryId: raw.categoryId,
        category: raw.categoryId,
        price,
        basePrice: price,
        status: raw.status || 'available',
        isAvailable: raw.status !== 'out_of_stock',
        description: raw.description || '',
        ingredients: raw.ingredients ? raw.ingredients.split('|').map((v: string) => v.trim()).filter(Boolean) : [],
        calories: raw.calories ? Number(raw.calories) : 150,
        prepTimeMin: raw.prepTimeMin ? Number(raw.prepTimeMin) : 3,
        isFeatured: String(raw.isFeatured).toLowerCase() === 'true',
        isPopular: String(raw.isPopular).toLowerCase() === 'true',
      },
    };
  });
}

function escapeCsv(value: unknown) {
  const text = Array.isArray(value) ? value.join('|') : String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function productsToCsv(products: any[]) {
  const rows = products.map((product) => PRODUCT_CSV_HEADERS.map((header) => escapeCsv(product[header])).join(','));
  return `\uFEFF${PRODUCT_CSV_HEADERS.join(',')}\r\n${rows.join('\r\n')}`;
}
