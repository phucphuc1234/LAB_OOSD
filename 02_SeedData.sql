USE QuanLyHoSoBenhAn;
GO

INSERT dbo.KHOADIEUTRI(TenKhoa)
VALUES (N'Nội tổng quát'),(N'Tim mạch'),(N'Nhi');
GO

INSERT dbo.BACSI(HoTen,ChuyenMon,MaKhoa,DienThoai)
VALUES
(N'BS. Nguyễn Minh An',N'Nội khoa',1,'0901000001'),
(N'BS. Trần Thu Hà',N'Tim mạch',2,'0901000002'),
(N'BS. Lê Quang Huy',N'Nhi khoa',3,'0901000003');
GO

EXEC dbo.sp_DangKyLanDau
    @HoTen=N'Nguyễn Văn Bình',
    @DiaChi=N'12 Nguyễn Huệ, TP.HCM',
    @NgaySinh='1995-03-12',
    @DienThoai='0909000001',
    @Anh3x4=NULL,
    @SoTienLePhi=1200000;
GO

DECLARE @MaHoSo INT=(SELECT TOP 1 MaHoSo FROM dbo.HOSOBENHAN ORDER BY MaHoSo);
INSERT dbo.PHIEUKHAM(MaHoSo,MaBacSi,MaKhoa,LoaiKham,TrieuChung,ThanNhiet,HuyetAp,ChanDoan,TrangThai)
VALUES(@MaHoSo,1,1,N'Điều trị',N'Đau đầu, mệt mỏi',37.8,'120/80',N'Cảm cúm',N'Chờ thanh toán');
GO

DECLARE @MaPhieuKham INT=(SELECT TOP 1 MaPhieuKham FROM dbo.PHIEUKHAM ORDER BY MaPhieuKham DESC);
INSERT dbo.XETNGHIEM(MaPhieuKham,TenXetNghiem,KetQua,NgayThucHien)
VALUES(@MaPhieuKham,N'Công thức máu',N'Trong giới hạn cho phép',SYSDATETIME());

INSERT dbo.TOATHUOC(MaPhieuKham,HuongDanSuDung)
VALUES(@MaPhieuKham,N'Uống sau ăn');
DECLARE @MaToa INT=SCOPE_IDENTITY();
INSERT dbo.CHITIETTOATHUOC(MaToa,TenThuoc,LieuDung,SoLuong,CachDung)
VALUES
(@MaToa,N'Paracetamol 500mg',N'1 viên/lần',10,N'Ngày 2 lần sau ăn'),
(@MaToa,N'Vitamin C 500mg',N'1 viên/lần',10,N'Ngày 1 lần');
GO
