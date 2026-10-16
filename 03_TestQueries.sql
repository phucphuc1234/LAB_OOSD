USE QuanLyHoSoBenhAn;
GO

PRINT N'TC01 - đăng ký lần đầu + lệ phí + hồ sơ';
SELECT bn.MaBenhNhan,bn.HoTen,pdk.MaPhieuDangKy,lp.NamApDung,lp.SoTien,hs.MaHoSoCode
FROM dbo.BENHNHAN bn
JOIN dbo.PHIEUDANGKY pdk ON pdk.MaBenhNhan=bn.MaBenhNhan
JOIN dbo.LEPHINAM lp ON lp.MaBenhNhan=bn.MaBenhNhan
JOIN dbo.HOSOBENHAN hs ON hs.MaBenhNhan=bn.MaBenhNhan;
GO

PRINT N'TC02 - trùng điện thoại phải rollback';
BEGIN TRY
    EXEC dbo.sp_DangKyLanDau N'Người trùng',N'TP.HCM','2000-01-01','0909000001',NULL,1200000;
END TRY
BEGIN CATCH
    SELECT ERROR_MESSAGE() ExpectedError;
END CATCH;
GO

PRINT N'TC03 - tra cứu lịch sử';
SELECT hs.MaHoSoCode,bn.HoTen,pk.MaPhieuKham,pk.NgayGioKham,bs.HoTen BacSi,k.TenKhoa,
       pk.TrieuChung,pk.ChanDoan,pk.TrangThai
FROM dbo.HOSOBENHAN hs
JOIN dbo.BENHNHAN bn ON bn.MaBenhNhan=hs.MaBenhNhan
LEFT JOIN dbo.PHIEUKHAM pk ON pk.MaHoSo=hs.MaHoSo
LEFT JOIN dbo.BACSI bs ON bs.MaBacSi=pk.MaBacSi
LEFT JOIN dbo.KHOADIEUTRI k ON k.MaKhoa=pk.MaKhoa;
GO

PRINT N'TC04 - lịch định kỳ theo quý';
DECLARE @MaBenhNhan INT=(SELECT TOP 1 MaBenhNhan FROM dbo.BENHNHAN ORDER BY MaBenhNhan);
DELETE FROM dbo.LICHHEN WHERE MaBenhNhan=@MaBenhNhan AND LoaiKham=N'Định kỳ' AND Nam=2026 AND Quy=4;
INSERT dbo.LICHHEN(MaBenhNhan,NgayGioHen,LoaiKham,Nam,Quy,GhiChu)
VALUES(@MaBenhNhan,'2026-11-20T08:00:00',N'Định kỳ',2026,4,N'Khám định kỳ quý 4');
GO

PRINT N'TC05 - trùng lịch định kỳ cùng quý phải lỗi';
BEGIN TRY
    DECLARE @MaBenhNhan2 INT=(SELECT TOP 1 MaBenhNhan FROM dbo.BENHNHAN ORDER BY MaBenhNhan);
    INSERT dbo.LICHHEN(MaBenhNhan,NgayGioHen,LoaiKham,Nam,Quy)
    VALUES(@MaBenhNhan2,'2026-12-01T08:00:00',N'Định kỳ',2026,4);
END TRY
BEGIN CATCH
    SELECT ERROR_MESSAGE() ExpectedError;
END CATCH;
GO

PRINT N'TC06/07 - xét nghiệm/toa liên kết phiếu khám';
SELECT pk.MaPhieuKham,xn.MaXetNghiem,xn.TenXetNghiem,tt.MaToa,ct.TenThuoc
FROM dbo.PHIEUKHAM pk
LEFT JOIN dbo.XETNGHIEM xn ON xn.MaPhieuKham=pk.MaPhieuKham
LEFT JOIN dbo.TOATHUOC tt ON tt.MaPhieuKham=pk.MaPhieuKham
LEFT JOIN dbo.CHITIETTOATHUOC ct ON ct.MaToa=tt.MaToa;
GO

PRINT N'TC08 - không cho hoàn tất khi chưa thanh toán';
BEGIN TRY
    DECLARE @MaChuaTT INT=(SELECT TOP 1 pk.MaPhieuKham FROM dbo.PHIEUKHAM pk LEFT JOIN dbo.THANHTOANVIENPHI t ON t.MaPhieuKham=pk.MaPhieuKham WHERE t.MaThanhToan IS NULL);
    IF @MaChuaTT IS NOT NULL UPDATE dbo.PHIEUKHAM SET TrangThai=N'Hoàn tất' WHERE MaPhieuKham=@MaChuaTT;
END TRY
BEGIN CATCH
    SELECT ERROR_MESSAGE() ExpectedError;
END CATCH;
GO

PRINT N'TC09 - thanh toán rồi hoàn tất';
DECLARE @MaPK INT=(SELECT TOP 1 MaPhieuKham FROM dbo.PHIEUKHAM WHERE TrangThai<>N'Hoàn tất');
IF @MaPK IS NOT NULL
    EXEC dbo.sp_ThanhToanVaHoanTatPhieuKham @MaPK,500000,N'Đã thu đủ viện phí';
SELECT pk.MaPhieuKham,pk.TrangThai,tt.SoTien,tt.TrangThai TrangThaiThanhToan
FROM dbo.PHIEUKHAM pk
LEFT JOIN dbo.THANHTOANVIENPHI tt ON tt.MaPhieuKham=pk.MaPhieuKham;
GO
