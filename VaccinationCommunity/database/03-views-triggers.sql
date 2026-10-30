USE [VaccinationCommunity_Demo];
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER VIEW dbo.vw_TonKhoVaccine
AS
SELECT l.MaLo,l.MaLoVaccine,l.MaVaccine,v.TenVaccine,l.MaCoSoTiem,c.TenCoSo,c.DiaChi,c.PhuongXa,c.TinhThanh,l.NgaySanXuat,l.HanSuDung,
 l.SoLuongNhap,l.SoLuongCon,l.SoLuongDatTruoc,
 l.SoLuongCon-l.SoLuongDatTruoc AS SoLuongKhaDung,l.TrangThai,l.NgayNhap,
 DATEDIFF(day,CAST(DATEADD(hour,7,SYSUTCDATETIME()) AS date),l.HanSuDung) AS SoNgayConHan,
 CAST(CASE WHEN c.TrangThai=1 AND k.TrangThai=1 AND v.TrangThai=1 AND cv.TrangThai=1 AND l.TrangThai=N'Đang sử dụng' AND l.HanSuDung>=CAST(DATEADD(hour,7,SYSUTCDATETIME()) AS date) AND l.SoLuongCon>l.SoLuongDatTruoc THEN 1 ELSE 0 END AS bit) AS CoTheDatLich
FROM dbo.LOVACCINE l JOIN dbo.VACCINE v ON v.MaVaccine=l.MaVaccine JOIN dbo.COSOTIEM c ON c.MaCoSoTiem=l.MaCoSoTiem
 JOIN dbo.KHUVUCTIEM k ON k.MaKhuVuc=c.MaKhuVuc LEFT JOIN dbo.COSOTIEM_VACCINE cv ON cv.MaCoSoTiem=l.MaCoSoTiem AND cv.MaVaccine=l.MaVaccine;
GO
CREATE OR ALTER VIEW dbo.vw_LichTiemChiTiet
AS
SELECT l.*,n.HoTen,n.SoDienThoai,n.Email,v.TenVaccine,b.MaLoVaccine,
 t.TenDangNhap AS NhanVienTao,
 CAST(CASE WHEN l.TrangThai IN(N'Đã lên lịch',N'Đã xác nhận') AND l.NgayDuKien<SYSUTCDATETIME() THEN 1 ELSE 0 END AS bit) AS QuaHen
FROM dbo.LICHTIEM l JOIN dbo.NGUOIDAN n ON n.MaNguoiDan=l.MaNguoiDan
 JOIN dbo.VACCINE v ON v.MaVaccine=l.MaVaccine
 LEFT JOIN dbo.LOVACCINE b ON b.MaLo=l.MaLoDuKien
 LEFT JOIN dbo.TAIKHOAN t ON t.MaTaiKhoan=l.MaNhanVienTao;
GO
CREATE OR ALTER VIEW dbo.vw_LichSuTiemChung
AS
SELECT m.*,n.HoTen,n.CCCD,n.NgaySinh,n.GioiTinh,v.TenVaccine,v.LoaiVaccine,
 l.MaLoVaccine,l.HanSuDung,t.TenDangNhap AS NhanVienGhiNhan
FROM dbo.MUITIEM m JOIN dbo.NGUOIDAN n ON n.MaNguoiDan=m.MaNguoiDan
 JOIN dbo.VACCINE v ON v.MaVaccine=m.MaVaccine
 JOIN dbo.LOVACCINE l ON l.MaLo=m.MaLo
 JOIN dbo.TAIKHOAN t ON t.MaTaiKhoan=m.MaNhanVien;
