import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Leaf, Plus, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { BeverageIllustration } from '../../components/common/BeverageIllustration';
import { formatVND } from '../../utils/formatters';
import { CategoryItem, CategoryService } from '../../services/categoryService';
import { ApiService } from '../../services/api';
import { PromotionItem } from '../../services/promotionService';
import { ProductService } from '../../services/productService';
import { Drink } from '../../types';

export const HomePage: React.FC = () => {
  const { products, openDrinkModal } = useStore();
  const [drinks, setDrinks] = useState<Drink[]>(products);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(!products.length);
  const [error, setError] = useState(false);
  const load = async () => {
    setLoading(true); setError(false);
    try { setDrinks(await ProductService.getAllDrinks()); }
    catch { setError(true); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load();
    CategoryService.getCategories().then(setCategories).catch(() => {});
    ApiService.get<PromotionItem[]>('/promotions').then(r => setPromotions(Array.isArray(r.data) ? r.data.filter(p => p.isActive && ['TUOIMOINGAY', 'FRESHLEAF10', 'GIAM10K'].includes(p.code)) : [])).catch(() => {});
  }, []);
  useEffect(() => { if (products.length) setDrinks(products); }, [products]);
  const heroChoices = drinks.filter(d => d.isAvailable).slice(0, 5);
  const hero = heroChoices.find(d => d.id === selected) || heroChoices.find(d => /xoài|mango/i.test(d.name)) || heroChoices[0];
  const inCategory = (d: Drink, c: CategoryItem) => d.categoryId === c.id || d.category === c.code;
  const visible = drinks.filter(d => category === 'all' || categories.some(c => c.id === category && inCategory(d, c)))
    .sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured)).slice(0, 4);
  return (
    <div className="fresh-home">
      <section className="fresh-hero fresh-frame" aria-labelledby="hero-heading">
        <div className="fresh-hero-copy">
          <p className="fresh-intro"><Leaf size={17} /> Trái cây tươi. Pha chế theo cách của bạn.</p>
          <h1 id="hero-heading">Một ly tươi.<br />Một ngày mới.</h1>
          <p className="fresh-description">Sinh tố sánh mịn, nước ép thanh mát từ trái cây chọn lọc. Một chút ngon lành để ngày của bạn thêm tươi.</p>
          <div className="fresh-actions">
            <Link className="fresh-button" to="/menu">Khám phá thực đơn <ArrowUpRight size={19} /></Link>
            {hero && <button className="fresh-text-button" disabled={!hero.isAvailable} onClick={() => openDrinkModal(hero)}>Đặt món ngay <ArrowRight size={18} /></button>}
          </div>
        </div>
        <div className="fresh-hero-stage">
          {hero ? <>
            <div className="fresh-hero-image" key={hero.id}><BeverageIllustration drink={hero} size="hero" /></div>
            <div className="fresh-nutrition"><span><strong>{hero.calories}</strong> kcal / ly</span><span><strong>{hero.prepTimeMin}</strong> phút pha chế</span><span><strong>{hero.nutrition.fiber}</strong> chất xơ</span></div>
            <div className="fresh-hero-ticket"><div><span>Hôm nay, thử một ly</span><h2>{hero.name}</h2><strong>{formatVND(hero.basePrice)}</strong></div><button aria-label={`Tùy chỉnh ${hero.name}`} onClick={() => openDrinkModal(hero)}><ArrowUpRight size={24} /></button></div>
          </> : <img className="fresh-static-hero" src="/images/MangoSmoothie.png" alt="Sinh tố xoài cùng lá bạc hà tươi" width="360" height="360" />}
        </div>
        {!!heroChoices.length && <div className="fresh-flavors" aria-label="Chọn món giới thiệu"><span>Tìm vị bạn thích</span>{heroChoices.map(d => <button key={d.id} onClick={() => setSelected(d.id)} aria-label={`Xem ${d.name}`} aria-pressed={hero?.id === d.id} className={hero?.id === d.id ? 'is-selected' : ''}><BeverageIllustration drink={d} size="sm" /></button>)}</div>}
      </section>
      <section className="fresh-menu fresh-frame" aria-labelledby="menu-heading">
        <div className="fresh-section-heading"><div><h2 id="menu-heading">Chọn vị, thêm vui.</h2><p>Một ly hợp gu đang chờ bạn.</p></div><Link className="fresh-text-button" to="/menu">Toàn bộ thực đơn <ArrowUpRight size={19} /></Link></div>
        <div className="fresh-categories" aria-label="Danh mục đồ uống"><button aria-pressed={category === 'all'} className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}><Leaf size={19} /> Tất cả</button>{categories.filter(c => c.isActive !== false).sort((a,b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map(c => {
          const sample = drinks.find(d => inCategory(d,c));
          return <button key={c.id} aria-pressed={category === c.id} className={category === c.id ? 'active' : ''} onClick={() => setCategory(c.id)}>{sample && <BeverageIllustration drink={sample} size="sm" />}{c.name}</button>;
        })}</div>
        {loading && !drinks.length ? <div className="fresh-product-grid" aria-busy="true" aria-label="Đang tải đồ uống">{[0,1,2,3].map(i => <div key={i} className="fresh-skeleton" />)}</div> : error && !drinks.length ? <div className="fresh-empty" role="alert"><h3>Chưa thể tải thực đơn</h3><p>Vui lòng thử kết nối lại để xem những món đang phục vụ.</p><button className="fresh-button" onClick={load}><RefreshCw size={17} /> Thử lại</button></div> : visible.length ? <div className="fresh-product-grid">{visible.map(d => <article className="fresh-product" key={d.id}>
          <button className="fresh-product-picture" onClick={() => openDrinkModal(d)} aria-label={`Xem và tùy chỉnh ${d.name}`}><BeverageIllustration drink={d} size="lg" />{d.isPopular && <span className="fresh-product-tag">Bán chạy</span>}{!d.isAvailable && <span className="fresh-product-tag">Tạm hết</span>}</button>
          <div className="fresh-product-info"><h3>{d.name}</h3><p>{d.tagline || d.description}</p><div><strong>{formatVND(d.basePrice)}</strong><button disabled={!d.isAvailable} onClick={() => openDrinkModal(d)} aria-label={`Tùy chỉnh ${d.name}`}><Plus size={20} /></button></div></div>
        </article>)}</div> : <div className="fresh-empty"><h3>Chưa có món trong danh mục này</h3><p>Khám phá thực đơn để tìm hương vị khác nhé.</p><Link to="/menu" className="fresh-text-button">Xem thực đơn <ArrowRight size={18} /></Link></div>}
      </section>
      <section id="khuyen-mai" className="fresh-promo fresh-frame">
        <div><h2>{promotions.length ? 'Thêm tươi, thêm ưu đãi.' : 'Ngon hơn khi cùng nhau.'}</h2><p>{(promotions[0] ? [promotions[0].title, promotions[0].description].filter(Boolean).join('. ') : '') || 'Chọn một ly cho bạn, thêm một ly cho người thương. Khám phá các combo FreshLeaf trong thực đơn.'}</p>{promotions[0] && <p className="fresh-promo-code">Mã ưu đãi: <strong>{promotions[0].code}</strong>{!!promotions[0].minOrderAmount && ` · Đơn từ ${formatVND(promotions[0].minOrderAmount)}`}</p>}<Link to={promotions.length ? '/menu' : '/menu?cat=combo_drinks'} className="fresh-button">{promotions.length ? 'Khám phá ưu đãi' : 'Khám phá combo'} <ArrowUpRight size={19} /></Link></div>
        <img src="/images/TropicalCombo.png" alt="Combo sinh tố và nước ép FreshLeaf" width="360" height="360" loading="lazy" />
      </section>
      <section className="fresh-story fresh-frame"><div><Leaf size={32} /><h2>Tươi từ nguyên liệu.<br />Ngon theo gu bạn.</h2></div><div><p>Điều làm nên một ly FreshLeaf là những lựa chọn nhỏ: trái cây chọn lọc, món được pha khi bạn gọi và hương vị đúng ý bạn.</p><p>Chọn kích cỡ, mức đường, lượng đá và topping yêu thích. Phần còn lại, để FreshLeaf chuẩn bị.</p><Link to="/menu" className="fresh-text-button">Pha một ly của riêng bạn <ArrowUpRight size={19} /></Link></div></section>
    </div>
  );
};
