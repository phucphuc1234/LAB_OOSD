-- 1. Tạo Database
CREATE DATABASE eShoppingDB;
GO
USE eShoppingDB;
GO

-- 2. Bảng KhachHang
CREATE TABLE KhachHang (
    maKH VARCHAR(20) PRIMARY KEY,
    hoTen NVARCHAR(100) NOT NULL,
    ngaySinh DATE,
    cmndPassport VARCHAR(20),
    diaChi NVARCHAR(255),
    dienThoai VARCHAR(15),
    tenDangNhap VARCHAR(50) NOT NULL UNIQUE,
    matKhau VARCHAR(255) NOT NULL,
    email VARCHAR(100)
);

-- 3. Bảng GioHang
CREATE TABLE GioHang (
    maGioHang VARCHAR(20) PRIMARY KEY,
    ngayTao DATE NOT NULL DEFAULT GETDATE(),
    maKH VARCHAR(20) UNIQUE,
    CONSTRAINT FK_GioHang_KhachHang FOREIGN KEY (maKH) REFERENCES KhachHang(maKH) ON DELETE CASCADE
);

-- 4. Bảng NhomSanPham
CREATE TABLE NhomSanPham (
    maNhom VARCHAR(20) PRIMARY KEY,
    tenNhom NVARCHAR(100) NOT NULL
);

-- 5. Bảng SanPham
CREATE TABLE SanPham (
    maSP VARCHAR(20) PRIMARY KEY,
    tenSP NVARCHAR(150) NOT NULL,
    nhaSanXuat NVARCHAR(100),
    hinhAnh VARCHAR(255),
    moTa NVARCHAR(MAX),
    thongSoKyThuat NVARCHAR(MAX),
    giaBan DECIMAL(18, 2) NOT NULL,
    tinhTrang NVARCHAR(50),
    maNhom VARCHAR(20) NOT NULL,
    CONSTRAINT FK_SanPham_NhomSanPham FOREIGN KEY (maNhom) REFERENCES NhomSanPham(maNhom)
);

-- 6. Bảng ChiTietGioHang
CREATE TABLE ChiTietGioHang (
    maGioHang VARCHAR(20),
    maSP VARCHAR(20),
    soLuong INT NOT NULL CHECK (soLuong > 0),
    dongGia DECIMAL(18, 2) NOT NULL,
    PRIMARY KEY (maGioHang, maSP),
    CONSTRAINT FK_ChiTietGioHang_GioHang FOREIGN KEY (maGioHang) REFERENCES GioHang(maGioHang) ON DELETE CASCADE,
    CONSTRAINT FK_ChiTietGioHang_SanPham FOREIGN KEY (maSP) REFERENCES SanPham(maSP)
);

-- 7. Bảng TheTinDung
CREATE TABLE TheTinDung (
    soThe VARCHAR(20) PRIMARY KEY,
    loaiThe NVARCHAR(50) NOT NULL,
    ngayHetHan DATE NOT NULL,
    chuThe NVARCHAR(100) NOT NULL,
    CSV VARCHAR(10) NOT NULL
);

-- 8. Bảng HinhThucGiaoHang
CREATE TABLE HinhThucGiaoHang (
    maHinhThuc VARCHAR(20) PRIMARY KEY,
    tenHinhThuc NVARCHAR(100) NOT NULL,
    donGia DECIMAL(18, 2) NOT NULL,
    thoiGianXuLy NVARCHAR(50)
);

-- 9. Bảng ThanhToan
CREATE TABLE ThanhToan (
    maThanhToan VARCHAR(20) PRIMARY KEY,
    soTien DECIMAL(18, 2) NOT NULL,
    phiThanhToan DECIMAL(18, 2) DEFAULT 0,
    ketQua NVARCHAR(50),
    soThe VARCHAR(20),
    CONSTRAINT FK_ThanhToan_TheTinDung FOREIGN KEY (soThe) REFERENCES TheTinDung(soThe)
);

-- 10. Bảng DonDatHang
CREATE TABLE DonDatHang (
    maDonHang VARCHAR(20) PRIMARY KEY,
    thoiDiemDat DATETIME2 NOT NULL DEFAULT GETDATE(),
    tongTriGia DECIMAL(18, 2) NOT NULL,
    trangThai NVARCHAR(50),
    maKH VARCHAR(20) NOT NULL,
    maHinhThuc VARCHAR(20),
    maThanhToan VARCHAR(20) UNIQUE,
    soThe VARCHAR(20),
    nguoiNhan_hoTen NVARCHAR(100),
    nguoiNhan_diaChi NVARCHAR(255),
    nguoiNhan_dienThoai VARCHAR(15),
    CONSTRAINT FK_DonDatHang_KhachHang FOREIGN KEY (maKH) REFERENCES KhachHang(maKH),
    CONSTRAINT FK_DonDatHang_HinhThucGiaoHang FOREIGN KEY (maHinhThuc) REFERENCES HinhThucGiaoHang(maHinhThuc),
    CONSTRAINT FK_DonDatHang_ThanhToan FOREIGN KEY (maThanhToan) REFERENCES ThanhToan(maThanhToan),
    CONSTRAINT FK_DonDatHang_TheTinDung FOREIGN KEY (soThe) REFERENCES TheTinDung(soThe)
);

