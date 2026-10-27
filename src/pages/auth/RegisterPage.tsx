import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { AuthService } from '../../services/authService';

export const RegisterPage: React.FC = () => {
  const { switchRole } = useStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setLoading(true);
    try {
      await AuthService.register(name, email, 'customer', phone);
      await switchRole('customer');
      navigate('/menu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-8rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5DFCE] shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-[#2D6A4F] text-white mx-auto flex items-center justify-center font-bold">
            <Leaf className="w-5 h-5" />
          </div>
          <h1 className="font-sans font-bold text-2xl text-[#1B4332]">
            Đăng ký thành viên FreshLeaf
          </h1>
          <p className="text-xs text-[#5D7067]">
            Tích lũy điểm thưởng và nhận ưu đãi nước ép tươi mỗi tuần.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#1B4332] mb-1">Họ và tên</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ví dụ: Nguyễn Văn An"
              className="w-full px-3 py-2 rounded-xl border border-[#E5DFCE] bg-white text-[#1B4332]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1B4332] mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nguyenvanan@gmail.com"
              className="w-full px-3 py-2 rounded-xl border border-[#E5DFCE] bg-white text-[#1B4332]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1B4332] mb-1">Số điện thoại (Nhận tin nhắn đơn hàng)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
              className="w-full px-3 py-2 rounded-xl border border-[#E5DFCE] bg-white text-[#1B4332]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1B4332] mb-1">Tạo mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl border border-[#E5DFCE] bg-white text-[#1B4332]"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#F2F8F5] border border-[#C5E3D3] space-y-1">
            <div className="flex items-center gap-1.5 text-[#2D6A4F] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Đặc quyền thành viên</span>
            </div>
            <p className="text-[11px] text-[#5D7067]">
              Tặng 100 điểm thưởng ngay khi tạo tài khoản &bull; Đổi 1 ly sinh tố bất kỳ mỗi khi tích đủ 10 ly.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản thành viên'}
          </button>
        </form>

        <p className="text-center text-xs text-[#5D7067]">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-bold text-[#2D6A4F] hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
};
