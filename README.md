# FreshLeaf Juice - Hệ thống Quản lý Cửa hàng Sinh tố & Nước ép

Đồ án môn học: Xây dựng hệ thống quản lý cho cửa hàng sinh tố và nước ép trái cây tươi tại Việt Nam.

Hệ thống kết hợp giao diện đặt món cho Khách hàng, Quầy bán hàng POS cho Thu ngân, Màn hình hiển thị pha chế (KDS) cho Barista và Bảng điều khiển quản trị doanh thu cho Quản lý.

---

## 🍵 Các phân hệ chính & Vai trò người dùng

### 1. Phân hệ Khách hàng (Storefront & Đặt món)
- **Trang chủ (`/`)**: Khám phá hương vị trái cây tươi tự nhiên, các món sinh tố bơ, xoài, dâu tây, nước ép cam sành, dưa hấu cùng chương trình ưu đãi bạn mới.
- **Thực đơn sinh tố & nước ép (`/menu`)**: Danh mục Sinh tố, Nước ép nguyên chất, Combo ưu đãi. Bộ lọc món bán chạy, giá tăng dần, giá giảm dần.
- **Tùy chỉnh món uống**:
  - Kích cỡ: Nhỏ (350ml), Vừa (500ml), Lớn (700ml).
  - Mức đường: Không đường (0%), 30%, 50%, 70%, 100%.
  - Mức đá: Không đá, Ít đá, Bình thường, Nhiều đá.
  - Topping thêm: Hạt chia hữu cơ, Thạch dừa giòn, Trân châu trắng, Sữa chua lên men.
  - Ghi chú riêng cho từng món.
- **Giỏ hàng & Thanh toán**: Chọn hình thức dùng tại quán (chọn số bàn), mang về hoặc giao hàng. Áp dụng mã giảm giá (`TUOIMOINGAY`, `GIAM10K`).
- **Theo dõi đơn hàng (`/track`)**: Cập nhật tiến độ pha chế trực tiếp (Đã nhận đơn &rarr; Đang pha chế &rarr; Món đã sẵn sàng phục vụ) và in hóa đơn nhiệt.

### 2. Phân hệ Thu ngân / Bán hàng (`/pos`)
- **Giao diện POS tối ưu tốc độ**: Tìm kiếm món nhanh, bấm chọn phân loại Sinh tố / Nước ép / Combo.
- **Phiếu đơn hàng hiện tại**: Ghi nhận số bàn, tên khách, số điện thoại, chi tiết độ ngọt, mức đá và ghi chú.
- **Thanh toán đa phương thức**:
  - Tiền mặt (tính tiền thối tự động theo mệnh giá tiền Việt Nam: 50.000 ₫, 100.000 ₫, 200.000 ₫, 500.000 ₫).
  - Chuyển khoản ngân hàng qua mã VietQR.
  - Quẹt thẻ ngân hàng Napas, Visa, Mastercard.
- **Tự động chuyển đơn**: Đơn sau khi thanh toán lập tức xuất hiện trên màn hình Barista KDS.

### 3. Phân hệ Pha chế / Kitchen Display System (`/kds`)
- **Màn hình bếp chuyên dụng**: Hiển thị các phiếu đơn theo thứ tự tiếp nhận, phân loại Đơn mới, Đang pha, Hoàn thành.
- **Hiển thị công thức trực quan**: Nêu rõ dung tích, mức đường %, mức đá, topping và ghi chú dị ứng của khách.
- **Đồng hồ đo thời gian chờ**: Tự động chuyển màu cảnh báo khi đơn chờ quá 5 phút.
- **Thao tác một chạm**: Barista bấm "Bắt đầu pha" và "Hoàn thành món" để báo cho khách nhận nước.

### 4. Phân hệ Quản lý cửa hàng (`/admin`)
- **Tổng quan (`/admin`)**: Theo dõi doanh thu hôm nay, tổng số đơn, giá trị trung bình mỗi ly, biểu đồ doanh thu theo khung giờ bán (sáng, trưa, tối cao điểm).
- **Quản lý thực đơn (`/admin/products`)**: Thêm món mới, cập nhật giá bán VNĐ, nguyên liệu, calo, bật/tắt trạng thái Còn hàng hoặc Tạm hết.
- **Tồn kho nguyên liệu (`/admin/inventory`)**: Quản lý số lượng trái cây tươi (Xoài cát, Bơ sáp, Dâu tây, Cam sành, Dưa hấu, Thơm, Chanh dây...), sữa tươi, đường, đá. Cảnh báo nguyên liệu sắp hết và ghi nhận đợt nhập hàng.
- **Lịch sử đơn hàng (`/admin/orders`)**: Tra cứu toàn bộ hóa đơn bán hàng theo ngày, lọc theo trạng thái và xem lại hóa đơn.
- **Báo cáo doanh thu (`/admin/reports`)**: Tỷ trọng doanh thu theo từng nhóm sản phẩm, tốc độ phục vụ quầy và xuất dữ liệu báo cáo sang file Excel (.CSV).

---

## 🏬 Thông tin cửa hàng mẫu

- **Thương hiệu**: FreshLeaf Juice
- **Địa chỉ**: 268 Nguyễn Trãi, Phường Nguyễn Cư Trinh, Quận 1, TP. Hồ Chí Minh
- **Hotline**: 090 123 4567
- **Giờ mở cửa**: Thứ 2 – Chủ nhật, 07:00 – 22:00
- **Tiền tệ**: Việt Nam Đồng (VNĐ / ₫)

---

## 🛠️ Công nghệ sử dụng

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Font chữ Outfit & Plus Jakarta Sans
- **Routing**: React Router DOM
- **Minh họa đồ uống**: Custom SVG Vectors chuẩn Taste Skill (không phụ thuộc link ảnh ngoài, không sợ lỗi hiển thị)
- **Tầng dịch vụ**: Chuẩn bị sẵn sàng kết nối cơ sở dữ liệu MongoDB/Express trong tương lai (`api.ts`, `authService.ts`, `productService.ts`, `orderService.ts`, `inventoryService.ts`)

---

## 🚀 Khởi chạy ứng dụng

```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install

# 2. Khởi chạy máy chủ phát triển
npm run dev

# 3. Kiểm tra mã nguồn và biên dịch dự án
npm run lint
npm run build
```