GO
CREATE OR ALTER VIEW dbo.vw_TheoDoiSauTiemChiTiet
AS
SELECT d.*,n.HoTen,n.SoDienThoai,n.Email,n.MaTaiKhoan AS MaTaiKhoanNguoiDan,
 m.MaVaccine,v.TenVaccine,m.MuiSo,m.NgayTiem,m.CoSoTiem,m.MaCoSoTiem,c.TenCoSo,c.MaKhuVuc,m.MaLo,l.MaLoVaccine,
 t.TenDangNhap AS NhanVienXuLy,
 DATEDIFF(hour,m.NgayTiem,d.ThoiDiemBaoCao) AS SoGioSauTiem,
 CAST(CASE WHEN d.TrangThai<>'resolved' AND d.HenTheoDoiLuc<SYSUTCDATETIME() THEN 1 ELSE 0 END AS bit) AS QuaHenTheoDoi
FROM dbo.THEODOISAUTIEM d JOIN dbo.NGUOIDAN n ON n.MaNguoiDan=d.MaNguoiDan
 JOIN dbo.MUITIEM m ON m.MaMuiTiem=d.MaMuiTiem
 JOIN dbo.COSOTIEM c ON c.MaCoSoTiem=m.MaCoSoTiem
 JOIN dbo.VACCINE v ON v.MaVaccine=m.MaVaccine
 JOIN dbo.LOVACCINE l ON l.MaLo=m.MaLo
 LEFT JOIN dbo.TAIKHOAN t ON t.MaTaiKhoan=d.MaNhanVienXuLy;
GO
CREATE OR ALTER VIEW dbo.vw_TheoDoiSauTiemTongHop
AS
SELECT m.MaCoSoTiem,CAST(d.ThoiDiemBaoCao AS date) AS NgayBaoCao,d.MucDo,d.TrangThai,
 COUNT_BIG(*) AS SoBaoCao,
 SUM(CONVERT(bigint,d.CoDauHieuCanhBao)) AS SoCanhBao,
 SUM(CONVERT(bigint,CASE WHEN d.TrangThai<>'resolved' AND d.HenTheoDoiLuc<SYSUTCDATETIME() THEN 1 ELSE 0 END)) AS SoQuaHenTheoDoi
FROM dbo.THEODOISAUTIEM d JOIN dbo.MUITIEM m ON m.MaMuiTiem=d.MaMuiTiem
GROUP BY m.MaCoSoTiem,CAST(d.ThoiDiemBaoCao AS date),d.MucDo,d.TrangThai;
GO
CREATE OR ALTER VIEW dbo.vw_HoatDongTiemChungTheoNgay
AS
SELECT CAST(m.NgayTiem AS date) AS Ngay,m.MaVaccine,v.TenVaccine,m.MaCoSoTiem,m.CoSoTiem,
 COUNT_BIG(*) AS SoMuiTiem,COUNT(DISTINCT m.MaNguoiDan) AS SoNguoiDan
FROM dbo.MUITIEM m JOIN dbo.VACCINE v ON v.MaVaccine=m.MaVaccine
GROUP BY CAST(m.NgayTiem AS date),m.MaVaccine,v.TenVaccine,m.MaCoSoTiem,m.CoSoTiem;
GO
/* INSERT/UPDATE checks are set-based and safe for multirow statements.
   These triggers NEVER decrement vaccine inventory. All app inventory writes
   go through the three transactional procedures from 02-routines.sql. */
