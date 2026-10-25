# Từ điển dữ liệu

Các cột mã liên kết được bổ sung từ association của UML. Khóa chính và FK tham khảo Class_Table_Mapping.md và 01_schema.sql.

## PhongBan

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|maPhongBan|nvarchar(40)|NOT NULL|
|tenPhongBan|nvarchar(500)|NOT NULL|
|loaiDonVi|nvarchar(500)|NOT NULL|
|moTa|nvarchar(500)|NOT NULL|

## ChucVu

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|maChucVu|nvarchar(40)|NOT NULL|
|tenChucVu|nvarchar(500)|NOT NULL|
|moTa|nvarchar(500)|NOT NULL|

## NhanVien

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|maNhanVien|nvarchar(40)|NOT NULL|
|hoTen|nvarchar(500)|NOT NULL|
|ngaySinh|date|NOT NULL|
|gioiTinh|nvarchar(500)|NOT NULL|
|diaChi|nvarchar(500)|NOT NULL|
|soDienThoai|nvarchar(500)|NOT NULL|
|ngayVaoLam|date|NOT NULL|
|trangThai|nvarchar(500)|NOT NULL|
|maPhongBan|nvarchar(40)|NOT NULL|

## QuyetDinh

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|soQuyetDinh|nvarchar(40)|NOT NULL|
|ngayKy|date|NULL|
|ngayHieuLuc|date|NOT NULL|
|noiDung|nvarchar(500)|NOT NULL|
|nguoiKy|nvarchar(500)|NULL|
|trangThai|nvarchar(500)|NOT NULL|

## QuyetDinhTuyenDung

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|soQuyetDinh|nvarchar(40)|NOT NULL|
|ngayBatDauThuViec|date|NOT NULL|
|ngayKetThucThuViec|date|NOT NULL|
|mucLuongThuViec|decimal(18,2)|NOT NULL|
|dieuKhoanHaiBen|nvarchar(500)|NOT NULL|
|ketQuaThuViec|nvarchar(500)|NOT NULL|
|maNhanVien|nvarchar(40)|NOT NULL|
|maPhongBan|nvarchar(40)|NOT NULL|

## QuyetDinhChucVu

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|soQuyetDinh|nvarchar(40)|NOT NULL|
|phuCapChucVu|decimal(18,2)|NOT NULL|
|ngayKetThucHieuLuc|date|NULL|
|lyDoBoNhiem|nvarchar(500)|NOT NULL|
|maNhanVien|nvarchar(40)|NOT NULL|
|maChucVu|nvarchar(40)|NOT NULL|

## QuyetDinhLuong

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|soQuyetDinh|nvarchar(40)|NOT NULL|
|mucLuongCoBan|decimal(18,2)|NOT NULL|
|phuCapLuong|decimal(18,2)|NOT NULL|
|phuCapDocHai|decimal(18,2)|NOT NULL|
|ngayKetThucHieuLuc|date|NULL|
|lyDoDieuChinh|nvarchar(500)|NOT NULL|
|maNhanVien|nvarchar(40)|NOT NULL|

## QuyetDinhKhenThuong

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|soQuyetDinh|nvarchar(40)|NOT NULL|
|loaiDoiTuong|nvarchar(500)|NOT NULL|
|lyDoKhenThuong|nvarchar(500)|NOT NULL|
|hinhThucKhenThuong|nvarchar(500)|NOT NULL|
|soTienThuong|decimal(18,2)|NOT NULL|
|phuongThucChi|nvarchar(500)|NOT NULL|
|maNhanVien|nvarchar(40)|NULL|
|maPhongBan|nvarchar(40)|NULL|

## QuyetDinhKyLuat

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|soQuyetDinh|nvarchar(40)|NOT NULL|
|loaiDoiTuong|nvarchar(500)|NOT NULL|
|lyDoKyLuat|nvarchar(500)|NOT NULL|
|hinhThucKyLuat|nvarchar(500)|NOT NULL|
|soTienPhat|decimal(18,2)|NOT NULL|
|phuongThucThu|nvarchar(500)|NOT NULL|
|maNhanVien|nvarchar(40)|NULL|
|maPhongBan|nvarchar(40)|NULL|

## HopDongLaoDong

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|soHopDong|nvarchar(40)|NOT NULL|
|loaiHopDong|nvarchar(500)|NOT NULL|
|ngayKy|date|NOT NULL|
|ngayBatDau|date|NOT NULL|
|ngayKetThuc|date|NULL|
|noiDung|nvarchar(500)|NOT NULL|
|trangThai|nvarchar(500)|NOT NULL|
|maNhanVien|nvarchar(40)|NOT NULL|

## HoSoBaoHiem

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|maHoSoBaoHiem|nvarchar(40)|NOT NULL|
|soBaoHiem|nvarchar(500)|NOT NULL|
|loaiBaoHiem|nvarchar(500)|NOT NULL|
|ngayBatDau|date|NOT NULL|
|ngayKetThuc|date|NULL|
|mucLuongLamCanCu|decimal(18,2)|NOT NULL|
|tyLeDongNhanVien|decimal(18,2)|NOT NULL|
|trangThai|nvarchar(500)|NOT NULL|
|maNhanVien|nvarchar(40)|NOT NULL|
|soHopDong|nvarchar(40)|NOT NULL|

## CaLamViec

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|maCa|nvarchar(40)|NOT NULL|
|tenCa|nvarchar(500)|NOT NULL|
|gioBatDau|time|NOT NULL|
|gioKetThuc|time|NOT NULL|
|soGioLamViec|decimal(18,2)|NOT NULL|

