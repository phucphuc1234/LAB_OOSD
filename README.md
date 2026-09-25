# LAB 3 - HỆ THỐNG QUẢN LÝ KHÁCH SẠN

## 1. Thông tin sinh viên

- **Họ và tên:** Phan Trọng Phúc
- **MSSV:** 1250080148
- **Tên bài Lab:** LAB 3 - Hệ thống quản lý khách sạn

---

## 2. Công cụ và môi trường

- **Hệ quản trị cơ sở dữ liệu:** Microsoft SQL Server
- **Công cụ quản lý CSDL:** SQL Server Management Studio (SSMS)
- **Tên cơ sở dữ liệu:** `QuanLyKhachSan`
- **Ngôn ngữ lập trình:** C#
- **Giao diện:** Windows Forms
- **Framework:** .NET Framework 4.7.2
- **IDE:** Visual Studio 2022
- **Lớp kết nối dữ liệu:** `Data/Db.cs`

---

## 3. Nội dung đã thực hiện

### 3.1. Thiết kế cơ sở dữ liệu

Đã xây dựng cơ sở dữ liệu `QuanLyKhachSan` trên SQL Server.

Các bảng đã thực hiện:

1. `NhanVien`
2. `KhuVuc`
3. `Phong`
4. `LoaiTienNghi`
5. `TienNghi`
6. `PhieuLapDat`
7. `KhachHang`
8. `PhieuDatPhong`
9. `ChiTietDatPhong`
10. `NguoiLuuTru`
11. `DichVu`
12. `PhieuSuDungDV`
13. `ChiTietPhieuSuDungDV`
14. `QuyDinhDenBu`
15. `PhieuDenBu`
16. `ChiTietPhieuDenBu`
17. `HoaDon`
18. `ThanhToan`

### 3.2. Ràng buộc dữ liệu

Đã thực hiện các loại ràng buộc:

- `PRIMARY KEY`
- `FOREIGN KEY`
- `UNIQUE`
- `CHECK`
- `DEFAULT`
- Khóa chính ghép đối với các bảng chi tiết.
- Tạo các `INDEX` phục vụ truy vấn.

Một số quy tắc đã cài đặt:

- Số người tối đa của phòng phải lớn hơn 0.
- Đơn giá phòng không được âm.
- Ngày trả dự kiến phải lớn hơn hoặc bằng ngày nhận.
- Một thiết bị không được lắp cho hai phòng trong cùng một ngày.
- Một dịch vụ cùng phòng trong cùng ngày được gom vào một phiếu.
- Hình thức thanh toán chỉ gồm: Tiền mặt, Chuyển khoản, Thẻ, Ví điện tử.

### 3.3. Dữ liệu mẫu

Đã thêm dữ liệu mẫu cho các bảng danh mục như:

- Nhân viên
- Khu vực
- Phòng
- Loại tiện nghi
- Tiện nghi
- Dịch vụ
- Quy định đền bù

### 3.4. Xây dựng giao diện Windows Forms

Đã tạo cấu trúc project:

```text
QuanLyKhachSan
├── Data
├── Services
├── Forms
├── App.config
└── Program.cs