CREATE OR ALTER TRIGGER dbo.trg_MuiTiem_ValidateAudit ON dbo.MUITIEM
AFTER INSERT,UPDATE,DELETE
AS
BEGIN
 SET NOCOUNT ON;
 IF EXISTS(SELECT 1 FROM inserted i JOIN dbo.LOVACCINE l ON l.MaLo=i.MaLo WHERE i.MaVaccine<>l.MaVaccine OR i.MaCoSoTiem<>l.MaCoSoTiem OR CAST(DATEADD(hour,7,i.NgayTiem) AS date)>l.HanSuDung OR (l.NgaySanXuat IS NOT NULL AND CAST(DATEADD(hour,7,i.NgayTiem) AS date)<l.NgaySanXuat))
  THROW 51000,N'Mũi tiêm không khớp vaccine hoặc thời hạn lô.',1;
 IF EXISTS(SELECT 1 FROM inserted i JOIN dbo.LICHTIEM l ON l.MaLichTiem=i.MaLichTiem WHERE i.MaNguoiDan<>l.MaNguoiDan OR i.MaVaccine<>l.MaVaccine OR i.MuiSo<>l.MuiSo OR i.MaCoSoTiem<>l.MaCoSoTiem)
  THROW 51003,N'Mũi tiêm không khớp người dân, vaccine hoặc mũi số trong lịch.',1;
 IF EXISTS(SELECT 1 FROM inserted WHERE NgayTiem>SYSUTCDATETIME())
  THROW 51000,N'Không được ghi nhận mũi tiêm trong tương lai.',1;
 /* Clinical administration records are append-only. Corrections belong in the
    append-only audit log, not silent replacement of historical administrations. */
 IF EXISTS(SELECT 1 FROM deleted)
  THROW 51003,N'Không sửa trực tiếp mũi tiêm đã ghi nhận; cần quy trình hiệu chỉnh có kiểm soát.',1;
 INSERT dbo.LICHSUHIEUCHINH(TenBang,MaBanGhi,HanhDong,DuLieuMoi,MaTaiKhoan)
 SELECT 'MUITIEM',i.MaMuiTiem,N'Ghi nhận mũi tiêm',
  (SELECT i.MaNguoiDan,i.MaVaccine,i.MaLo,i.MaLichTiem,i.MuiSo,i.NgayTiem,i.MaCoSoTiem FOR JSON PATH,WITHOUT_ARRAY_WRAPPER),i.MaNhanVien
 FROM inserted i;
END;
GO
CREATE OR ALTER TRIGGER dbo.trg_LoVaccine_ValidateAudit ON dbo.LOVACCINE
AFTER UPDATE
AS
BEGIN
 SET NOCOUNT ON;
 IF EXISTS(SELECT 1 FROM inserted WHERE SoLuongNhap<=0 OR SoLuongCon<0 OR SoLuongCon>SoLuongNhap OR SoLuongDatTruoc<0 OR SoLuongDatTruoc>SoLuongCon)
  THROW 51004,N'Tồn kho hoặc lượng giữ chỗ không hợp lệ.',1;
 IF EXISTS(SELECT 1 FROM inserted i JOIN deleted d ON d.MaLo=i.MaLo WHERE (i.MaVaccine<>d.MaVaccine OR i.MaCoSoTiem<>d.MaCoSoTiem) AND (EXISTS(SELECT 1 FROM dbo.MUITIEM m WHERE m.MaLo=i.MaLo) OR EXISTS(SELECT 1 FROM dbo.LICHTIEM l WHERE l.MaLoDuKien=i.MaLo)))
  THROW 51003,N'Không chuyển vaccine của lô đã được sử dụng hoặc giữ chỗ.',1;
 IF EXISTS(SELECT 1 FROM inserted i JOIN deleted d ON d.MaLo=i.MaLo WHERE i.MaCoSoTiem<>d.MaCoSoTiem)
  THROW 51003,N'Không chuyển cơ sở của lô đã tạo; nhập lô mới cho cơ sở đích theo chứng từ.',1;
 INSERT dbo.LICHSUHIEUCHINH(TenBang,MaBanGhi,HanhDong,DuLieuCu,DuLieuMoi)
 SELECT 'LOVACCINE',i.MaLo,N'Cập nhật tồn kho / lô',
  (SELECT d.SoLuongCon,d.SoLuongDatTruoc,d.TrangThai,d.HanSuDung FOR JSON PATH,WITHOUT_ARRAY_WRAPPER),
  (SELECT i.SoLuongCon,i.SoLuongDatTruoc,i.TrangThai,i.HanSuDung FOR JSON PATH,WITHOUT_ARRAY_WRAPPER)
 FROM inserted i JOIN deleted d ON d.MaLo=i.MaLo
 WHERE i.SoLuongCon<>d.SoLuongCon OR i.SoLuongDatTruoc<>d.SoLuongDatTruoc OR i.TrangThai<>d.TrangThai OR i.HanSuDung<>d.HanSuDung;
