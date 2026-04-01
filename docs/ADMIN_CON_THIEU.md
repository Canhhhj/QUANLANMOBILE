# Admin còn thiếu gì – QUÂN LAN MOBILE

## 1. Trang Chủ

- **“Tổng đơn hàng”** đang là tổng **tất cả đơn** (mọi thời gian), trong khi **“Doanh thu tháng này”** và **4 biểu đồ** chỉ tính **theo tháng**.
  - **Thiếu:** Thêm chỉ số **“Đơn trong tháng”** (hoặc đổi “Tổng đơn hàng” thành “Đơn trong tháng”) để thống nhất với doanh thu và thống kê bán hàng theo tháng.

- **Biểu đồ không tự cập nhật:** Khi admin vào tab Đơn hàng → duyệt/xác nhận đơn → quay lại Trang Chủ thì 4 biểu đồ (Số lượng bán ra, Doanh thu theo hãng, Đơn theo trạng thái, Top 5 SP) **không vẽ lại**; chỉ cập nhật khi tải lại trang.
  - **Thiếu:** Cập nhật lại biểu đồ khi mở tab Trang Chủ (hoặc sau khi duyệt/đã giao đơn).

---

## 2. Đơn hàng

- Đã có: lọc theo khoảng ngày, tìm theo mã đơn / khách / trạng thái, sắp xếp, xem chi tiết, xác nhận đơn, xác nhận đã giao, hủy.
- **Thiếu:** **Lọc nhanh theo trạng thái** (dropdown: Tất cả / Chờ xử lý / Đang đi giao / Đã nhận hàng / Đã hủy) để xem từng nhóm đơn cho nhanh.

---

## 3. Khách hàng

- Đã có: xem danh sách, khóa/mở khóa, xóa, tìm kiếm, sắp xếp.
- **Thiếu:** Nút **“Thêm người dùng”** hiện chỉ báo **“Not Available!”** → chưa có chức năng **thêm khách hàng mới** từ admin (nhập username, mật khẩu, họ tên, email).

---

## 4. Sản phẩm

- Đã có: thêm, sửa, xóa, tìm theo mã/tên, sắp xếp, cảnh báo trước khi xóa.
- **Thiếu (tùy chọn):** **Lọc theo hãng** (dropdown Apple, Samsung, …) để xem từng hãng.

---

## 5. Banner

- Đã có: thêm banner, xóa banner.
- **Thiếu:** **Sửa banner** (đổi ảnh/link). Hiện muốn sửa phải xóa rồi thêm mới.

---

## 6. Dữ liệu & báo cáo

- **Thiếu:** **Xuất dữ liệu** (Excel/CSV): ví dụ xuất danh sách đơn hàng, doanh thu theo tháng để lưu trữ hoặc báo cáo.

---

## 7. Quản lý admin (tùy chọn)

- Đăng nhập admin đang dùng chung form với khách (bạn đã chọn không tách riêng).
- **Thiếu:** Không có màn hình **quản lý tài khoản admin** (đổi mật khẩu admin, thêm/xóa admin). Danh sách admin lưu trong `ListAdmin` (localStorage) nhưng chỉ sửa được qua code/console.

---

## Tóm tắt ưu tiên

| Mức        | Nội dung |
|-----------|----------|
| Nên bổ sung | Đơn trong tháng (Trang Chủ); lọc đơn theo trạng thái; thêm khách hàng từ admin; cập nhật biểu đồ khi quay lại Trang Chủ. |
| Tùy chọn   | Sửa banner; lọc sản phẩm theo hãng; xuất Excel/CSV; quản lý tài khoản admin. |

File này: `DoAn_Web1/ADMIN_CON_THIEU.md`
