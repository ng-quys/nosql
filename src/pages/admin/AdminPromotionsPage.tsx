import React, { useEffect, useState } from 'react';
import { Funnel, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Pagination } from '../../components/common/Pagination';
import { PromotionItem, PromotionService } from '../../services/promotionService';
import { ProductService } from '../../services/productService';
import { Drink } from '../../types';
import { formatDate, formatVND } from '../../utils/formatters';

type FormState = Omit<PromotionItem, 'id' | 'status' | 'usedCount'>;
const emptyForm: FormState = { code: '', title: '', description: '', discountType: 'fixed', discountValue: 10000,
  minOrderAmount: 0, maxDiscount: 0, startAt: '', endAt: '', usageLimit: 0, perCustomerLimit: 0,
  scope: 'all', categoryIds: [], productIds: [], isActive: true };
const statusLabels: Record<string, string> = { upcoming: 'Chưa bắt đầu', active: 'Đang áp dụng', expired: 'Hết hạn', exhausted: 'Hết lượt', disabled: 'Đã tắt' };
const categoryOptions = [{ id: 'CAT01', label: 'Sinh tố' }, { id: 'CAT02', label: 'Nước ép' }, { id: 'CAT03', label: 'Combo' }];
const dateInput = (value?: string) => value ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)).replace(' ', 'T') : '';
const vietnamIso = (value?: string) => value ? new Date(`${value}:00+07:00`).toISOString() : undefined;