END;
GO
CREATE OR ALTER TRIGGER dbo.trg_LichTiem_ValidateAudit ON dbo.LICHTIEM
AFTER INSERT,UPDATE
AS
BEGIN
 SET NOCOUNT ON;
 IF EXISTS(SELECT 1 FROM inserted i JOIN dbo.LOVACCINE b ON b.MaLo=i.MaLoDuKien WHERE b.MaVaccine<>i.MaVaccine OR b.MaCoSoTiem<>i.MaCoSoTiem)
  THROW 51003,N'Lô giữ chỗ không thuộc vaccine trong lịch.',1;
 IF EXISTS(SELECT 1 FROM inserted i WHERE i.TrangThai IN(N'Đã lên lịch',N'Đã xác nhận') AND i.MaLoDuKien IS NULL)
  THROW 51004,N'Lịch đang hoạt động phải có lô vaccine được giữ chỗ.',1;
 IF EXISTS(SELECT 1 FROM inserted i JOIN dbo.LICHTIEM l WITH(UPDLOCK,HOLDLOCK) ON l.MaNguoiDan=i.MaNguoiDan AND l.MaVaccine=i.MaVaccine AND l.MaLichTiem<>i.MaLichTiem WHERE i.TrangThai IN(N'Đã lên lịch',N'Đã xác nhận') AND l.TrangThai IN(N'Đã lên lịch',N'Đã xác nhận'))
  THROW 51003,N'Mỗi người dân chỉ có một lịch hoạt động cho cùng vaccine.',1;
 INSERT dbo.LICHSUHIEUCHINH(TenBang,MaBanGhi,HanhDong,DuLieuCu,DuLieuMoi,MaTaiKhoan)
 SELECT 'LICHTIEM',i.MaLichTiem,CASE WHEN d.MaLichTiem IS NULL THEN N'Tạo lịch' ELSE N'Cập nhật lịch' END,
  CASE WHEN d.MaLichTiem IS NOT NULL THEN (SELECT d.TrangThai,d.MaLoDuKien,d.NgayDuKien,d.MaCoSoTiem FOR JSON PATH,WITHOUT_ARRAY_WRAPPER) END,
  (SELECT i.MaNguoiDan,i.MaVaccine,i.TrangThai,i.MaLoDuKien,i.NgayDuKien,i.MaCoSoTiem FOR JSON PATH,WITHOUT_ARRAY_WRAPPER),CASE WHEN d.MaLichTiem IS NULL THEN i.MaNhanVienTao ELSE NULL END
 FROM inserted i LEFT JOIN deleted d ON d.MaLichTiem=i.MaLichTiem;
END;
GO
CREATE OR ALTER TRIGGER dbo.trg_TheoDoi_Validate ON dbo.THEODOISAUTIEM
AFTER INSERT,UPDATE
AS
BEGIN
 SET NOCOUNT ON;
 IF EXISTS(SELECT 1 FROM inserted i JOIN dbo.MUITIEM m ON m.MaMuiTiem=i.MaMuiTiem WHERE i.MaNguoiDan<>m.MaNguoiDan OR (i.KhoiPhatLuc IS NOT NULL AND i.KhoiPhatLuc<m.NgayTiem))
  THROW 51000,N'Báo cáo không khớp người được tiêm hoặc thời điểm khởi phát.',1;
 IF EXISTS(SELECT 1 FROM inserted i JOIN deleted d ON d.MaTheoDoi=i.MaTheoDoi WHERE i.MaMuiTiem<>d.MaMuiTiem OR i.MaNguoiDan<>d.MaNguoiDan OR i.MucDo<>d.MucDo OR i.TrieuChung<>d.TrieuChung OR ISNULL(i.NhietDo,-1)<>ISNULL(d.NhietDo,-1))
  THROW 51003,N'Không được ghi đè nội dung người dân đã báo cáo.',1;
