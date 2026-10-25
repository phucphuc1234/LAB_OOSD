USE QuanLyNhanSuDongA;
GO
CREATE PROCEDURE sp_KyQuyetDinh @id nvarchar(40),@nguoiKy nvarchar(500),@ngay date AS
BEGIN
 SET XACT_ABORT ON; BEGIN TRAN;
 IF NULLIF(LTRIM(RTRIM(@nguoiKy)),N'') IS NULL THROW 51000,N'Nhập người ký.',1;
 IF NOT EXISTS(SELECT 1 FROM QuyetDinh WITH(UPDLOCK,HOLDLOCK) WHERE soQuyetDinh=@id AND trangThai=N'Nhap') THROW 51000,N'Chỉ ký quyết định nháp.',1;
 IF (SELECT (CASE WHEN EXISTS(SELECT 1 FROM QuyetDinhTuyenDung WHERE soQuyetDinh=@id) THEN 1 ELSE 0 END)+(CASE WHEN EXISTS(SELECT 1 FROM QuyetDinhLuong WHERE soQuyetDinh=@id) THEN 1 ELSE 0 END)+(CASE WHEN EXISTS(SELECT 1 FROM QuyetDinhChucVu WHERE soQuyetDinh=@id) THEN 1 ELSE 0 END)+(CASE WHEN EXISTS(SELECT 1 FROM QuyetDinhKhenThuong WHERE soQuyetDinh=@id) THEN 1 ELSE 0 END)+(CASE WHEN EXISTS(SELECT 1 FROM QuyetDinhKyLuat WHERE soQuyetDinh=@id) THEN 1 ELSE 0 END))<>1 THROW 51000,N'Quyết định phải có đúng một loại chi tiết.',1;
 UPDATE QuyetDinh SET trangThai=N'DaKy',nguoiKy=@nguoiKy,ngayKy=@ngay WHERE soQuyetDinh=@id;
 COMMIT;
END;
GO
CREATE PROCEDURE sp_HoanTatHopDong @id nvarchar(40) AS
BEGIN
 SET XACT_ABORT ON; BEGIN TRAN;
 DECLARE @nv nvarchar(40),@loai nvarchar(500);
 SELECT @nv=maNhanVien,@loai=loaiHopDong FROM HopDongLaoDong WITH(UPDLOCK,HOLDLOCK) WHERE soHopDong=@id;
 IF @nv IS NULL THROW 51000,N'Không tìm thấy hợp đồng.',1;
 IF @loai=N'DaiHan' AND (NOT EXISTS(SELECT 1 FROM HoSoBaoHiem WHERE soHopDong=@id AND loaiBaoHiem=N'BHYT') OR NOT EXISTS(SELECT 1 FROM HoSoBaoHiem WHERE soHopDong=@id AND loaiBaoHiem=N'BHXH')) THROW 51000,N'Cần đủ hồ sơ BHYT và BHXH cho hợp đồng dài hạn.',1;
 IF NOT EXISTS(SELECT 1 FROM QuyetDinhLuong l JOIN QuyetDinh q ON q.soQuyetDinh=l.soQuyetDinh WHERE l.maNhanVien=@nv AND q.trangThai=N'DaKy') THROW 51000,N'Cần quyết định lương đã ký.',1;
 UPDATE HopDongLaoDong SET trangThai=N'HieuLuc' WHERE soHopDong=@id;
 UPDATE HoSoBaoHiem SET trangThai=N'HieuLuc' WHERE soHopDong=@id;
 UPDATE NhanVien SET trangThai=N'ChinhThuc' WHERE maNhanVien=@nv;
 COMMIT;
