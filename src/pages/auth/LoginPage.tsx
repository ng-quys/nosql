import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, MonitorCheck, ChefHat, LayoutDashboard } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const { login } = useStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleQuickLogin = (role: UserRole) => {
    const demoPassword = String(import.meta.env.VITE_DEMO_PASSWORD || '');
    setEmail(`demo_${role}`);
    setPassword(demoPassword);
    setError(demoPassword ? 'Đã điền tài khoản demo. Bấm Đăng nhập để tiếp tục.' : 'Máy chưa cấu hình VITE_DEMO_PASSWORD trong .env.local.');
    requestAnimationFrame(() => document.getElementById('login-submit')?.focus());
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const submittedIdentifier = String(formData.get('identifier') || email).trim();
    const submittedPassword = String(formData.get('password') || password);
    if (!submittedIdentifier || !submittedPassword) {
      setError('Vui lòng nhập username hoặc email và mật khẩu.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await login(submittedIdentifier, submittedPassword);
      if (user.role === 'staff') navigate('/pos');
      else if (user.role === 'barista') navigate('/kds');
      else if (user.role === 'manager') navigate('/admin');
      else navigate('/menu');
    } catch (loginError: any) {
      setError(loginError.message || 'Không thể đăng nhập. Vui lòng kiểm tra lại tài khoản và mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-8rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5DFCE] shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-[#2D6A4F] text-white mx-auto flex items-center justify-center font-bold font-sans">
            FL
          </div>
          <h1 className="font-sans font-bold text-2xl text-[#1B4332]">
            Đăng nhập hệ thống FreshLeaf
          </h1>
          <p className="text-xs text-[#5D7067]">
            Chọn vai trò để điền nhanh tài khoản demo, sau đó nhập mật khẩu để đăng nhập.
          </p>
        </div>

        {/* Nút đăng nhập 1 chạm phân quyền */}
        <div className="space-y-2 pt-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#889C92] text-center">
            Trải nghiệm nhanh theo vai trò
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleRoleQuickLogin('customer')}
              className="p-3 rounded-xl border border-[#E5DFCE] hover:border-[#2D6A4F] hover:bg-[#F2F8F5] transition-all text-left flex items-start gap-2.5 group"
            >
              <ShoppingBag className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#1B4332]">Khách hàng</p>
                <p className="text-[10px] text-[#5D7067]">Thực đơn &amp; Đặt món</p>
              </div>
            </button>

            <button
              onClick={() => handleRoleQuickLogin('staff')}
              className="p-3 rounded-xl border border-[#E5DFCE] hover:border-[#EA580C] hover:bg-[#FFEDD5]/40 transition-all text-left flex items-start gap-2.5 group"
            >
              <MonitorCheck className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#1B4332]">Thu ngân</p>
                <p className="text-[10px] text-[#5D7067]">Màn hình POS</p>
              </div>
            </button>

            <button
              onClick={() => handleRoleQuickLogin('barista')}
              className="p-3 rounded-xl border border-[#E5DFCE] hover:border-[#2563EB] hover:bg-[#DBEAFE]/40 transition-all text-left flex items-start gap-2.5 group"
            >
              <ChefHat className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#1B4332]">Pha chế</p>
                <p className="text-[10px] text-[#5D7067]">Màn hình KDS</p>
              </div>
            </button>

            <button
              onClick={() => handleRoleQuickLogin('manager')}
              className="p-3 rounded-xl border border-[#E5DFCE] hover:border-[#7C3AED] hover:bg-[#EDE9FE]/40 transition-all text-left flex items-start gap-2.5 group"
            >
              <LayoutDashboard className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#1B4332]">Quản lý</p>
                <p className="text-[10px] text-[#5D7067]">Doanh thu &amp; Kho</p>
              </div>
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-[#E5DFCE]" />
          <span className="absolute px-3 bg-white text-[11px] font-semibold text-[#889C92]">
            hoặc đăng nhập bằng tài khoản
          </span>
        </div>

        {/* Biểu mẫu đăng nhập thủ công */}
        <form onSubmit={handleManualLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#1B4332] mb-1">Username hoặc email</label>
            <input
              name="identifier"
              type="text"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ví dụ: demo_barista"
              className="w-full px-3 py-2 rounded-xl border border-[#E5DFCE] bg-white text-[#1B4332]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1B4332] mb-1">Mật khẩu</label>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl border border-[#E5DFCE] bg-white text-[#1B4332]"
            />
          </div>

          {error && (
            <p className={`rounded-lg px-3 py-2 text-xs ${error.startsWith('Nhập mật khẩu') ? 'bg-[#F2F8F5] text-[#1B4332]' : 'bg-[#FFF1F2] text-[#9F1239]'}`} role="status">
              {error}
            </p>
          )}

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center text-xs text-[#5D7067]">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-bold text-[#2D6A4F] hover:underline">
            Đăng ký thành viên FreshLeaf
          </Link>
        </p>
      </div>
    </div>
  );
};