END;
GO
CREATE OR ALTER TRIGGER dbo.trg_TheoDoiLichSu_Immutable ON dbo.THEODOI_LICHSU
AFTER UPDATE,DELETE
AS
BEGIN
 SET NOCOUNT ON;
 IF EXISTS(SELECT 1 FROM deleted) THROW 51003,N'Lịch sử xử lý là dữ liệu chỉ ghi thêm, không được sửa hoặc xóa.',1;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_LichSuHieuChinh_Immutable ON dbo.LICHSUHIEUCHINH
AFTER UPDATE,DELETE
AS
BEGIN
 SET NOCOUNT ON;
 IF EXISTS(SELECT 1 FROM deleted) THROW 51003,N'Nhật ký hiệu chỉnh là dữ liệu chỉ ghi thêm, không được sửa hoặc xóa.',1;
END;
GO

/* Site-level operational views: consumers must still enforce the caller's scope. */
CREATE OR ALTER VIEW dbo.vw_CoSoTiemTongQuan
AS
SELECT c.MaCoSoTiem,c.TenCoSo,c.MaKhuVuc,k.TenKhuVuc,c.DiaChi,c.PhuongXa,c.TinhThanh,c.TrangThai,
 (SELECT COUNT_BIG(*) FROM dbo.PHANCONG_COSOTIEM p JOIN dbo.TAIKHOAN t ON t.MaTaiKhoan=p.MaTaiKhoan JOIN dbo.VAITRO r ON r.MaVaiTro=t.MaVaiTro WHERE p.MaCoSoTiem=c.MaCoSoTiem AND t.TrangThai=1 AND r.TrangThai=1 AND r.TenVaiTro=N'Nhân viên') AS SoNhanVien,
 (SELECT COUNT_BIG(*) FROM dbo.LICHTIEM l WHERE l.MaCoSoTiem=c.MaCoSoTiem AND l.TrangThai IN(N'Đã lên lịch',N'Đã xác nhận')) AS SoLichDangCho,
 (SELECT COUNT_BIG(*) FROM dbo.MUITIEM m WHERE m.MaCoSoTiem=c.MaCoSoTiem) AS SoMuiDaGhi,
 (SELECT COUNT_BIG(*) FROM dbo.THEODOISAUTIEM d JOIN dbo.MUITIEM m ON m.MaMuiTiem=d.MaMuiTiem WHERE m.MaCoSoTiem=c.MaCoSoTiem AND d.TrangThai<>'resolved') AS SoPhieuDangXuLy
FROM dbo.COSOTIEM c JOIN dbo.KHUVUCTIEM k ON k.MaKhuVuc=c.MaKhuVuc;
GO
CREATE OR ALTER VIEW dbo.vw_PhanCongNhanVien
AS
SELECT p.MaTaiKhoan,t.TenDangNhap,t.TrangThai AS TaiKhoanHoatDong,r.TenVaiTro,
 p.MaCoSoTiem,c.TenCoSo,c.MaKhuVuc,k.TenKhuVuc,c.TinhThanh,p.MaNguoiPhanCong,p.NgayPhanCong
FROM dbo.PHANCONG_COSOTIEM p JOIN dbo.TAIKHOAN t ON t.MaTaiKhoan=p.MaTaiKhoan
 JOIN dbo.VAITRO r ON r.MaVaiTro=t.MaVaiTro JOIN dbo.COSOTIEM c ON c.MaCoSoTiem=p.MaCoSoTiem
 JOIN dbo.KHUVUCTIEM k ON k.MaKhuVuc=c.MaKhuVuc;
GO
