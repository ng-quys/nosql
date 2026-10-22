import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Star, CheckCircle2, Droplets, ShoppingBag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { BeverageIllustration } from '../../components/common/BeverageIllustration';
import { formatVND } from '../../utils/formatters';

export const HomePage: React.FC = () => {
  const { products, openDrinkModal } = useStore();
  const navigate = useNavigate();

  const featuredDrinks = products.filter((p) => p.isFeatured).slice(0, 3);
  const heroDrink = products[0] || featuredDrinks[0];

  return (
    <div className="space-y-10 sm:space-y-14 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-radial from-[#F7F4EC] via-[#FCFBF7] to-[#F2EDE2] pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-[#EAE5D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Cột trái: Tiêu đề & Giới thiệu */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#2D6A4F] bg-[#E2F1E9] px-3 py-1 rounded-full border border-[#C5E3D3]">
                <Sparkles className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>Nguyên liệu tươi chọn lọc &bull; Xay ép nguyên chất mỗi ngày</span>
              </div>

              <h1 className="font-['Be_Vietnam_Pro'] text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#121C17] leading-[1.08] text-balance">
                Trái cây tươi.<br />
                Vị ngon tự nhiên.<br />
                <span className="text-[#2D6A4F]">Tươi mỗi ngày.</span>
              </h1>

              <p className="text-sm sm:text-base text-[#5D7067] max-w-xl leading-relaxed">
                Khám phá các loại sinh tố sánh mịn và nước ép thanh mát được pha chế từ trái cây tươi Việt Nam tuyển chọn. Không hương liệu nhân tạo, tươi ngon tròn vị cho ngày tràn đầy năng lượng.
              </p>

              {/* Nút hành động chuẩn Customer (Tuyệt đối không có nút POS) */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to="/menu"
                  className="px-6 py-3 bg-[#2D6A4F] hover:bg-[#1B4332] active:scale-98 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <span>Xem thực đơn</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => {
                    if (heroDrink) openDrinkModal(heroDrink);
                    else navigate('/menu');
                  }}
                  className="px-5 py-3 bg-white border border-[#E5DFCE] hover:border-[#2D6A4F] hover:bg-[#F2F8F5] text-[#1B4332] text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-[#2D6A4F]" />
                  <span>Đặt món ngay</span>
                </button>
              </div>

              {/* Tóm tắt cam kết nhanh */}
              <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-[#5D7067] border-t border-[#EAE5D9]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                  <span>Nguyên liệu được chọn lọc</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                  <span>Pha chế theo yêu cầu</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                  <span>Trái cây tươi mỗi ngày</span>
                </div>
              </div>
            </div>

            {/* Cột phải: Thẻ món uống nổi bật được căn lề hài hòa */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full max-w-sm sm:max-w-md p-6 rounded-3xl bg-white/90 backdrop-blur-sm border border-[#E5DFCE] shadow-lg hover:shadow-xl transition-all">
                {heroDrink && (
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="py-2">
                      <BeverageIllustration drink={heroDrink} size="lg" />
                    </div>

                    <div>
                      <span className="text-xs uppercase tracking-wider font-semibold text-[#40916C]">
                        Gợi ý yêu thích nhất
                      </span>
                      <h3 className="font-['Be_Vietnam_Pro'] font-bold text-lg sm:text-xl text-[#1B4332] mt-0.5">
                        {heroDrink.name}
                      </h3>
                      <p className="text-xs text-[#5D7067] mt-1 line-clamp-2 max-w-sm leading-relaxed">
                        {heroDrink.tagline}
                      </p>
                    </div>

                    <div className="w-full pt-3 border-t border-[#F2EDE2] flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[11px] text-[#889C92]">Giá tiêu chuẩn</span>
                        <p className="text-base sm:text-lg font-bold text-[#EA580C] tabular-nums font-['Be_Vietnam_Pro']">
                          {formatVND(heroDrink.basePrice)}
                        </p>
                      </div>
                      <button
                        onClick={() => openDrinkModal(heroDrink)}
                        className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] active:scale-95 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                      >
                        Tùy chỉnh &amp; Đặt món
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST / BENEFIT STRIP (Nhịp điệu liền mạch, không khoảng trống vô lý) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-white border border-[#E5DFCE] shadow-xs">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-[#E2F1E9] text-[#2D6A4F] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1B4332]">100% Trái cây tươi</h4>
              <p className="text-[11px] text-[#5D7067]">Nhập mới hằng ngày</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1B4332]">Pha chế tại chỗ</h4>
              <p className="text-[11px] text-[#5D7067]">Xay ép khi khách gọi</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1B4332]">Tùy chỉnh linh hoạt</h4>
              <p className="text-[11px] text-[#5D7067]">Mức đường, đá &amp; topping</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-[#E2F1E9] text-[#2D6A4F] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1B4332]">Nguồn gốc rõ ràng</h4>
              <p className="text-[11px] text-[#5D7067]">Nhà vườn Việt Nam</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DANH MỤC MÓN UỐNG */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6CAE8F]">
              Danh mục đồ uống
            </span>
            <h2 className="font-['Be_Vietnam_Pro'] text-2xl sm:text-3xl font-bold text-[#1B4332] tracking-tight mt-1">
              Hương vị tự nhiên cho ngày tươi trẻ
            </h2>
          </div>
          <Link
            to="/menu"
            className="text-xs font-semibold text-[#2D6A4F] hover:text-[#1B4332] flex items-center gap-1 group"
          >
            <span>Xem toàn bộ thực đơn</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Sinh tố */}
          <div
            onClick={() => navigate('/menu?cat=smoothie')}
            className="cursor-pointer p-6 rounded-2xl bg-white border border-[#E5DFCE] hover:border-[#2D6A4F] hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#E2F1E9] text-[#2D6A4F] flex items-center justify-center text-xs font-bold font-mono">
                01
              </div>
              <h3 className="font-['Be_Vietnam_Pro'] text-lg font-bold text-[#1B4332] group-hover:text-[#2D6A4F] transition-colors">
                Sinh tố sánh mịn
              </h3>
              <p className="text-xs text-[#5D7067] leading-relaxed">
                Bơ sáp Đắk Lắk, xoài cát Chu, dâu tây Đà Lạt, mãng cầu xiêm xay nhuyễn cùng sữa đặc béo ngậy.
              </p>
            </div>
            <div className="pt-5 flex items-center justify-between text-xs font-semibold text-[#2D6A4F]">
              <span>Khám phá 5 món sinh tố</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Nước ép */}
          <div
            onClick={() => navigate('/menu?cat=fresh_juice')}
            className="cursor-pointer p-6 rounded-2xl bg-white border border-[#E5DFCE] hover:border-[#EA580C] hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center text-xs font-bold font-mono">
                02
              </div>
              <h3 className="font-['Be_Vietnam_Pro'] text-lg font-bold text-[#1B4332] group-hover:text-[#EA580C] transition-colors">
                Nước ép nguyên chất
              </h3>
              <p className="text-xs text-[#5D7067] leading-relaxed">
                Cam sành vắt tay, dưa hấu Long An, thơm mật, ổi hồng giòn ngọt ép lấy nước nguyên chất thanh mát.
              </p>
            </div>
            <div className="pt-5 flex items-center justify-between text-xs font-semibold text-[#EA580C]">
              <span>Khám phá 5 món nước ép</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Combo */}
          <div
            onClick={() => navigate('/menu?cat=combo_drinks')}
            className="cursor-pointer p-6 rounded-2xl bg-white border border-[#E5DFCE] hover:border-[#D97706] hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center text-xs font-bold font-mono">
                03
              </div>
              <h3 className="font-['Be_Vietnam_Pro'] text-lg font-bold text-[#1B4332] group-hover:text-[#D97706] transition-colors">
                Combo tiết kiệm
              </h3>
              <p className="text-xs text-[#5D7067] leading-relaxed">
                Kết hợp trọn vị giữa sinh tố béo thơm và nước ép mát lành, giá ưu đãi tiết kiệm cho đôi bạn.
              </p>
            </div>
            <div className="pt-5 flex items-center justify-between text-xs font-semibold text-[#D97706]">
              <span>Xem combo ưu đãi</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. MÓN TIÊU BIỂU (Equal height cards, consistent structure) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6CAE8F]">
            Gợi ý món ngon
          </span>
          <h2 className="font-['Be_Vietnam_Pro'] text-2xl sm:text-3xl font-bold text-[#1B4332] tracking-tight">
            Món uống nổi bật hôm nay
          </h2>
          <p className="text-xs sm:text-sm text-[#5D7067]">
            Pha chế tại chỗ ngay khi nhận đơn, bảo toàn dưỡng chất tự nhiên và vị ngọt thanh mát.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredDrinks.map((drink) => (
            <div
              key={drink.id}
              className="bg-white rounded-2xl border border-[#E5DFCE] overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full group"
            >
              {/* Hình minh họa ly nước chiều cao chuẩn đồng nhất */}
              <div className={`p-6 bg-gradient-to-b ${drink.bgGradient} flex items-center justify-center relative overflow-hidden h-48 sm:h-52 shrink-0`}>
                <BeverageIllustration drink={drink} size="md" />
                <span className="absolute top-3 right-3 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/85 text-[#1B4332] shadow-xs">
                  {drink.calories} kcal
                </span>
              </div>

              {/* Thông tin món */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6CAE8F]">
                      {drink.category === 'smoothie' ? 'Sinh tố' : drink.category === 'fresh_juice' ? 'Nước ép' : 'Combo'}
                    </span>
                    <span className="text-xs font-bold text-[#EA580C] tabular-nums font-['Be_Vietnam_Pro']">
                      {formatVND(drink.basePrice)}
                    </span>
                  </div>
                  <h3 className="font-['Be_Vietnam_Pro'] font-bold text-base text-[#1B4332] group-hover:text-[#2D6A4F] transition-colors">
                    {drink.name}
                  </h3>
                  <p className="text-xs text-[#5D7067] line-clamp-2 leading-relaxed">
                    {drink.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#F2EDE2] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#5D7067]">
                    <span>Chuẩn bị: ~{drink.prepTimeMin} phút</span>
                  </div>
                  <button
                    onClick={() => openDrinkModal(drink)}
                    className="px-3.5 py-1.5 bg-[#2D6A4F] hover:bg-[#1B4332] active:scale-95 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                  >
                    Đặt món
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. BANNER KHUYẾN MÃI */}
      <section id="khuyen-mai" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#1B4332] text-white p-7 sm:p-10 relative overflow-hidden shadow-lg">
          <div className="relative z-10 max-w-xl space-y-3.5">
            <span className="inline-block px-3 py-1 rounded-full bg-[#EA580C] text-white text-xs font-bold uppercase tracking-wider">
              Ưu đãi bạn mới
            </span>
            <h2 className="font-['Be_Vietnam_Pro'] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
              Giảm ngay 10.000 ₫ cho đơn hàng đầu tiên với mã <span className="text-[#FED7AA] font-mono">GIAM10K</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#C5E3D3] leading-relaxed">
              Áp dụng cho mọi món sinh tố bơ, xoài, dâu tây hoặc combo nước ép tươi khi đặt tại quán hoặc mang về.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/menu"
                className="px-5 py-2.5 bg-white text-[#1B4332] hover:bg-[#FAF8F2] text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Đặt món ngay
              </Link>
              <span className="text-xs text-[#9BCBB4]">Mã giảm áp dụng trực tiếp tại giỏ hàng</span>
            </div>
          </div>

          <div className="absolute right-4 -bottom-10 opacity-10 pointer-events-none">
            <svg viewBox="0 0 200 200" className="w-80 h-80 fill-current">
              <path d="M100 0 C50 50, 0 100, 0 150 C0 200, 100 200, 150 150 C200 100, 150 50, 100 0 Z" />
            </svg>
          </div>
        </div>
      </section>

      {/* 6. ĐÁNH GIÁ TỪ KHÁCH HÀNG (Realistic Vietnamese Customers without professional titles) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8 space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6CAE8F]">
            Khách hàng chia sẻ
          </span>
          <h2 className="font-['Be_Vietnam_Pro'] text-2xl sm:text-3xl font-bold text-[#1B4332] tracking-tight">
            Khách hàng yêu thích FreshLeaf
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Trần Hoàng Quân',
              role: 'Khách hàng thân thiết, Quận 3',
              drink: 'Nước ép cam sành miền Tây',
              quote: 'Nước ép cam sành nguyên chất vắt tay rất thơm, vị ngọt thanh tự nhiên chứ không bị ngọt gắt đường. Bổ sung vitamin C mỗi buổi trưa rất tốt.',
              rating: 5,
            },
            {
              name: 'Nguyễn Lê Thảo',
              role: 'Khách hàng, Quận 1',
              drink: 'Sinh tố bơ sáp Đắk Lắk',
              quote: 'Sinh tố bơ ở đây cực kỳ béo ngậy và sánh mịn. Mình thích tùy chọn 50% đường và ít đá, uống vừa vặn thanh mát, không bị loãng.',
              rating: 5,
            },
            {
              name: 'Lê Quang Huy',
              role: 'Khách hàng, Quận 3',
              drink: 'Combo sinh tố năng lượng',
              quote: 'Sau mỗi buổi tập mình hay ghé quán uống sinh tố bơ thêm hạt chia. Trái cây tươi thật sự, nhân viên pha chế nhanh và rất nhiệt tình.',
              rating: 5,
            },
          ].map((rev, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-[#E5DFCE] flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-[#EA580C]">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-[#2D3F37] italic leading-relaxed">
                  &ldquo;{rev.quote}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-[#F2EDE2]">
                <p className="text-xs font-bold text-[#1B4332]">{rev.name}</p>
                <p className="text-[11px] text-[#889C92]">{rev.role}</p>
                <p className="text-[10px] text-[#40916C] mt-1 font-medium">
                  Món yêu thích: {rev.drink}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
