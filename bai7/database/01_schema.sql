USE master;
GO
IF DB_ID(N'QuanLyNhanSuDongA') IS NULL CREATE DATABASE QuanLyNhanSuDongA;
GO
USE QuanLyNhanSuDongA;
GO
-- Run on a new empty database. Never drops existing data.
CREATE TABLE dbo.[PhongBan](
 [maPhongBan] nvarchar(40) NOT NULL,
 [tenPhongBan] nvarchar(500) NOT NULL,
 [loaiDonVi] nvarchar(500) NOT NULL,
 [moTa] nvarchar(500) NOT NULL,
 PRIMARY KEY ([maPhongBan])
);
GO
CREATE TABLE dbo.[ChucVu](
 [maChucVu] nvarchar(40) NOT NULL,
 [tenChucVu] nvarchar(500) NOT NULL,
 [moTa] nvarchar(500) NOT NULL,
 PRIMARY KEY ([maChucVu])
);
GO
CREATE TABLE dbo.[NhanVien](
 [maNhanVien] nvarchar(40) NOT NULL,
 [hoTen] nvarchar(500) NOT NULL,
 [ngaySinh] date NOT NULL,
 [gioiTinh] nvarchar(500) NOT NULL,
 [diaChi] nvarchar(500) NOT NULL,
 [soDienThoai] nvarchar(500) NOT NULL,
 [ngayVaoLam] date NOT NULL,
 [trangThai] nvarchar(500) NOT NULL,
 [maPhongBan] nvarchar(40) NOT NULL,
 PRIMARY KEY ([maNhanVien]),
 FOREIGN KEY ([maPhongBan]) REFERENCES [PhongBan]([maPhongBan])
);
GO
CREATE TABLE dbo.[QuyetDinh](
 [soQuyetDinh] nvarchar(40) NOT NULL,
 [ngayKy] date NULL,
 [ngayHieuLuc] date NOT NULL,
 [noiDung] nvarchar(500) NOT NULL,
 [nguoiKy] nvarchar(500) NULL,
 [trangThai] nvarchar(500) NOT NULL,
 PRIMARY KEY ([soQuyetDinh])
);
GO
CREATE TABLE dbo.[QuyetDinhTuyenDung](
 [soQuyetDinh] nvarchar(40) NOT NULL,
 [ngayBatDauThuViec] date NOT NULL,
 [ngayKetThucThuViec] date NOT NULL,
 [mucLuongThuViec] decimal(18,2) NOT NULL,
 [dieuKhoanHaiBen] nvarchar(500) NOT NULL,
 [ketQuaThuViec] nvarchar(500) NOT NULL,
 [maNhanVien] nvarchar(40) NOT NULL,
 [maPhongBan] nvarchar(40) NOT NULL,
 PRIMARY KEY ([soQuyetDinh]),
 CHECK ([mucLuongThuViec]>=0),
 FOREIGN KEY ([maNhanVien]) REFERENCES [NhanVien]([maNhanVien]),
 FOREIGN KEY ([maPhongBan]) REFERENCES [PhongBan]([maPhongBan]),
 FOREIGN KEY (soQuyetDinh) REFERENCES QuyetDinh(soQuyetDinh)
);
GO
CREATE TABLE dbo.[QuyetDinhChucVu](
 [soQuyetDinh] nvarchar(40) NOT NULL,
 [phuCapChucVu] decimal(18,2) NOT NULL,
 [ngayKetThucHieuLuc] date NULL,
 [lyDoBoNhiem] nvarchar(500) NOT NULL,
 [maNhanVien] nvarchar(40) NOT NULL,
 [maChucVu] nvarchar(40) NOT NULL,
 PRIMARY KEY ([soQuyetDinh]),
 CHECK ([phuCapChucVu]>=0),
 FOREIGN KEY ([maNhanVien]) REFERENCES [NhanVien]([maNhanVien]),
 FOREIGN KEY ([maChucVu]) REFERENCES [ChucVu]([maChucVu]),
 FOREIGN KEY (soQuyetDinh) REFERENCES QuyetDinh(soQuyetDinh)
);
GO
CREATE TABLE dbo.[QuyetDinhLuong](
 [soQuyetDinh] nvarchar(40) NOT NULL,
 [mucLuongCoBan] decimal(18,2) NOT NULL,
 [phuCapLuong] decimal(18,2) NOT NULL,
 [phuCapDocHai] decimal(18,2) NOT NULL,
 [ngayKetThucHieuLuc] date NULL,
 [lyDoDieuChinh] nvarchar(500) NOT NULL,
 [maNhanVien] nvarchar(40) NOT NULL,
 PRIMARY KEY ([soQuyetDinh]),
 CHECK ([mucLuongCoBan]>=0),
 CHECK ([phuCapLuong]>=0),
 CHECK ([phuCapDocHai]>=0),
 FOREIGN KEY ([maNhanVien]) REFERENCES [NhanVien]([maNhanVien]),
 FOREIGN KEY (soQuyetDinh) REFERENCES QuyetDinh(soQuyetDinh)
);
GO
CREATE TABLE dbo.[QuyetDinhKhenThuong](
 [soQuyetDinh] nvarchar(40) NOT NULL,
 [loaiDoiTuong] nvarchar(500) NOT NULL,
 [lyDoKhenThuong] nvarchar(500) NOT NULL,
 [hinhThucKhenThuong] nvarchar(500) NOT NULL,
 [soTienThuong] decimal(18,2) NOT NULL,
 [phuongThucChi] nvarchar(500) NOT NULL,
 [maNhanVien] nvarchar(40) NULL,
 [maPhongBan] nvarchar(40) NULL,
 PRIMARY KEY ([soQuyetDinh]),
 CHECK ([soTienThuong]>=0),
 FOREIGN KEY (soQuyetDinh) REFERENCES QuyetDinh(soQuyetDinh)
);
GO
CREATE TABLE dbo.[QuyetDinhKyLuat](
 [soQuyetDinh] nvarchar(40) NOT NULL,
 [loaiDoiTuong] nvarchar(500) NOT NULL,
 [lyDoKyLuat] nvarchar(500) NOT NULL,
 [hinhThucKyLuat] nvarchar(500) NOT NULL,
 [soTienPhat] decimal(18,2) NOT NULL,
 [phuongThucThu] nvarchar(500) NOT NULL,
 [maNhanVien] nvarchar(40) NULL,
 [maPhongBan] nvarchar(40) NULL,
 PRIMARY KEY ([soQuyetDinh]),
 CHECK ([soTienPhat]>=0),
 FOREIGN KEY (soQuyetDinh) REFERENCES QuyetDinh(soQuyetDinh)
);
GO
CREATE TABLE dbo.[HopDongLaoDong](
 [soHopDong] nvarchar(40) NOT NULL,
 [loaiHopDong] nvarchar(500) NOT NULL,
 [ngayKy] date NOT NULL,
 [ngayBatDau] date NOT NULL,
 [ngayKetThuc] date NULL,
 [noiDung] nvarchar(500) NOT NULL,
 [trangThai] nvarchar(500) NOT NULL,
 [maNhanVien] nvarchar(40) NOT NULL,
 PRIMARY KEY ([soHopDong]),
 FOREIGN KEY ([maNhanVien]) REFERENCES [NhanVien]([maNhanVien])
);
GO
CREATE TABLE dbo.[HoSoBaoHiem](
 [maHoSoBaoHiem] nvarchar(40) NOT NULL,
 [soBaoHiem] nvarchar(500) NOT NULL,
 [loaiBaoHiem] nvarchar(500) NOT NULL,
 [ngayBatDau] date NOT NULL,
 [ngayKetThuc] date NULL,
 [mucLuongLamCanCu] decimal(18,2) NOT NULL,
 [tyLeDongNhanVien] decimal(18,2) NOT NULL,
 [trangThai] nvarchar(500) NOT NULL,
 [maNhanVien] nvarchar(40) NOT NULL,
 [soHopDong] nvarchar(40) NOT NULL,
 PRIMARY KEY ([maHoSoBaoHiem]),
 CHECK ([mucLuongLamCanCu]>=0),
 CHECK ([tyLeDongNhanVien]>=0),
 FOREIGN KEY ([maNhanVien]) REFERENCES [NhanVien]([maNhanVien]),
 FOREIGN KEY ([soHopDong]) REFERENCES [HopDongLaoDong]([soHopDong])
);
GO
CREATE TABLE dbo.[CaLamViec](
 [maCa] nvarchar(40) NOT NULL,
 [tenCa] nvarchar(500) NOT NULL,
 [gioBatDau] time NOT NULL,
 [gioKetThuc] time NOT NULL,
 [soGioLamViec] decimal(18,2) NOT NULL,
 PRIMARY KEY ([maCa]),
 CHECK ([soGioLamViec]>=0)
);
GO
CREATE TABLE dbo.[KeHoachPhanCong](
 [maKeHoach] nvarchar(40) NOT NULL,
 [ngayLap] date NOT NULL,
 [ngayBatDauTuan] date NOT NULL,
 [ngayKetThucTuan] date NOT NULL,
 [trangThai] nvarchar(500) NOT NULL,
 [ghiChu] nvarchar(500) NOT NULL,
 [maPhongBan] nvarchar(40) NOT NULL,
 [maNguoiLap] nvarchar(40) NOT NULL,
 PRIMARY KEY ([maKeHoach]),
 FOREIGN KEY ([maPhongBan]) REFERENCES [PhongBan]([maPhongBan]),
 FOREIGN KEY ([maNguoiLap]) REFERENCES [NhanVien]([maNhanVien])
);
GO
CREATE TABLE dbo.[ChiTietPhanCong](
 [maChiTietPhanCong] nvarchar(40) NOT NULL,
 [ngayLamViec] date NOT NULL,
 [congViec] nvarchar(500) NOT NULL,
 [soGioPhuTroiDuKien] decimal(18,2) NOT NULL,
 [hinhThucPhuTroiDuKien] nvarchar(500) NOT NULL,
 [ghiChu] nvarchar(500) NOT NULL,
 [maKeHoach] nvarchar(40) NOT NULL,
 [maNhanVien] nvarchar(40) NOT NULL,
 [maCa] nvarchar(40) NOT NULL,
 PRIMARY KEY ([maChiTietPhanCong]),
 CHECK ([soGioPhuTroiDuKien]>=0),
 FOREIGN KEY ([maKeHoach]) REFERENCES [KeHoachPhanCong]([maKeHoach]),
 FOREIGN KEY ([maNhanVien]) REFERENCES [NhanVien]([maNhanVien]),
 FOREIGN KEY ([maCa]) REFERENCES [CaLamViec]([maCa])
);
GO
CREATE TABLE dbo.[BangChamCong](
 [maBangChamCong] nvarchar(40) NOT NULL,
 [thang] int NOT NULL,
 [nam] int NOT NULL,
 [ngayLap] date NOT NULL,
 [trangThai] nvarchar(500) NOT NULL,
 [maPhongBan] nvarchar(40) NOT NULL,
 PRIMARY KEY ([maBangChamCong]),
 CHECK (thang BETWEEN 1 AND 12),
 CHECK (nam BETWEEN 2000 AND 2100),
 FOREIGN KEY ([maPhongBan]) REFERENCES [PhongBan]([maPhongBan])
);
GO
CREATE TABLE dbo.[ChiTietChamCong](
 [maChiTietChamCong] nvarchar(40) NOT NULL,
 [ngayChamCong] date NOT NULL,
 [gioVao] time NULL,
 [gioRa] time NULL,
 [soGioLamThucTe] decimal(18,2) NOT NULL,
 [trangThaiDiLam] nvarchar(500) NOT NULL,
 [ghiChu] nvarchar(500) NOT NULL,
 [maBangChamCong] nvarchar(40) NOT NULL,
 [maNhanVien] nvarchar(40) NOT NULL,
 [maCa] nvarchar(40) NOT NULL,
 PRIMARY KEY ([maChiTietChamCong]),
 CHECK ([soGioLamThucTe]>=0),
 FOREIGN KEY ([maBangChamCong]) REFERENCES [BangChamCong]([maBangChamCong]),
 FOREIGN KEY ([maNhanVien]) REFERENCES [NhanVien]([maNhanVien]),
 FOREIGN KEY ([maCa]) REFERENCES [CaLamViec]([maCa])
);
GO
CREATE TABLE dbo.[PhieuPhuTroi](
 [soPhieuPhuTroi] nvarchar(40) NOT NULL,
 [ngayLap] date NOT NULL,
 [ngayPhuTroi] date NOT NULL,
 [hinhThucPhuTroi] nvarchar(500) NOT NULL,
 [soGioPhuTroi] decimal(18,2) NOT NULL,
 [heSoTinhLuong] decimal(18,2) NOT NULL,
 [trangThai] nvarchar(500) NOT NULL,
 PRIMARY KEY ([soPhieuPhuTroi]),
 CHECK ([soGioPhuTroi]>=0),
 CHECK ([heSoTinhLuong]>=0)
);
GO
CREATE TABLE dbo.[ChiTietPhuTroi](
 [maChiTietPhuTroi] nvarchar(40) NOT NULL,
 [soGioThucTe] decimal(18,2) NOT NULL,
 [donGiaGioThuong] decimal(18,2) NOT NULL,
 [thanhTien] decimal(18,2) NOT NULL,
 [ghiChu] nvarchar(500) NOT NULL,
 [soPhieuPhuTroi] nvarchar(40) NOT NULL,
 [maNhanVien] nvarchar(40) NOT NULL,
 PRIMARY KEY ([maChiTietPhuTroi]),
 CHECK ([soGioThucTe]>=0),
 CHECK ([donGiaGioThuong]>=0),
 CHECK ([thanhTien]>=0),
 FOREIGN KEY ([soPhieuPhuTroi]) REFERENCES [PhieuPhuTroi]([soPhieuPhuTroi]),
 FOREIGN KEY ([maNhanVien]) REFERENCES [NhanVien]([maNhanVien])
);
GO
CREATE TABLE dbo.[BangLuong](
 [maBangLuong] nvarchar(40) NOT NULL,
 [thang] int NOT NULL,
 [nam] int NOT NULL,
 [ngayLap] date NOT NULL,
 [tongLuong] decimal(18,2) NOT NULL,
 [trangThai] nvarchar(500) NOT NULL,
 [soGioCongChuan] decimal(18,2) NOT NULL DEFAULT 208,
 PRIMARY KEY ([maBangLuong]),
 CHECK ([tongLuong]>=0),
 CHECK ([soGioCongChuan]>=0),
 CHECK (thang BETWEEN 1 AND 12),
 CHECK (nam BETWEEN 2000 AND 2100)
);
GO
CREATE TABLE dbo.[ChiTietBangLuong](
 [maChiTietLuong] nvarchar(40) NOT NULL,
 [luongCoBanApDung] decimal(18,2) NOT NULL,
 [soGioCongChuan] decimal(18,2) NOT NULL,
 [soGioCongThucTe] decimal(18,2) NOT NULL,
 [luongTheoCong] decimal(18,2) NOT NULL,
 [phuCapChucVu] decimal(18,2) NOT NULL,
 [phuCapLuong] decimal(18,2) NOT NULL,
 [phuCapDocHai] decimal(18,2) NOT NULL,
 [tienPhuTroi] decimal(18,2) NOT NULL,
 [tienThuongQuaLuong] decimal(18,2) NOT NULL,
 [tienPhatTruLuong] decimal(18,2) NOT NULL,
 [khauTruBHYT] decimal(18,2) NOT NULL,
 [khauTruBHXH] decimal(18,2) NOT NULL,
 [thucLinh] decimal(18,2) NOT NULL,
 [maBangLuong] nvarchar(40) NOT NULL,
 [maNhanVien] nvarchar(40) NOT NULL,
 PRIMARY KEY ([maChiTietLuong]),
 CHECK ([luongCoBanApDung]>=0),
 CHECK ([soGioCongChuan]>=0),
 CHECK ([soGioCongThucTe]>=0),
 CHECK ([luongTheoCong]>=0),
 CHECK ([phuCapChucVu]>=0),
 CHECK ([phuCapLuong]>=0),
 CHECK ([phuCapDocHai]>=0),
 CHECK ([tienPhuTroi]>=0),
 CHECK ([tienThuongQuaLuong]>=0),
 CHECK ([tienPhatTruLuong]>=0),
 CHECK ([khauTruBHYT]>=0),
 CHECK ([khauTruBHXH]>=0),
 FOREIGN KEY ([maBangLuong]) REFERENCES [BangLuong]([maBangLuong]),
 FOREIGN KEY ([maNhanVien]) REFERENCES [NhanVien]([maNhanVien])
);
GO
CREATE TABLE dbo.[PhieuChiKhenThuong](
 [soPhieuChi] nvarchar(40) NOT NULL,
 [ngayLap] date NOT NULL,
 [ngayChi] date NULL,
 [soTien] decimal(18,2) NOT NULL,
 [noiDungChi] nvarchar(500) NOT NULL,
 [phuongThucChi] nvarchar(500) NOT NULL,
 [trangThai] nvarchar(500) NOT NULL,
 [soQuyetDinh] nvarchar(40) NOT NULL,
 PRIMARY KEY ([soPhieuChi]),
 CHECK ([soTien]>=0),
 FOREIGN KEY ([soQuyetDinh]) REFERENCES [QuyetDinhKhenThuong]([soQuyetDinh])
);
GO
CREATE TABLE dbo.[PhieuThuNopPhat](
 [soPhieuThu] nvarchar(40) NOT NULL,
 [ngayLap] date NOT NULL,
 [ngayThu] date NULL,
 [soTien] decimal(18,2) NOT NULL,
 [noiDungThu] nvarchar(500) NOT NULL,
 [phuongThucThu] nvarchar(500) NOT NULL,
 [trangThai] nvarchar(500) NOT NULL,
 [soQuyetDinh] nvarchar(40) NOT NULL,
 PRIMARY KEY ([soPhieuThu]),
 CHECK ([soTien]>=0),
 FOREIGN KEY ([soQuyetDinh]) REFERENCES [QuyetDinhKyLuat]([soQuyetDinh])
);
GO