END;
GO
CREATE PROCEDURE sp_TinhLuong @id nvarchar(40) AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON; SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
 BEGIN TRAN;
 DECLARE @start date,@end date,@standard decimal(18,2);
 SELECT @start=DATEFROMPARTS(nam,thang,1),@standard=soGioCongChuan FROM BangLuong WITH(UPDLOCK,HOLDLOCK) WHERE maBangLuong=@id AND trangThai=N'Nhap';
 IF @start IS NULL THROW 51000,N'Bảng lương không tồn tại hoặc đã chốt.',1;
 SET @end=EOMONTH(@start);
 IF EXISTS(SELECT 1 FROM ChiTietBangLuong WHERE maBangLuong=@id) THROW 51000,N'Kỳ đã tính; không cho tính lại để tránh ghi trùng nguồn.',1;
 -- Every daily attendance/OT source requires exactly one effective signed salary decision.
 SELECT c.maNhanVien,c.ngayChamCong ngay,c.soGioLamThucTe gio,CAST(0 AS bit) ot INTO #source FROM ChiTietChamCong c WHERE c.ngayChamCong BETWEEN @start AND @end AND c.maChiTietLuong IS NULL
 UNION ALL SELECT c.maNhanVien,p.ngayPhuTroi,c.soGioThucTe,1 FROM ChiTietPhuTroi c JOIN PhieuPhuTroi p ON p.soPhieuPhuTroi=c.soPhieuPhuTroi WHERE p.ngayPhuTroi BETWEEN @start AND @end AND c.maChiTietLuong IS NULL AND p.trangThai=N'XacNhan';
 IF NOT EXISTS(SELECT 1 FROM #source) THROW 51000,N'Không có dữ liệu công/phụ trội trong kỳ.',1;
 IF EXISTS(SELECT 1 FROM #source s WHERE (SELECT COUNT(*) FROM QuyetDinhLuong l JOIN QuyetDinh q ON q.soQuyetDinh=l.soQuyetDinh WHERE l.maNhanVien=s.maNhanVien AND q.trangThai=N'DaKy' AND q.ngayHieuLuc<=s.ngay AND (l.ngayKetThucHieuLuc IS NULL OR l.ngayKetThucHieuLuc>=s.ngay))<>1) THROW 51000,N'Mỗi ngày công cần đúng một quyết định lương có hiệu lực.',1;
 IF EXISTS(SELECT 1 FROM #source s WHERE (SELECT COUNT(*) FROM QuyetDinhChucVu c JOIN QuyetDinh q ON q.soQuyetDinh=c.soQuyetDinh WHERE c.maNhanVien=s.maNhanVien AND q.trangThai=N'DaKy' AND q.ngayHieuLuc<=s.ngay AND (c.ngayKetThucHieuLuc IS NULL OR c.ngayKetThucHieuLuc>=s.ngay))>1) THROW 51000,N'Trùng hiệu lực quyết định chức vụ.',1;
 SELECT s.*,l.soQuyetDinh,l.mucLuongCoBan,l.phuCapLuong,l.phuCapDocHai,ISNULL(cv.phuCapChucVu,0) phuCapChucVu INTO #rated FROM #source s JOIN QuyetDinhLuong l ON l.maNhanVien=s.maNhanVien JOIN QuyetDinh q ON q.soQuyetDinh=l.soQuyetDinh AND q.trangThai=N'DaKy' AND q.ngayHieuLuc<=s.ngay AND ISNULL(l.ngayKetThucHieuLuc,'99991231')>=s.ngay OUTER APPLY(SELECT c.phuCapChucVu FROM QuyetDinhChucVu c JOIN QuyetDinh q2 ON q2.soQuyetDinh=c.soQuyetDinh WHERE c.maNhanVien=s.maNhanVien AND q2.trangThai=N'DaKy' AND q2.ngayHieuLuc<=s.ngay AND ISNULL(c.ngayKetThucHieuLuc,'99991231')>=s.ngay) cv;
 INSERT ChiTietBangLuong(maChiTietLuong,maBangLuong,maNhanVien,luongCoBanApDung,soGioCongChuan,soGioCongThucTe,luongTheoCong,phuCapChucVu,phuCapLuong,phuCapDocHai,tienPhuTroi,tienThuongQuaLuong,tienPhatTruLuong,khauTruBHYT,khauTruBHXH,thucLinh)
 SELECT CONVERT(nvarchar(40),NEWID()),@id,maNhanVien,MAX(mucLuongCoBan),@standard,SUM(CASE WHEN ot=0 THEN gio ELSE 0 END),ROUND(SUM(CASE WHEN ot=0 THEN gio*mucLuongCoBan/@standard ELSE 0 END),0),ROUND(SUM(CASE WHEN ot=0 THEN gio*phuCapChucVu/@standard ELSE 0 END),0),ROUND(SUM(CASE WHEN ot=0 THEN gio*phuCapLuong/@standard ELSE 0 END),0),ROUND(SUM(CASE WHEN ot=0 THEN gio*phuCapDocHai/@standard ELSE 0 END),0),ROUND(SUM(CASE WHEN ot=1 THEN gio*mucLuongCoBan/@standard*1.5 ELSE 0 END),0),0,0,0,0,0 FROM #rated GROUP BY maNhanVien;
 -- Store audit source links (salary, position, insurance).
 INSERT CanCuLuong SELECT DISTINCT b.maChiTietLuong,r.soQuyetDinh FROM #rated r JOIN ChiTietBangLuong b ON b.maNhanVien=r.maNhanVien AND b.maBangLuong=@id;
 INSERT CanCuLuong SELECT DISTINCT b.maChiTietLuong,c.soQuyetDinh FROM ChiTietBangLuong b JOIN #source s ON s.maNhanVien=b.maNhanVien JOIN QuyetDinhChucVu c ON c.maNhanVien=b.maNhanVien JOIN QuyetDinh q ON q.soQuyetDinh=c.soQuyetDinh WHERE b.maBangLuong=@id AND q.trangThai=N'DaKy' AND q.ngayHieuLuc<=s.ngay AND ISNULL(c.ngayKetThucHieuLuc,'99991231')>=s.ngay;
 INSERT CanCuBaoHiem SELECT b.maChiTietLuong,h.maHoSoBaoHiem FROM ChiTietBangLuong b JOIN HoSoBaoHiem h ON h.maNhanVien=b.maNhanVien WHERE b.maBangLuong=@id AND h.ngayBatDau<=@end AND ISNULL(h.ngayKetThuc,'99991231')>=@end AND h.trangThai=N'HieuLuc';
 UPDATE b SET khauTruBHYT=ISNULL(v.yt,0),khauTruBHXH=ISNULL(v.xh,0) FROM ChiTietBangLuong b OUTER APPLY(SELECT SUM(CASE WHEN h.loaiBaoHiem=N'BHYT' THEN ROUND(h.mucLuongLamCanCu*h.tyLeDongNhanVien,0) ELSE 0 END) yt,SUM(CASE WHEN h.loaiBaoHiem=N'BHXH' THEN ROUND(h.mucLuongLamCanCu*h.tyLeDongNhanVien,0) ELSE 0 END) xh FROM CanCuBaoHiem c JOIN HoSoBaoHiem h ON h.maHoSoBaoHiem=c.maHoSoBaoHiem WHERE c.maChiTietLuong=b.maChiTietLuong) v WHERE b.maBangLuong=@id;
 UPDATE c SET maChiTietLuong=b.maChiTietLuong FROM ChiTietChamCong c JOIN ChiTietBangLuong b ON b.maNhanVien=c.maNhanVien AND b.maBangLuong=@id WHERE c.ngayChamCong BETWEEN @start AND @end AND c.maChiTietLuong IS NULL;
 UPDATE c SET maChiTietLuong=b.maChiTietLuong,donGiaGioThuong=r.mucLuongCoBan/@standard,thanhTien=ROUND(c.soGioThucTe*r.mucLuongCoBan/@standard*1.5,0) FROM ChiTietPhuTroi c JOIN PhieuPhuTroi p ON p.soPhieuPhuTroi=c.soPhieuPhuTroi JOIN ChiTietBangLuong b ON b.maNhanVien=c.maNhanVien AND b.maBangLuong=@id JOIN #rated r ON r.maNhanVien=c.maNhanVien AND r.ngay=p.ngayPhuTroi AND r.ot=1 WHERE p.ngayPhuTroi BETWEEN @start AND @end AND p.trangThai=N'XacNhan' AND c.maChiTietLuong IS NULL;
 UPDATE p SET maChiTietLuong=b.maChiTietLuong FROM PhanBoThuong p JOIN PhieuChiKhenThuong v ON v.soPhieuChi=p.soPhieuChi JOIN ChiTietBangLuong b ON b.maNhanVien=p.maNhanVien AND b.maBangLuong=@id WHERE p.maChiTietLuong IS NULL AND v.phuongThucChi=N'QuaLuong' AND v.ngayLap<=@end AND v.trangThai=N'XacNhan';
 UPDATE p SET maChiTietLuong=b.maChiTietLuong FROM PhanBoPhat p JOIN PhieuThuNopPhat v ON v.soPhieuThu=p.soPhieuThu JOIN ChiTietBangLuong b ON b.maNhanVien=p.maNhanVien AND b.maBangLuong=@id WHERE p.maChiTietLuong IS NULL AND v.phuongThucThu=N'QuaLuong' AND v.ngayLap<=@end AND v.trangThai=N'XacNhan';
 UPDATE b SET tienThuongQuaLuong=ISNULL((SELECT SUM(soTien) FROM PhanBoThuong WHERE maChiTietLuong=b.maChiTietLuong),0),tienPhatTruLuong=ISNULL((SELECT SUM(soTien) FROM PhanBoPhat WHERE maChiTietLuong=b.maChiTietLuong),0) FROM ChiTietBangLuong b WHERE b.maBangLuong=@id;
 UPDATE ChiTietBangLuong SET thucLinh=luongTheoCong+phuCapChucVu+phuCapLuong+phuCapDocHai+tienPhuTroi+tienThuongQuaLuong-tienPhatTruLuong-khauTruBHYT-khauTruBHXH WHERE maBangLuong=@id;
 UPDATE BangLuong SET tongLuong=(SELECT SUM(thucLinh) FROM ChiTietBangLuong WHERE maBangLuong=@id),trangThai=N'DaTinh' WHERE maBangLuong=@id;
 COMMIT;
END;
GO
