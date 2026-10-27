import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { BeverageIllustration } from './BeverageIllustration';
import { BoosterAddon, DrinkSize, IceLevel, SugarLevel } from '../../types';
import { formatVND } from '../../utils/formatters';

const AVAILABLE_BOOSTERS: BoosterAddon[] = [
  { id: 'b_chia', name: 'Hạt chia hữu cơ', price: 5000 },
  { id: 'b_thachdua', name: 'Thạch dừa giòn', price: 5000 },
  { id: 'b_tranchau', name: 'Trân châu trắng giòn', price: 5000 },
  { id: 'b_suachua', name: 'Thêm sữa chua lên men', price: 7000 },
];

export const DrinkCustomizerModal: React.FC = () => {
  const { activeDrinkForModal, closeDrinkModal, addToCart } = useStore();

  const [selectedSize, setSelectedSize] = useState<DrinkSize>('medium');
  const [selectedSugar, setSelectedSugar] = useState<SugarLevel>('50%');
  const [selectedIce, setSelectedIce] = useState<IceLevel>('regular');
  const [selectedBoosters, setSelectedBoosters] = useState<BoosterAddon[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (activeDrinkForModal) {
      setSelectedSize('medium');
      setSelectedSugar('50%');
      setSelectedIce('regular');
      setSelectedBoosters([]);
      setNotes('');
      setQuantity(1);
    }
  }, [activeDrinkForModal]);

  if (!activeDrinkForModal) return null;

  const drink = activeDrinkForModal;

  // Kích cỡ Việt Nam: Nhỏ (S), Vừa (M), Lớn (L)
  const sizePrices: Record<DrinkSize, { label: string; volume: string; extra: number }> = {
    small: { label: 'Nhỏ', volume: '350ml (Size S)', extra: 0 },
    medium: { label: 'Vừa', volume: '500ml (Size M)', extra: 5000 },
    large: { label: 'Lớn', volume: '700ml (Size L)', extra: 10000 },
  };

  const boosterTotal = selectedBoosters.reduce((sum, b) => sum + b.price, 0);
  const unitPrice = drink.basePrice + sizePrices[selectedSize].extra + boosterTotal;
  const totalPrice = unitPrice * quantity;

  const toggleBooster = (booster: BoosterAddon) => {
    setSelectedBoosters((prev) =>
      prev.some((b) => b.id === booster.id)
        ? prev.filter((b) => b.id !== booster.id)
        : [...prev, booster]
    );
  };

  const handleAddToCart = () => {
    addToCart({
      drinkId: drink.id,
      drink,
      size: selectedSize,
      sugar: selectedSugar,
      ice: selectedIce,
      boosters: selectedBoosters,
      notes: notes.trim() || undefined,
      unitPrice,
      quantity,
    });
    closeDrinkModal();
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'smoothie':
        return 'Sinh tố';
      case 'fresh_juice':
        return 'Nước ép';
      case 'combo_drinks':
        return 'Combo tiết kiệm';
      default:
        return cat;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E5DFCE] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Nút đóng */}
        <button
          onClick={closeDrinkModal}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-[#2D3F37] border border-[#E5DFCE] shadow-xs transition-colors"
          aria-label="Đóng cửa sổ tùy chỉnh"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[85vh] overflow-y-auto">
          {/* Cột hình ảnh ly nước */}
          <div className="md:col-span-5 bg-radial from-[#F7F4EA] to-[#EAE5D9] p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#E5DFCE] relative">
            <BeverageIllustration drink={drink} size="lg" />
            <div className="mt-4 text-center">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#6CAE8F]">
                {getCategoryLabel(drink.category)}
              </span>
              <h3 className="font-sans font-bold text-lg text-[#1B4332] mt-0.5">
                {drink.name}
              </h3>
              <p className="text-xs text-[#5D7067] mt-1 tabular-nums">
                {drink.calories} kcal &bull; Pha chế trong {drink.prepTimeMin} phút
              </p>
            </div>

            {/* Nguyên liệu chính */}
            <div className="mt-4 w-full pt-4 border-t border-[#DED6C3]/60">
              <p className="text-[11px] font-semibold text-[#2D3F37] uppercase tracking-wider mb-2">
                Nguyên liệu chính
              </p>
              <div className="flex flex-wrap gap-1.5">
                {drink.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-white/80 text-[#1B4332] border border-[#E5DFCE]"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Cột chọn tùy chỉnh */}
          <div className="md:col-span-7 p-6 space-y-6">
            <div>
              <p className="text-xs text-[#5D7067] leading-relaxed">{drink.description}</p>
            </div>

            {/* 1. Chọn Kích Cỡ */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1B4332] mb-2.5">
                1. Chọn kích cỡ
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(sizePrices) as DrinkSize[]).map((sz) => {
                  const info = sizePrices[sz];
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-[#2D6A4F] bg-[#F2F8F5] ring-1 ring-[#2D6A4F]'
                          : 'border-[#E5DFCE] hover:border-[#C5E3D3] bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1B4332]">{info.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#2D6A4F]" />}
                      </div>
                      <p className="text-[11px] text-[#5D7067] mt-0.5">{info.volume}</p>
                      <p className="text-xs font-semibold text-[#EA580C] mt-1 tabular-nums">
                        {info.extra > 0 ? `+${formatVND(info.extra)}` : 'Tiêu chuẩn'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Mức Đường & Mức Đá */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mức Đường */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1B4332] mb-2">
                  Mức đường
                </label>
                <div className="grid grid-cols-5 gap-1 p-1 bg-[#F7F4EA] rounded-lg border border-[#E5DFCE]">
                  {(['0%', '30%', '50%', '70%', '100%'] as SugarLevel[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSugar(s)}
                      className={`py-1 text-xs font-semibold rounded-md transition-all ${
                        selectedSugar === s
                          ? 'bg-[#2D6A4F] text-white shadow-xs'
                          : 'text-[#5D7067] hover:text-[#1B4332]'
                      }`}
                      title={s === '0%' ? 'Không đường' : `Đường ${s}`}
                    >
                      {s === '0%' ? '0%' : s}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#889C92] mt-1">
                  {selectedSugar === '0%' ? 'Không thêm đường' : selectedSugar === '100%' ? 'Ngọt chuẩn quán' : `Độ ngọt ${selectedSugar}`}
                </p>
              </div>

              {/* Mức Đá */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1B4332] mb-2">
                  Mức đá
                </label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-[#F7F4EA] rounded-lg border border-[#E5DFCE]">
                  {[
                    { id: 'no_ice', label: '0 đá' },
                    { id: 'less_ice', label: 'Ít đá' },
                    { id: 'regular', label: 'Vừa' },
                    { id: 'more_ice', label: 'Nhiều' },
                  ].map((ice) => (
                    <button
                      key={ice.id}
                      type="button"
                      onClick={() => setSelectedIce(ice.id as IceLevel)}
                      className={`py-1 text-xs font-semibold rounded-md transition-all ${
                        selectedIce === ice.id
                          ? 'bg-[#2D6A4F] text-white shadow-xs'
                          : 'text-[#5D7067] hover:text-[#1B4332]'
                      }`}
                    >
                      {ice.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#889C92] mt-1">
                  {selectedIce === 'no_ice' ? 'Không đá (để tủ lạnh)' : selectedIce === 'less_ice' ? 'Ít đá mát nhẹ' : selectedIce === 'regular' ? 'Lượng đá tiêu chuẩn' : 'Nhiều đá mát sâu'}
                </p>
              </div>
            </div>

            {/* 3. Topping Thêm */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1B4332] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#EA580C]" />
                  Topping thêm vào ly (Tùy chọn)
                </label>
              </div>
              <div className="space-y-1.5">
                {AVAILABLE_BOOSTERS.map((b) => {
                  const isChecked = selectedBoosters.some((item) => item.id === b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBooster(b)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${
                        isChecked
                          ? 'border-[#2D6A4F] bg-[#F2F8F5] text-[#1B4332]'
                          : 'border-[#E5DFCE] text-[#2D3F37] hover:bg-[#FAF8F2]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked
                              ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white'
                              : 'border-[#C5E3D3] bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={isChecked ? 'font-semibold' : ''}>{b.name}</span>
                      </div>
                      <span className="font-semibold text-[#EA580C] tabular-nums">
                        +{formatVND(b.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Ghi Chú Đặc Biệt */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1B4332] mb-1.5">
                Ghi chú cho món
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thêm ghi chú cho món (ví dụ: bớt ngọt, không lấy ống hút)..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#E5DFCE] focus:border-[#2D6A4F] focus:outline-hidden bg-white text-[#1B4332] placeholder:text-[#889C92]"
              />
            </div>

            {/* Thanh thao tác Số Lượng & Thêm Vào Giỏ */}
            <div className="pt-4 border-t border-[#E5DFCE] flex items-center justify-between gap-4">
              {/* Stepper số lượng */}
              <div className="flex items-center gap-2 border border-[#E5DFCE] rounded-lg p-1 bg-[#F7F4EA]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 flex items-center justify-center text-[#5D7067] hover:text-[#1B4332] hover:bg-white rounded-md transition-colors"
                  aria-label="Giảm số lượng"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-bold text-xs tabular-nums text-[#1B4332]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-7 h-7 flex items-center justify-center text-[#5D7067] hover:text-[#1B4332] hover:bg-white rounded-md transition-colors"
                  aria-label="Tăng số lượng"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Thêm vào giỏ */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-between px-5 py-3 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] active:scale-98 text-white font-semibold text-xs transition-all shadow-sm"
              >
                <span>Thêm vào đơn hàng</span>
                <span className="text-sm font-bold tabular-nums">
                  {formatVND(totalPrice)}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
