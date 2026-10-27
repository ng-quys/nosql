import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Search, Upload, Download } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { BeverageIllustration } from '../../components/common/BeverageIllustration';
import { Category, Drink } from '../../types';
import { formatVND, sanitizePrice } from '../../utils/formatters';
import { ProductImportRow, ProductImportService } from '../../services/productImportService';
import { Pagination } from '../../components/common/Pagination';

export const AdminProductsPage: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrink, setEditingDrink] = useState<Drink | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [previewRows, setPreviewRows] = useState<ProductImportRow[]>([]);
  const [importMessage, setImportMessage] = useState('');

  // Form fields
  const [formName, setFormName] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('smoothie');
  const [formBasePrice, setFormBasePrice] = useState<number>(45000);
  const [formCalories, setFormCalories] = useState<number>(200);
  const [formPrepTime, setFormPrepTime] = useState<number>(3);
  const [formIngredients, setFormIngredients] = useState<string>('Bơ sáp Đắk Lắk, Sữa đặc, Sữa tươi');

  const filteredProducts = products.filter((p) => {
    if (filterCat !== 'all' && p.category !== filterCat) return false;
    if (
      search &&
      !p.name.toLowerCase().includes(search.toLowerCase()) &&
      !p.ingredients.some((i) => i.toLowerCase().includes(search.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });
  useEffect(() => setPage(1), [search, filterCat]);
  const pagedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenAdd = () => {
    setEditingDrink(null);
    setFormName('');
    setFormTagline('');
    setFormDesc('');
    setFormCategory('smoothie');
    setFormBasePrice(45000);
    setFormCalories(200);
    setFormPrepTime(3);
    setFormIngredients('Bơ sáp Đắk Lắk, Sữa đặc, Sữa tươi');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (drink: Drink) => {
    setEditingDrink(drink);
    setFormName(drink.name);
    setFormTagline(drink.tagline);
    setFormDesc(drink.description);
    setFormCategory(drink.category);
    setFormBasePrice(drink.basePrice);
    setFormCalories(drink.calories);
    setFormPrepTime(drink.prepTimeMin);
    setFormIngredients(drink.ingredients.join(', '));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ings = formIngredients
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    const cleanBasePrice = sanitizePrice(formBasePrice, 45000);

    if (editingDrink) {
      await updateProduct(editingDrink.id, {
        name: formName,
        tagline: formTagline,
        description: formDesc,
        category: formCategory,
        basePrice: cleanBasePrice,
        calories: Number(formCalories),
        prepTimeMin: Number(formPrepTime),
        ingredients: ings,
      });
    } else {
      await addProduct({
        name: formName,
        tagline: formTagline,
        description: formDesc,
        category: formCategory,
        basePrice: cleanBasePrice,
        calories: Number(formCalories),
        prepTimeMin: Number(formPrepTime),
        themeColor: '#2D6A4F',
        bgGradient: 'from-[#E2F1E9] via-[#C5E3D3] to-[#9BCBB4]',
        ingredients: ings,
        isAvailable: true,
        nutrition: {
          protein: '3.5g',
          carbs: '30g',
          sugars: '20g',
          fiber: '4g',
        },
        benefits: ['Trái cây tươi Việt Nam', 'Giải nhiệt và bổ sung vitamin'],
      });
    }

    setIsModalOpen(false);
  };

  const toggleAvailability = async (drink: Drink) => {
    await updateProduct(drink.id, { isAvailable: !drink.isAvailable });
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === 'smoothie') return 'Sinh tố';
    if (cat === 'fresh_juice') return 'Nước ép';
    return 'Combo';
  };

  const readCsv = async (file?: File) => {
    if (!file) return;
    setCsvText(await file.text()); setPreviewRows([]); setImportMessage('');
  };
  const previewCsv = async () => {
    try { const result = await ProductImportService.preview(csvText); setPreviewRows(result.rows); setImportMessage(`${result.validCount} dòng hợp lệ, ${result.errorCount} dòng cần sửa.`); }
    catch (error: any) { setImportMessage(error.message); }
  };
  const importCsv = async () => {
    try { const result = await ProductImportService.import(csvText); setImportMessage(`Đã import ${result.imported} sản phẩm.`); window.setTimeout(()=>window.location.reload(),700); }
    catch (error: any) { setImportMessage(error.message); }
  };

  return (
    <div className="space-y-6">
      {/* Bộ lọc & Thêm món */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-[#F2EDE2] rounded-xl text-xs">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'smoothie', label: 'Sinh tố' },
              { id: 'fresh_juice', label: 'Nước ép' },
              { id: 'combo_drinks', label: 'Combo' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setFilterCat(c.id as Category | 'all')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
                  filterCat === c.id ? 'bg-white text-[#1B4332] shadow-xs' : 'text-[#5D7067]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#889C92]" />
            <input
              type="text"
              placeholder="Tìm kiếm món trong kho..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#E5DFCE] bg-white text-[#1B4332]"
            />
          </div>
        </div>

        <div className="flex gap-2"><button onClick={()=>ProductImportService.download().catch(e=>setImportMessage(e.message))} className="px-3 py-2 border border-[#D8D3C7] text-[#1B4332] text-xs font-semibold rounded-lg flex items-center gap-1.5"><Download className="w-4 h-4"/>Xuất CSV</button><button onClick={()=>setImportOpen(true)} className="px-3 py-2 border border-[#D8D3C7] text-[#1B4332] text-xs font-semibold rounded-lg flex items-center gap-1.5"><Upload className="w-4 h-4"/>Import CSV</button><button onClick={handleOpenAdd} className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"><Plus className="w-4 h-4" /><span>Thêm món</span></button></div>
      </div>

      {importMessage && !importOpen && <p className="p-3 rounded-lg bg-[#FFF7ED] text-[#9A3412] text-sm">{importMessage}</p>}

      {/* Bảng danh sách món */}
      <div className="bg-white rounded-2xl border border-[#E5DFCE] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F2] border-b border-[#E5DFCE] text-[#5D7067] uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Tên món &amp; Danh mục</th>
                <th className="py-3 px-4">Nguyên liệu pha chế</th>
                <th className="py-3 px-4">Giá bán chuẩn</th>
                <th className="py-3 px-4">Calo / Thời gian</th>
                <th className="py-3 px-4">Tình trạng phục vụ</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EDE2]">
              {pagedProducts.map((drink) => (
                <tr key={drink.id} className="hover:bg-[#FCFBF7] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-12 rounded bg-[#FAF8F2] border border-[#E5DFCE] flex items-center justify-center p-1 shrink-0">
                        <BeverageIllustration drink={drink} size="sm" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#1B4332]">{drink.name}</h4>
                        <span className="text-[10px] text-[#6CAE8F] font-semibold uppercase">
                          {getCategoryLabel(drink.category)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs text-[#5D7067]">
                    <p className="line-clamp-2">{drink.ingredients.join(', ')}</p>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#1B4332] font-sans text-sm tabular-nums">
                    {formatVND(drink.basePrice)}
                  </td>
                  <td className="py-3.5 px-4 text-[#5D7067] tabular-nums">
                    <p>{drink.calories} kcal</p>
                    <p className="text-[10px] text-[#889C92]">{drink.prepTimeMin} phút pha chế</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => toggleAvailability(drink)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                        drink.isAvailable
                          ? 'bg-[#E2F1E9] text-[#2D6A4F] hover:bg-[#C5E3D3]'
                          : 'bg-[#FFE4E6] text-[#E11D48] hover:bg-[#FECDD3]'
                      }`}
                    >
                      {drink.isAvailable ? 'Còn hàng' : 'Hết hàng / Tạm ngưng'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    <button
                      onClick={() => handleOpenEdit(drink)}
                      className="p-1.5 rounded-lg border border-[#E5DFCE] hover:bg-[#FAF8F2] text-[#5D7067] hover:text-[#1B4332] transition-colors"
                      title="Chỉnh sửa món"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteProduct(drink.id)}
                      className="p-1.5 rounded-lg border border-[#E5DFCE] hover:bg-[#FFE4E6] text-[#5D7067] hover:text-[#E11D48] transition-colors"
                      title="Xóa món"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4"><Pagination page={page} pageSize={pageSize} totalItems={filteredProducts.length} onPageChange={setPage} /></div>
      </div>

      {/* Modal Thêm / Sửa món */}
      {importOpen && <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4"><div className="w-full max-w-3xl max-h-[85vh] overflow-auto bg-white rounded-xl p-5 space-y-4"><div className="flex justify-between"><div><h3 className="font-bold text-[#1B4332]">Import sản phẩm từ CSV</h3><p className="text-xs text-[#5D7067] mt-1">Cột bắt buộc: name, categoryId, price. Hệ thống chỉ thêm mới và không ghi đè sản phẩm hiện có.</p></div><button onClick={()=>setImportOpen(false)}><X className="w-5 h-5"/></button></div><input type="file" accept=".csv,text/csv" onChange={e=>readCsv(e.target.files?.[0])} className="block w-full text-sm"/>{csvText&&<div className="flex gap-2"><button onClick={previewCsv} className="h-9 px-4 rounded-lg border border-[#D8D3C7] text-sm font-semibold">Xem trước và kiểm tra</button><button onClick={importCsv} disabled={!previewRows.length||previewRows.some(r=>r.errors.length>0)} className="h-9 px-4 rounded-lg bg-[#1B4332] text-white text-sm font-semibold disabled:opacity-40">Xác nhận import</button></div>}{importMessage&&<p className="text-sm text-[#9A3412]">{importMessage}</p>}{previewRows.length>0&&<div className="overflow-x-auto border border-[#E5DFCE] rounded-lg"><table className="w-full text-xs"><thead><tr className="text-left"><th className="p-2">Dòng</th><th className="p-2">Tên</th><th className="p-2">Danh mục</th><th className="p-2 text-right">Giá</th><th className="p-2">Kết quả</th></tr></thead><tbody>{previewRows.map(row=><tr key={row.row} className="border-t border-[#F0ECE3]"><td className="p-2">{row.row}</td><td className="p-2">{row.data.name}</td><td className="p-2">{row.data.categoryId}</td><td className="p-2 text-right tabular-nums">{formatVND(row.data.price)}</td><td className={`p-2 ${row.errors.length?'text-[#9F1239]':'text-[#247B50]'}`}>{row.errors.join('; ')||'Hợp lệ'}</td></tr>)}</tbody></table></div>}</div></div>}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E5DFCE] p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2EDE2]">
              <h3 className="font-sans font-bold text-base text-[#1B4332]">
                {editingDrink ? 'Chỉnh sửa: ' + editingDrink.name : 'Tạo món uống mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#889C92] hover:text-[#1B4332]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Tên món uống</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ví dụ: Sinh tố bơ sáp Đắk Lắk"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5DFCE] bg-white text-[#1B4332]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Khẩu hiệu / Giới thiệu ngắn</label>
                <input
                  type="text"
                  required
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  placeholder="ví dụ: Béo ngậy sánh mịn từ bơ cao nguyên"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5DFCE] bg-white text-[#1B4332]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1B4332] mb-1">Danh mục</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Category)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DFCE] bg-white text-[#1B4332]"
                  >
                    <option value="smoothie">Sinh tố</option>
                    <option value="fresh_juice">Nước ép</option>
                    <option value="combo_drinks">Combo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1B4332] mb-1">Giá bán chuẩn (₫)</label>
                  <input
                    type="number"
                    step="1000"
                    min="10000"
                    required
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DFCE] bg-white text-[#1B4332] tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1B4332] mb-1">Lượng Calo (kcal)</label>
                  <input
                    type="number"
                    required
                    value={formCalories}
                    onChange={(e) => setFormCalories(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DFCE] bg-white text-[#1B4332] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1B4332] mb-1">Thời gian pha (phút)</label>
                  <input
                    type="number"
                    required
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5DFCE] bg-white text-[#1B4332] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1B4332] mb-1">
                  Nguyên liệu (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  required
                  value={formIngredients}
                  onChange={(e) => setFormIngredients(e.target.value)}
                  placeholder="Bơ sáp, Sữa đặc, Sữa tươi, Đá viên"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5DFCE] bg-white text-[#1B4332]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1B4332] mb-1">Mô tả hương vị</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Mô tả nguồn gốc nguyên liệu và cảm giác khi thưởng thức..."
                  className="w-full px-3 py-2 rounded-lg border border-[#E5DFCE] bg-white text-[#1B4332]"
                />
              </div>

              <div className="pt-3 border-t border-[#F2EDE2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#E5DFCE] rounded-xl hover:bg-[#FAF8F2] text-[#5D7067] font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl font-semibold shadow-xs"
                >
                  {editingDrink ? 'Lưu thay đổi' : 'Thêm món vào thực đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