export const AdminPromotionsPage: React.FC = () => {
  const [items, setItems] = useState<PromotionItem[]>([]);
  const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [showFilters, setShowFilters] = useState(false);
  const [draftFilters, setDraftFilters] = useState({ type: '', status: '', from: '', to: '' });
  const [filters, setFilters] = useState(draftFilters); const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<PromotionItem | null>(null); const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm); const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Drink[]>([]);

  const load = async () => {
    setLoading(true);
    try { const result = await PromotionService.getPromotionPage({ page, limit: 10, search, ...filters }); setItems(result.items); setTotal(result.pagination.total); }
    catch (error: any) { setMessage(error.message); } finally { setLoading(false); }
  };
  useEffect(() => { const timer = window.setTimeout(() => void load(), 250); return () => window.clearTimeout(timer); }, [page, search, filters]);
  useEffect(() => setPage(1), [search, filters]);
  useEffect(() => { ProductService.getAllDrinks({ limit: 100 }).then(setProducts).catch(() => setProducts([])); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); setMessage(''); };
  const openEdit = (item: PromotionItem) => {
    setEditing(item); setForm({ ...emptyForm, ...item, startAt: dateInput(item.startAt), endAt: dateInput(item.endAt),
      categoryIds: item.categoryIds || [], productIds: item.productIds || [] }); setShowForm(true); setMessage('');
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { ...form, code: form.code.trim().toUpperCase(), startAt: vietnamIso(form.startAt), endAt: vietnamIso(form.endAt),
      productIds: form.scope === 'products' ? form.productIds : [],
      categoryIds: form.scope === 'category' ? form.categoryIds : [] };
    try { if (editing) await PromotionService.updatePromotion(editing.id, payload); else await PromotionService.createPromotion(payload);
      setShowForm(false); setMessage(editing ? 'Đã cập nhật mã giảm giá.' : 'Đã tạo mã giảm giá.'); await load();
    } catch (error: any) { setMessage(error.message); }
  };
  const toggle = async (item: PromotionItem) => { try { await PromotionService.updatePromotion(item.id, { isActive: !item.isActive }); setMessage(item.isActive ? 'Đã tắt mã giảm giá.' : 'Đã bật mã giảm giá.'); await load(); } catch (e: any) { setMessage(e.message); } };
  const remove = async (item: PromotionItem) => { if (!window.confirm(`Xóa mã ${item.code}? Mã đã được sử dụng sẽ chỉ được lưu trữ và vô hiệu hóa.`)) return;
    try { await PromotionService.deletePromotion(item.id); setMessage('Đã xử lý xóa mã giảm giá.'); await load(); } catch (e: any) { setMessage(e.message); } };
  const setField = (key: keyof FormState, value: any) => setForm(current => ({ ...current, [key]: value }));

  return <div className="space-y-5" data-ui>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold text-[#173E2D]">Quản lý mã giảm giá</h1><p className="mt-1 text-sm text-[#5D7067]">Thiết lập điều kiện, thời gian và giới hạn sử dụng cho từng ưu đãi.</p></div></div>
    <section className="rounded-xl border border-[#E5DFCE] bg-white p-4">
      <div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold text-[#6B7D74]">ƯU ĐÃI</span><span className="text-xs tabular-nums text-[#6B7D74]">{total} mã</span></div>
      <div className="flex gap-2"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo mã/tên…" className="h-9 min-w-0 flex-1 rounded-lg border border-[#D8D3C7] px-3 text-sm"/>
        <button type="button" onClick={() => setShowFilters(v => !v)} className="grid h-[34px] w-[34px] place-items-center rounded-lg border border-[#D8D3C7] text-[#315C49] hover:bg-[#F2F6F3]" title="Bộ lọc" aria-label="Mở bộ lọc"><Funnel className="h-4 w-4"/></button>
        <button type="button" onClick={openCreate} className="grid h-[34px] w-[34px] place-items-center rounded-lg bg-[#173E2D] text-white hover:bg-[#24583F]" title="Tạo mã giảm giá" aria-label="Tạo mã giảm giá"><Plus className="h-4 w-4"/></button></div>
      {showFilters && <div className="mt-3 grid gap-2 rounded-lg bg-[#F7F8F5] p-3 sm:grid-cols-2 lg:grid-cols-4"><select value={draftFilters.type} onChange={e => setDraftFilters({...draftFilters,type:e.target.value})} className="h-9 rounded-lg border border-[#D8D3C7] px-2 text-sm"><option value="">Mọi loại</option><option value="fixed">Giảm tiền</option><option value="percentage">Giảm phần trăm</option></select>
        <select value={draftFilters.status} onChange={e => setDraftFilters({...draftFilters,status:e.target.value})} className="h-9 rounded-lg border border-[#D8D3C7] px-2 text-sm"><option value="">Mọi trạng thái</option>{Object.entries(statusLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
        <input type="date" value={draftFilters.from} onChange={e=>setDraftFilters({...draftFilters,from:e.target.value})} className="h-9 rounded-lg border border-[#D8D3C7] px-2 text-sm"/><input type="date" value={draftFilters.to} onChange={e=>setDraftFilters({...draftFilters,to:e.target.value})} className="h-9 rounded-lg border border-[#D8D3C7] px-2 text-sm"/>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4"><button onClick={()=>setFilters(draftFilters)} className="h-9 rounded-lg bg-[#173E2D] px-4 text-sm font-semibold text-white">Áp dụng</button><button onClick={()=>{const reset={type:'',status:'',from:'',to:''};setDraftFilters(reset);setFilters(reset)}} className="h-9 rounded-lg border border-[#D8D3C7] px-4 text-sm font-semibold">Đặt lại</button></div></div>}
    </section>
    {message && <p className="rounded-lg bg-[#FFF7ED] px-3 py-2 text-sm text-[#9A3412]" role="status">{message}</p>}
    <div className="overflow-hidden rounded-xl border border-[#E5DFCE] bg-white"><div className="overflow-x-auto"><table className="min-w-[1180px] w-full text-sm"><thead><tr className="text-left text-xs text-[#6B7D74]"><th className="p-3">Mã</th><th className="p-3">Tên chương trình</th><th className="p-3">Loại</th><th className="p-3 text-right">Giá trị</th><th className="p-3 text-right">Đơn tối thiểu</th><th className="p-3">Hiệu lực</th><th className="p-3 text-right">Lượt sử dụng</th><th className="p-3">Trạng thái</th><th className="p-3 text-right">Thao tác</th></tr></thead>
      <tbody>{items.map(item => <tr key={item.id} className="border-t border-[#F0ECE3]"><td className="p-3 font-semibold text-[#173E2D]">{item.code}</td><td className="p-3"><strong>{item.title}</strong><p className="max-w-[230px] truncate text-xs text-[#6B7D74]">{item.description || '—'}</p></td><td className="p-3">{item.discountType==='percentage'?'Giảm phần trăm':'Giảm tiền'}</td><td className="p-3 text-right font-semibold tabular-nums">{item.discountType==='percentage'?`${item.discountValue}%`:formatVND(item.discountValue)}</td><td className="p-3 text-right tabular-nums">{formatVND(item.minOrderAmount||0)}</td><td className="p-3 text-xs">{item.startAt?formatDate(item.startAt):'Ngay'} – {item.endAt?formatDate(item.endAt):'Không giới hạn'}</td><td className="p-3 text-right tabular-nums">{item.usedCount||0}{item.usageLimit?` / ${item.usageLimit}`:' / ∞'}</td><td className="p-3"><button onClick={()=>toggle(item)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status==='active'?'bg-[#E2F1E9] text-[#173E2D]':item.status==='disabled'?'bg-[#F0ECE3] text-[#5D7067]':'bg-[#FFF4D6] text-[#854D0E]'}`}>{statusLabels[item.status||'disabled']}</button></td><td className="p-3"><div className="flex justify-end gap-1"><button onClick={()=>openEdit(item)} className="grid h-[34px] w-[34px] place-items-center rounded-lg text-[#315C49] hover:bg-[#EDF3EF]" title="Sửa" aria-label={`Sửa ${item.code}`}><Pencil className="h-4 w-4"/></button><button onClick={()=>remove(item)} className="grid h-[34px] w-[34px] place-items-center rounded-lg text-[#9F1239] hover:bg-[#FFF1F2]" title="Xóa" aria-label={`Xóa ${item.code}`}><Trash2 className="h-4 w-4"/></button></div></td></tr>)}</tbody></table>
      {loading&&<p className="p-8 text-center text-sm text-[#6B7D74]">Đang tải dữ liệu…</p>}{!loading&&!items.length&&<p className="p-8 text-center text-sm text-[#6B7D74]">Không có mã phù hợp.</p>}</div><div className="px-4 pb-4"><Pagination page={page} pageSize={10} totalItems={total} onPageChange={setPage}/></div></div>
    {showForm&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#173E2D]">{editing?'Sửa mã giảm giá':'Tạo mã giảm giá'}</h2><p className="text-xs text-[#6B7D74]">Thời gian được lưu và kiểm tra theo múi giờ Việt Nam.</p></div><button type="button" onClick={()=>setShowForm(false)} aria-label="Đóng"><X className="h-5 w-5"/></button></div>
      <div className="grid gap-3 sm:grid-cols-2">{[['code','Mã giảm giá'],['title','Tên chương trình']] .map(([key,label])=><label key={key}><span className="mb-1 block text-sm font-medium">{label}</span><input required disabled={key==='code'&&!!editing} value={(form as any)[key]} onChange={e=>setField(key as keyof FormState,e.target.value)} className="h-10 w-full rounded-lg border border-[#D8D3C7] px-3 disabled:bg-[#F2F2EE]"/></label>)}
      <label className="sm:col-span-2"><span className="mb-1 block text-sm font-medium">Mô tả</span><textarea value={form.description||''} onChange={e=>setField('description',e.target.value)} className="min-h-20 w-full rounded-lg border border-[#D8D3C7] p-3"/></label>
      <label><span className="mb-1 block text-sm font-medium">Loại giảm</span><select value={form.discountType} onChange={e=>setField('discountType',e.target.value)} className="h-10 w-full rounded-lg border border-[#D8D3C7] px-3"><option value="fixed">Số tiền</option><option value="percentage">Phần trăm</option></select></label><label><span className="mb-1 block text-sm font-medium">Giá trị giảm</span><input required type="number" min="1" max={form.discountType==='percentage'?100:undefined} value={form.discountValue} onChange={e=>setField('discountValue',Number(e.target.value))} className="h-10 w-full rounded-lg border border-[#D8D3C7] px-3"/></label>
      {form.discountType==='percentage'&&<label><span className="mb-1 block text-sm font-medium">Mức giảm tối đa</span><input type="number" min="0" value={form.maxDiscount||0} onChange={e=>setField('maxDiscount',Number(e.target.value))} className="h-10 w-full rounded-lg border border-[#D8D3C7] px-3"/></label>}<label><span className="mb-1 block text-sm font-medium">Đơn hàng tối thiểu</span><input type="number" min="0" value={form.minOrderAmount||0} onChange={e=>setField('minOrderAmount',Number(e.target.value))} className="h-10 w-full rounded-lg border border-[#D8D3C7] px-3"/></label>
      <label><span className="mb-1 block text-sm font-medium">Bắt đầu</span><input type="datetime-local" value={form.startAt||''} onChange={e=>setField('startAt',e.target.value)} className="h-10 w-full rounded-lg border border-[#D8D3C7] px-3"/></label><label><span className="mb-1 block text-sm font-medium">Kết thúc</span><input type="datetime-local" value={form.endAt||''} onChange={e=>setField('endAt',e.target.value)} className="h-10 w-full rounded-lg border border-[#D8D3C7] px-3"/></label>
      <label><span className="mb-1 block text-sm font-medium">Tổng lượt sử dụng (0 = không giới hạn)</span><input type="number" min="0" value={form.usageLimit||0} onChange={e=>setField('usageLimit',Number(e.target.value))} className="h-10 w-full rounded-lg border border-[#D8D3C7] px-3"/></label><label><span className="mb-1 block text-sm font-medium">Lượt mỗi khách (0 = không giới hạn)</span><input type="number" min="0" value={form.perCustomerLimit||0} onChange={e=>setField('perCustomerLimit',Number(e.target.value))} className="h-10 w-full rounded-lg border border-[#D8D3C7] px-3"/></label>
      <label><span className="mb-1 block text-sm font-medium">Phạm vi áp dụng</span><select value={form.scope} onChange={e=>setField('scope',e.target.value)} className="h-10 w-full rounded-lg border border-[#D8D3C7] px-3"><option value="all">Toàn bộ sản phẩm</option><option value="category">Danh mục</option><option value="products">Sản phẩm cụ thể</option></select></label>
      {form.scope==='category'&&<div><span className="mb-1 block text-sm font-medium">Danh mục</span><div className="flex flex-wrap gap-3">{categoryOptions.map(c=><label key={c.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.categoryIds?.includes(c.id)} onChange={e=>setField('categoryIds',e.target.checked?[...(form.categoryIds||[]),c.id]:(form.categoryIds||[]).filter(x=>x!==c.id))}/>{c.label}</label>)}</div></div>}
      {form.scope==='products'&&<label><span className="mb-1 block text-sm font-medium">Sản phẩm áp dụng</span><select multiple value={form.productIds||[]} onChange={e=>setField('productIds',Array.from(e.target.selectedOptions, option=>option.value))} className="min-h-28 w-full rounded-lg border border-[#D8D3C7] p-2">{products.map(product=><option key={product.id} value={product.id}>{product.name}</option>)}</select><span className="mt-1 block text-xs text-[#6B7D74]">Giữ Ctrl để chọn nhiều sản phẩm.</span></label>}
      <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium"><input type="checkbox" checked={form.isActive} onChange={e=>setField('isActive',e.target.checked)}/>Bật mã sau khi lưu</label></div>
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={()=>setShowForm(false)} className="h-10 rounded-lg border border-[#D8D3C7] px-4 font-semibold">Hủy</button><button className="h-10 rounded-lg bg-[#173E2D] px-5 font-semibold text-white">{editing?'Lưu thay đổi':'Tạo mã'}</button></div></form></div>}
  </div>;
};
