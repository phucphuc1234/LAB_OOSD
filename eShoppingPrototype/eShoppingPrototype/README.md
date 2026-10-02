# eShopping Prototype System (.NET Framework 4.7.2)

Hệ thống Prototype cho quy trình Đặt hàng & Thanh toán e-Shopping theo kiến trúc 3 lớp: UI -> Service/Adapter -> Data.

## Cấu trúc Dự án
- `Database/eShoppingDB.sql`: Script khởi tạo cơ sở dữ liệu SQL Server.
- `eShoppingPrototype/`: Dự án C# WinForms chứa mã nguồn 3 lớp.

## Bảng Truy Vết Yêu Cầu (Requirements Traceability Matrix)
| Mã Req | Mô Tả | UML Class | Form UI / Logic | Service Layer | Bảng CSDL | Mã Test Case |
|---|---|---|---|---|---|---|
| REQ-01 | Tạo đơn đặt hàng | DonDatHang, ChiTietDonHang | FormCheckout | OrderService.TaoDonHang() | DonDatHang, ChiTietDonHang | TC_ORD_01, TC_ORD_02 |
| REQ-02 | Ghi nhận thông tin người nhận | NguoiNhan | txtNguoiNhan* | OrderService (Validation) | DonDatHang (nguoiNhan_*) | TC_ORD_03 |
| REQ-03 | Tính tổng tiền tự động | DonDatHang.tinhTongTien() | dgvCart | OrderService | DonDatHang.tongTriGia | TC_ORD_04 |
| REQ-04 | Thanh toán Thẻ tín dụng | ThanhToan, TheTinDung | txtSoThe | OrderService | ThanhToan, TheTinDung | TC_ORD_05 |

## Hướng dẫn Chạy
1. Chạy file `Database/eShoppingDB.sql` trong SQL Server Management Studio (SSMS).
2. Mở `eShoppingPrototype.sln` bằng Visual Studio 2019/2022.
3. Kiểm tra chuỗi kết nối trong `App.config`.
4. Nhấn **F5** để chạy ứng dụng.