## KeHoachPhanCong

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|maKeHoach|nvarchar(40)|NOT NULL|
|ngayLap|date|NOT NULL|
|ngayBatDauTuan|date|NOT NULL|
|ngayKetThucTuan|date|NOT NULL|
|trangThai|nvarchar(500)|NOT NULL|
|ghiChu|nvarchar(500)|NOT NULL|
|maPhongBan|nvarchar(40)|NOT NULL|
|maNguoiLap|nvarchar(40)|NOT NULL|

## ChiTietPhanCong

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|maChiTietPhanCong|nvarchar(40)|NOT NULL|
|ngayLamViec|date|NOT NULL|
|congViec|nvarchar(500)|NOT NULL|
|soGioPhuTroiDuKien|decimal(18,2)|NOT NULL|
|hinhThucPhuTroiDuKien|nvarchar(500)|NOT NULL|
|ghiChu|nvarchar(500)|NOT NULL|
|maKeHoach|nvarchar(40)|NOT NULL|
|maNhanVien|nvarchar(40)|NOT NULL|
|maCa|nvarchar(40)|NOT NULL|

## BangChamCong

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|maBangChamCong|nvarchar(40)|NOT NULL|
|thang|int|NOT NULL|
|nam|int|NOT NULL|
|ngayLap|date|NOT NULL|
|trangThai|nvarchar(500)|NOT NULL|
|maPhongBan|nvarchar(40)|NOT NULL|

## ChiTietChamCong

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|maChiTietChamCong|nvarchar(40)|NOT NULL|
|ngayChamCong|date|NOT NULL|
|gioVao|time|NULL|
|gioRa|time|NULL|
|soGioLamThucTe|decimal(18,2)|NOT NULL|
|trangThaiDiLam|nvarchar(500)|NOT NULL|
|ghiChu|nvarchar(500)|NOT NULL|
|maBangChamCong|nvarchar(40)|NOT NULL|
|maNhanVien|nvarchar(40)|NOT NULL|
|maCa|nvarchar(40)|NOT NULL|

## PhieuPhuTroi

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|soPhieuPhuTroi|nvarchar(40)|NOT NULL|
|ngayLap|date|NOT NULL|
|ngayPhuTroi|date|NOT NULL|
|hinhThucPhuTroi|nvarchar(500)|NOT NULL|
|soGioPhuTroi|decimal(18,2)|NOT NULL|
|heSoTinhLuong|decimal(18,2)|NOT NULL|
|trangThai|nvarchar(500)|NOT NULL|

## ChiTietPhuTroi

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|maChiTietPhuTroi|nvarchar(40)|NOT NULL|
|soGioThucTe|decimal(18,2)|NOT NULL|
|donGiaGioThuong|decimal(18,2)|NOT NULL|
|thanhTien|decimal(18,2)|NOT NULL|
|ghiChu|nvarchar(500)|NOT NULL|
|soPhieuPhuTroi|nvarchar(40)|NOT NULL|
|maNhanVien|nvarchar(40)|NOT NULL|

## BangLuong

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|maBangLuong|nvarchar(40)|NOT NULL|
|thang|int|NOT NULL|
|nam|int|NOT NULL|
|ngayLap|date|NOT NULL|
|tongLuong|decimal(18,2)|NOT NULL|
|trangThai|nvarchar(500)|NOT NULL|
|soGioCongChuan|decimal(18,2)|NOT NULL DEFAULT 208|

## ChiTietBangLuong

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|maChiTietLuong|nvarchar(40)|NOT NULL|
|luongCoBanApDung|decimal(18,2)|NOT NULL|
|soGioCongChuan|decimal(18,2)|NOT NULL|
|soGioCongThucTe|decimal(18,2)|NOT NULL|
|luongTheoCong|decimal(18,2)|NOT NULL|
|phuCapChucVu|decimal(18,2)|NOT NULL|
|phuCapLuong|decimal(18,2)|NOT NULL|
|phuCapDocHai|decimal(18,2)|NOT NULL|
|tienPhuTroi|decimal(18,2)|NOT NULL|
|tienThuongQuaLuong|decimal(18,2)|NOT NULL|
|tienPhatTruLuong|decimal(18,2)|NOT NULL|
|khauTruBHYT|decimal(18,2)|NOT NULL|
|khauTruBHXH|decimal(18,2)|NOT NULL|
|thucLinh|decimal(18,2)|NOT NULL|
|maBangLuong|nvarchar(40)|NOT NULL|
|maNhanVien|nvarchar(40)|NOT NULL|

## PhieuChiKhenThuong

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|soPhieuChi|nvarchar(40)|NOT NULL|
|ngayLap|date|NOT NULL|
|ngayChi|date|NULL|
|soTien|decimal(18,2)|NOT NULL|
|noiDungChi|nvarchar(500)|NOT NULL|
|phuongThucChi|nvarchar(500)|NOT NULL|
|trangThai|nvarchar(500)|NOT NULL|
|soQuyetDinh|nvarchar(40)|NOT NULL|

## PhieuThuNopPhat

|Cột|Kiểu SQL Server|Nullable / mặc định|
|---|---|---|
|soPhieuThu|nvarchar(40)|NOT NULL|
|ngayLap|date|NOT NULL|
|ngayThu|date|NULL|
|soTien|decimal(18,2)|NOT NULL|
|noiDungThu|nvarchar(500)|NOT NULL|
|phuongThucThu|nvarchar(500)|NOT NULL|
|trangThai|nvarchar(500)|NOT NULL|
|soQuyetDinh|nvarchar(40)|NOT NULL|

Bổ sung: maChiTietLuong nullable trên nguồn công/phụ trội; PhanBoThuong/PhanBoPhat giữ số tiền từng nhân viên và liên kết lương; CanCuLuong/CanCuBaoHiem lưu căn cứ.