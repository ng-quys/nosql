import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, pageSize, totalItems, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  useEffect(() => {
    if (page > totalPages) onPageChange(totalPages);
  }, [page, totalPages, onPageChange]);
  if (totalItems <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === totalPages || Math.abs(value - page) <= 1
  );

  return (
    <nav className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4" aria-label="Phân trang">
      <p className="text-xs text-[#5D7067] tabular-nums">Hiển thị {start}–{end} trên {totalItems}</p>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1} className="h-9 px-3 rounded-lg border border-[#D8D3C7] text-xs font-semibold text-[#1B4332] disabled:opacity-40" aria-label="Trang trước"><ChevronLeft className="w-4 h-4" /></button>
        {pages.map((value, index) => (
          <React.Fragment key={value}>
            {index > 0 && value - pages[index - 1] > 1 && <span className="px-1 text-[#6B7D74]">…</span>}
            <button type="button" onClick={() => onPageChange(value)} aria-current={value === page ? 'page' : undefined} className={`h-9 min-w-9 px-2 rounded-lg text-xs font-semibold ${value === page ? 'bg-[#1B4332] text-white' : 'border border-[#D8D3C7] text-[#1B4332]'}`}>{value}</button>
          </React.Fragment>
        ))}
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="h-9 px-3 rounded-lg border border-[#D8D3C7] text-xs font-semibold text-[#1B4332] disabled:opacity-40" aria-label="Trang sau"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </nav>
  );
};
