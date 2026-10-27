import React, { useEffect, useState } from 'react';
import { KeyRound, LockKeyhole, LockKeyholeOpen, Search, UserPlus, X } from 'lucide-react';
import { ManagedUser, UserService } from '../../services/userService';
import { Pagination } from '../../components/common/Pagination';

const roleLabels: Record<ManagedUser['role'], string> = { CUSTOMER: 'Khách hàng', STAFF: 'Thu ngân', BARISTA: 'Pha chế', MANAGER: 'Quản lý' };

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', password: '', role: 'STAFF' });

  const load = async () => {
    try { setUsers(await UserService.list({ search, role, status })); setMessage(''); }
    catch (error: any) { setMessage(error.message); }
  };
  useEffect(() => { const id = window.setTimeout(load, 250); return () => window.clearTimeout(id); }, [search, role, status]);
  useEffect(() => setPage(1), [search, role, status]);
  const pagedUsers = users.slice((page - 1) * pageSize, page * pageSize);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    try { await UserService.create(form); setShowCreate(false); setForm({ name: '', username: '', email: '', phone: '', password: '', role: 'STAFF' }); await load(); }
    catch (error: any) { setMessage(error.message); }
  };
  const update = async (user: ManagedUser, updates: Partial<ManagedUser>) => {
    try { await UserService.update(user.id, updates); await load(); }
    catch (error: any) { setMessage(error.message); }
  };
  const resetPassword = async (user: ManagedUser) => {
    const password = window.prompt(`Mật khẩu tạm mới cho ${user.name} (ít nhất 8 ký tự):`);
    if (!password) return;
    try { await UserService.resetPassword(user.id, password); setMessage('Đã đặt lại mật khẩu và thu hồi phiên cũ.'); }
    catch (error: any) { setMessage(error.message); }
  };

  return <div className="space-y-5" data-ui>
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
      <div><h2 className="text-xl font-bold text-[#1B4332]">Tài khoản và phân quyền</h2><p className="text-sm text-[#5D7067] mt-1">Cấp đúng vai trò; khóa tài khoản sẽ thu hồi mọi phiên đăng nhập.</p></div>
      <button onClick={() => setShowCreate(true)} className="h-9 px-4 rounded-lg bg-[#1B4332] text-white text-sm font-semibold flex items-center gap-2"><UserPlus className="w-4 h-4" />Tạo tài khoản</button>
    </div>
    <div className="flex flex-col sm:flex-row gap-2">
      <label className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7D74]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm tên, username, email hoặc số điện thoại" className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#D8D3C7] text-sm"/></label>
      <select value={role} onChange={e=>setRole(e.target.value)} className="h-9 px-3 rounded-lg border border-[#D8D3C7] text-sm"><option value="">Mọi vai trò</option>{Object.entries(roleLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
      <select value={status} onChange={e=>setStatus(e.target.value)} className="h-9 px-3 rounded-lg border border-[#D8D3C7] text-sm"><option value="">Mọi trạng thái</option><option value="active">Đang hoạt động</option><option value="locked">Đã khóa</option></select>
    </div>
    {message && <p className="p-3 rounded-lg bg-[#FFF7ED] text-[#9A3412] text-sm">{message}</p>}
    <div className="bg-white border border-[#E5DFCE] rounded-xl"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-[#5D7067]"><th className="p-3">Tài khoản</th><th className="p-3">Liên hệ</th><th className="p-3">Vai trò</th><th className="p-3">Trạng thái</th><th className="p-3 text-right">Thao tác</th></tr></thead><tbody>{pagedUsers.map(user=><tr key={user.id} className="border-t border-[#F0ECE3]"><td className="p-3"><strong className="text-[#1B4332]">{user.name}</strong><div className="text-xs text-[#6B7D74]">@{user.username || '—'}</div></td><td className="p-3 text-[#5D7067]">{user.email || user.phone || '—'}</td><td className="p-3"><span className="inline-flex rounded-md bg-[#F2F6F3] px-2.5 py-1 text-xs font-semibold text-[#315C49]">{roleLabels[user.role]}</span></td><td className="p-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${user.isActive?'bg-[#E2F1E9] text-[#1B4332]':'bg-[#FFE4E6] text-[#9F1239]'}`}>{user.isActive?'Hoạt động':'Đã khóa'}</span></td><td className="p-3"><div className="flex items-center justify-end gap-1.5"><button type="button" onClick={()=>update(user,{isActive:!user.isActive})} className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${user.isActive?'text-[#9F1239] hover:bg-[#FFE4E6]':'text-[#1B4332] hover:bg-[#E2F1E9]'}`} title={user.isActive?'Khóa tài khoản':'Mở tài khoản'} aria-label={user.isActive?`Khóa tài khoản ${user.name}`:`Mở tài khoản ${user.name}`}>{user.isActive?<LockKeyhole className="h-4 w-4"/>:<LockKeyholeOpen className="h-4 w-4"/>}</button><button type="button" onClick={()=>resetPassword(user)} className="grid h-8 w-8 place-items-center rounded-lg text-[#315C49] transition-colors hover:bg-[#EDF3EF]" title="Đặt lại mật khẩu" aria-label={`Đặt lại mật khẩu cho ${user.name}`}><KeyRound className="h-4 w-4"/></button></div></td></tr>)}</tbody></table>{users.length===0&&<p className="p-8 text-center text-sm text-[#6B7D74]">Không có tài khoản phù hợp bộ lọc.</p>}</div><div className="px-4 pb-4"><Pagination page={page} pageSize={pageSize} totalItems={users.length} onPageChange={setPage}/></div></div>
    {showCreate&&<div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4"><form onSubmit={create} className="w-full max-w-lg bg-white rounded-xl p-5 space-y-4"><div className="flex justify-between"><h3 className="font-bold text-[#1B4332]">Tạo tài khoản nội bộ</h3><button type="button" onClick={()=>setShowCreate(false)}><X className="w-5 h-5"/></button></div><div className="grid sm:grid-cols-2 gap-3">{(['name','username','email','phone','password'] as const).map(field=><label key={field} className={field==='password'?'sm:col-span-2':''}><span className="block text-sm font-medium mb-1">{{name:'Họ tên',username:'Username',email:'Email',phone:'Số điện thoại',password:'Mật khẩu tạm'}[field]}</span><input required={['name','username','password'].includes(field)} type={field==='password'?'password':'text'} value={form[field]} onChange={e=>setForm({...form,[field]:e.target.value})} className="w-full h-10 px-3 border border-[#D8D3C7] rounded-lg"/></label>)}</div><label><span className="block text-sm font-medium mb-1">Vai trò</span><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="w-full h-10 px-3 border border-[#D8D3C7] rounded-lg">{Object.entries(roleLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><button className="w-full h-10 rounded-lg bg-[#1B4332] text-white font-semibold">Tạo tài khoản</button></form></div>}
  </div>;
};
