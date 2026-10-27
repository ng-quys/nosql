import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { UserRole } from '../../types';

export const ProtectedRoute: React.FC<{ roles?: UserRole[]; children: React.ReactNode }> = ({ roles, children }) => {
  const { currentUser, authReady } = useStore();
  const location = useLocation();
  if (!authReady) return <div className="min-h-[45vh] grid place-items-center text-sm text-[#5D7067]">Đang xác thực phiên đăng nhập…</div>;
  if (!currentUser) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(currentUser.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};
