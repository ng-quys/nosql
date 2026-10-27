import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { BeverageIllustration } from '../../components/common/BeverageIllustration';
import { Drink } from '../../types';
import { formatVND } from '../../utils/formatters';
import { ProductService } from '../../services/productService';
import { CategoryService, CategoryItem } from '../../services/categoryService';
import { Pagination } from '../../components/common/Pagination';

export const ProductsPage: React.FC = () => {
  const { products: storeProducts, openDrinkModal, addToCart } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [realProducts, setRealProducts] = useState<Drink[]>(storeProducts);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(storeProducts.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prods, cats] = await Promise.all([
        ProductService.getAllDrinks(),
        CategoryService.getCategories().catch(() => []),
      ]);
      setRealProducts(prods);
      if (cats && cats.length > 0) {
        setCategoriesList(cats);
      }
    } catch (err: any) {
      console.warn('[ProductsPage] Lỗi tải thực đơn từ máy chủ:', err.message);
      setError('Không thể tải danh sách sản phẩm từ máy chủ. Vui lòng kiểm tra kết nối.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  // Sync with store updates if items were added/updated
  useEffect(() => {
    if (storeProducts.length > 0) {
      setRealProducts(storeProducts);
    }
  }, [storeProducts]);

  const displayProducts = realProducts.length > 0 ? realProducts : storeProducts;

  const rawCatParam = (searchParams.get('cat') as any) || 'all';
  // Map category parameter if provided as CAT01, CAT02, CAT03 or UI names
  let currentCat = 'all';
  if (rawCatParam === 'CAT01' || rawCatParam === 'smoothie') currentCat = 'CAT01';
  else if (rawCatParam === 'CAT02' || rawCatParam === 'fresh_juice') currentCat = 'CAT02';
  else if (rawCatParam === 'CAT03' || rawCatParam === 'combo_drinks' || rawCatParam === 'combo') currentCat = 'CAT03';

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Category mapping:
  // categoryId = CAT01 → Sinh tố
  // categoryId = CAT02 → Nước ép
  // categoryId = CAT03 → Combo
  const isSmoothie = (p: Drink) => p.categoryId === 'CAT01' || p.category === 'smoothie';
  const isJuice = (p: Drink) => p.categoryId === 'CAT02' || p.category === 'fresh_juice';
  const isCombo = (p: Drink) => p.categoryId === 'CAT03' || p.category === 'combo_drinks';

  const smoothieCount = displayProducts.filter(isSmoothie).length;
  const juiceCount = displayProducts.filter(isJuice).length;
  const comboCount = displayProducts.filter(isCombo).length;

  const categories: { id: string; label: string; count: number }[] = [
    { id: 'all', label: 'Tất cả món', count: displayProducts.length },
    { id: 'CAT01', label: 'Sinh tố', count: smoothieCount },
    { id: 'CAT02', label: 'Nước ép', count: juiceCount },
    { id: 'CAT03', label: 'Combo', count: comboCount },
  ];

  const handleCategoryChange = (cat: string) => {
    if (cat === 'all') {
      searchParams.delete('cat');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ cat });
    }
  };

  const filteredDrinks = useMemo(() => {
    let list = displayProducts.filter((drink) => {
      // Bộ lọc danh mục (CAT01 -> Sinh tố, CAT02 -> Nước ép, CAT03 -> Combo)
      if (currentCat !== 'all') {
        if (currentCat === 'CAT01' && !isSmoothie(drink)) return false;
        if (currentCat === 'CAT02' && !isJuice(drink)) return false;
        if (currentCat === 'CAT03' && !isCombo(drink)) return false;
      }
      // Tìm kiếm từ khóa (Hỗ trợ cả tên tiếng Anh và tiếng Việt như xoài/mango, bơ/avocado)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const n = drink.name.toLowerCase();
        const rn = ((drink as any).rawName || '').toLowerCase();
        const d = (drink.description || '').toLowerCase();
        const t = (drink.tagline || '').toLowerCase();
        const hasIng = (drink.ingredients || []).some((ing) => ing.toLowerCase().includes(q));

        const isXoai = (q.includes('xoai') || q.includes('xoài') || q.includes('mango')) && (n.includes('xoài') || rn.includes('mango'));
        const isBo = (q.includes('bo') || q.includes('bơ') || q.includes('avocado')) && (n.includes('bơ') || rn.includes('avocado'));
        const isCam = (q.includes('cam') || q.includes('orange')) && (n.includes('cam') || rn.includes('orange'));
        const isDau = (q.includes('dau') || q.includes('dâu') || q.includes('strawberry')) && (n.includes('dâu') || rn.includes('strawberry'));
        const isDua = (q.includes('thom') || q.includes('thơm') || q.includes('dứa') || q.includes('pineapple')) && (n.includes('thơm') || n.includes('dứa') || rn.includes('pineapple'));
        const isChanhDay = (q.includes('chanh day') || q.includes('chanh dây') || q.includes('passion')) && (n.includes('chanh dây') || rn.includes('passion'));
        const isDuaHau = (q.includes('dua hau') || q.includes('dưa hấu') || q.includes('watermelon')) && (n.includes('dưa hấu') || rn.includes('watermelon'));
        const isOi = (q.includes('oi') || q.includes('ổi') || q.includes('guava')) && (n.includes('ổi') || rn.includes('guava'));

        if (
          !n.includes(q) &&
          !rn.includes(q) &&
          !d.includes(q) &&
          !t.includes(q) &&
          !hasIng &&
          !isXoai &&
          !isBo &&
          !isCam &&
          !isDau &&
          !isDua &&
          !isChanhDay &&
          !isDuaHau &&
          !isOi
        ) {
          return false;
        }
      }
      return true;
    });

    // Bộ lọc / sắp xếp món
    if (sortOption === 'popular') {
      list = [...list].sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
    } else if (sortOption === 'price_asc') {
      list = [...list].sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortOption === 'price_desc') {
      list = [...list].sort((a, b) => b.basePrice - a.basePrice);
    }

    return list;
  }, [displayProducts, currentCat, searchQuery, sortOption]);
  useEffect(() => setPage(1), [currentCat, searchQuery, sortOption]);
  const pagedDrinks = filteredDrinks.slice((page - 1) * pageSize, page * pageSize);

  const handleQuickAdd = (drink: Drink, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      drinkId: drink.id,
      drink,
      size: 'medium',
      sugar: '50%',
      ice: 'regular',
      boosters: [],
      unitPrice: drink.basePrice + 5000, // Size M standard
      quantity: 1,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Tiêu đề trang theo yêu cầu */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#EAE5D9]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6CAE8F]">
            Thức uống tươi nguyên chất mỗi ngày
          </span>
          <h1 className="font-sans text-3xl sm:text-4xl font-extrabold text-[#1B4332] tracking-tight mt-1">
            Thực đơn sinh tố &amp; nước ép
          </h1>
          <p className="text-xs sm:text-sm text-[#5D7067] mt-1 max-w-xl">
            Khám phá các món uống tươi ngon được pha chế từ nguyên liệu chất lượng mỗi ngày. Tùy chỉnh mức đường, mức đá và kích cỡ theo sở thích của bạn.
          </p>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#889C92]" />
          <input
            type="text"
            placeholder="Tìm kiếm bơ, xoài, cam sành..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-[#E5DFCE] focus:border-[#2D6A4F] focus:outline-hidden bg-white text-[#1B4332] shadow-xs"
          />
        </div>
      </div>

      {/* Tabs danh mục và Bộ lọc sắp xếp */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Nút danh mục */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F2EDE2] rounded-xl overflow-x-auto max-w-full">
          {categories.map((c) => {
            const isActive = currentCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => handleCategoryChange(c.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-[#1B4332] shadow-xs'
                    : 'text-[#5D7067] hover:text-[#1B4332]'
                }`}
              >
                <span>{c.label}</span>
                <span className="ml-1.5 text-[10px] text-[#889C92] tabular-nums">
                  ({c.count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Bộ lọc sắp xếp */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#889C92] text-[11px] font-medium hidden sm:inline">Sắp xếp:</span>
          {[
            { id: 'all', label: 'Tất cả món' },
            { id: 'popular', label: 'Bán chạy' },
            { id: 'price_asc', label: 'Giá thấp đến cao' },
            { id: 'price_desc', label: 'Giá cao đến thấp' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSortOption(s.id)}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                sortOption === s.id
                  ? 'bg-[#1B4332] text-white font-semibold'
                  : 'bg-white border border-[#E5DFCE] text-[#5D7067] hover:bg-[#FAF8F2]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lưới sản phẩm */}
      {error && displayProducts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-red-200 bg-red-50/50 space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-red-800">{error}</p>
          <button
            onClick={fetchMenuData}
            className="px-4 py-2 bg-[#2D6A4F] text-white text-xs font-semibold rounded-lg hover:bg-[#1B4332] inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : loading && displayProducts.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-[#E5DFCE] p-4 space-y-4 animate-pulse">
              <div className="h-48 bg-[#F2EDE2] rounded-xl" />
              <div className="h-4 bg-[#F2EDE2] rounded w-3/4" />
              <div className="h-3 bg-[#F2EDE2] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredDrinks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-[#E5DFCE] bg-[#FAF8F2] space-y-3">
          <p className="text-sm font-semibold text-[#1B4332]">Không tìm thấy món uống phù hợp</p>
          <p className="text-xs text-[#5D7067]">Vui lòng thử tìm từ khóa khác hoặc chọn danh mục Tất cả món.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              handleCategoryChange('all');
              setSortOption('all');
            }}
            className="px-4 py-2 bg-[#2D6A4F] text-white text-xs font-semibold rounded-lg hover:bg-[#1B4332]"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pagedDrinks.map((drink) => (
            <div
              key={drink.id}
              onClick={() => openDrinkModal(drink)}
              className="cursor-pointer bg-white rounded-2xl border border-[#E5DFCE] hover:border-[#2D6A4F] hover:shadow-lg transition-all duration-300 flex flex-col h-full group overflow-hidden"
            >
              {/* Hình ảnh minh họa */}
              <div
                className={`p-5 bg-gradient-to-b ${drink.bgGradient} flex items-center justify-center relative h-48 sm:h-52 shrink-0 group-hover:brightness-95 transition-all`}
              >
                <BeverageIllustration drink={drink} size="md" />

                {/* Trạng thái còn hàng / hết hàng */}
                <div className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/95 text-[#1B4332] shadow-xs">
                  {drink.isAvailable ? 'Còn hàng' : 'Hết hàng'}
                </div>

                {/* Thời gian pha chế */}
                <div className="absolute bottom-2 left-3 text-[10px] text-[#1B4332]/80 font-medium">
                  {drink.prepTimeMin} phút pha
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-[#6CAE8F]">
                      {drink.category === 'smoothie' ? 'Sinh tố' : drink.category === 'fresh_juice' ? 'Nước ép' : 'Combo'}
                    </span>
                    <span className="text-sm font-bold text-[#EA580C] font-sans tabular-nums">
                      {formatVND(drink.basePrice)}
                    </span>
                  </div>

                  <h3 className="font-sans font-bold text-sm text-[#1B4332] group-hover:text-[#2D6A4F] transition-colors">
                    {drink.name}
                  </h3>

                  <p className="text-[11px] text-[#5D7067] line-clamp-2 leading-relaxed">
                    {drink.description}
                  </p>
                </div>

                {/* Thành phần tóm tắt */}
                <div className="pt-2 border-t border-[#F2EDE2]">
                  <p className="text-[10px] text-[#889C92] truncate">
                    {drink.ingredients.slice(0, 3).join(', ')}
                    {drink.ingredients.length > 3 && ` +${drink.ingredients.length - 3} loại`}
                  </p>
                </div>

                {/* Nút thao tác: Tùy chỉnh / Thêm */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDrinkModal(drink);
                    }}
                    className="flex-1 py-1.5 px-3 bg-[#FAF8F2] hover:bg-[#F2EDE2] text-[#1B4332] border border-[#E5DFCE] text-xs font-semibold rounded-lg transition-colors text-center"
                  >
                    Tùy chỉnh
                  </button>

                  <button
                    onClick={(e) => handleQuickAdd(drink, e)}
                    className="p-1.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-lg transition-colors shadow-xs"
                    title="Thêm nhanh (Size Vừa, đường 50%, đá vừa)"
                    aria-label={`Thêm ${drink.name}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} pageSize={pageSize} totalItems={filteredDrinks.length} onPageChange={setPage} />
    </div>
  );
};