-- 11. Bảng ChiTietDonHang
CREATE TABLE ChiTietDonHang (
    maDonHang VARCHAR(20),
    maSP VARCHAR(20),
    soLuong INT NOT NULL CHECK (soLuong > 0),
    dongGia DECIMAL(18, 2) NOT NULL,
    PRIMARY KEY (maDonHang, maSP),
    CONSTRAINT FK_ChiTietDonHang_DonDatHang FOREIGN KEY (maDonHang) REFERENCES DonDatHang(maDonHang) ON DELETE CASCADE,
    CONSTRAINT FK_ChiTietDonHang_SanPham FOREIGN KEY (maSP) REFERENCES SanPham(maSP)
);

-- DỮ LIỆU MẪU (INSERT DATA)
INSERT INTO NhomSanPham (maNhom, tenNhom) VALUES
('NSP01', N'Điện thoại & Máy tính bảng'),
('NSP02', N'Laptop & Máy tính xách tay'),
('NSP03', N'Thiết bị âm thanh');

INSERT INTO SanPham (maSP, tenSP, nhaSanXuat, hinhAnh, moTa, thongSoKyThuat, giaBan, tinhTrang, maNhom) VALUES
('SP01', N'iPhone 15 Pro Max', N'Apple', 'iphone15.jpg', N'Điện thoại cao cấp 6.7 inch', N'RAM 8GB, ROM 256GB', 29990000.00, N'Còn hàng', 'NSP01'),
('SP02', N'Samsung Galaxy S24 Ultra', N'Samsung', 's24ultra.jpg', N'Flagship kèm S-Pen', N'RAM 12GB, ROM 512GB', 31990000.00, N'Còn hàng', 'NSP01'),
('SP03', N'MacBook Air M3', N'Apple', 'macbook_m3.jpg', N'Laptop mỏng nhẹ hiệu năng cao', N'RAM 16GB, SSD 512GB', 32490000.00, N'Còn hàng', 'NSP02'),
('SP04', N'Tai nghe Sony WH-1000XM5', N'Sony', 'sony_xm5.jpg', N'Tai nghe chống ồn chủ động', N'Pin 30 giờ, Bluetooth 5.2', 8490000.00, N'Còn hàng', 'NSP03');

INSERT INTO KhachHang (maKH, hoTen, ngaySinh, cmndPassport, diaChi, dienThoai, tenDangNhap, matKhau, email) VALUES
('KH01', N'Nguyễn Văn An', '1995-05-15', '012345678901', N'123 Lê Lợi, Q.1, TP.HCM', '0901234567', 'nguyenvanan', 'pass123', 'an@gmail.com'),
('KH02', N'Trần Thị Bích', '1998-10-20', '098765432109', N'456 Nguyễn Huệ, Q.1, TP.HCM', '0918765432', 'tranbich', 'pass456', 'bich@gmail.com');

INSERT INTO GioHang (maGioHang, ngayTao, maKH) VALUES
('GH01', '2024-03-01', 'KH01'),
('GH02', '2024-03-02', 'KH02');

INSERT INTO ChiTietGioHang (maGioHang, maSP, soLuong, dongGia) VALUES
('GH01', 'SP01', 1, 29990000.00),
('GH01', 'SP04', 2, 8490000.00),
('GH02', 'SP03', 1, 32490000.00);

INSERT INTO TheTinDung (soThe, loaiThe, ngayHetHan, chuThe, CSV) VALUES
('4111222233334444', N'Visa', '2026-12-31', N'NGUYEN VAN AN', '123'),
('5555666677778888', N'MasterCard', '2027-08-31', N'TRAN THI BICH', '456');

INSERT INTO HinhThucGiaoHang (maHinhThuc, tenHinhThuc, donGia, thoiGianXuLy) VALUES
('HTGH01', N'Giao hàng tiêu chuẩn', 30000.00, N'3-5 ngày'),
('HTGH02', N'Giao hàng hỏa tốc', 70000.00, N'24 giờ');

INSERT INTO ThanhToan (maThanhToan, soTien, phiThanhToan, ketQua, soThe) VALUES
('TT01', 46970000.00, 0.00, N'Thành công', '4111222233334444'),
('TT02', 32490000.00, 0.00, N'Thành công', '5555666677778888');

INSERT INTO DonDatHang (
    maDonHang, thoiDiemDat, tongTriGia, trangThai, maKH, maHinhThuc, maThanhToan, soThe,
    nguoiNhan_hoTen, nguoiNhan_diaChi, nguoiNhan_dienThoai
) VALUES
('DH01', '2024-03-02 10:30:00', 46970000.00, N'Đã thanh toán', 'KH01', 'HTGH01', 'TT01', '4111222233334444',
 N'Nguyễn Văn An', N'123 Lê Lợi, Q.1, TP.HCM', '0901234567');

INSERT INTO ChiTietDonHang (maDonHang, maSP, soLuong, dongGia) VALUES
('DH01', 'SP01', 1, 29990000.00),
('DH01', 'SP04', 2, 8490000.00);
