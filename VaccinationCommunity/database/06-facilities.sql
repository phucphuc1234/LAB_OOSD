USE [VaccinationCommunity_Demo];
GO
/* SSMS continues after an invalid USE in a previous batch. Fail closed rather
   than creating medical objects in master or another database in that case.
   If this guard fires, correct the database name and run SET NOEXEC OFF first. */
IF DB_NAME()<>N'VaccinationCommunity_Demo'
BEGIN
 RAISERROR(N'Không đúng database đích. Dừng script; kiểm tra tên database rồi chạy SET NOEXEC OFF.',16,1);
 SET NOEXEC ON;
END;
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
GO
/* Additive upgrade: no table/data is dropped. A separate inactive holding facility
   keeps legacy free-text locations visible without pretending that they were verified.
   Its address must be reviewed by an administrator before activation. */
IF OBJECT_ID(N'dbo.KHUVUCTIEM',N'U') IS NULL
CREATE TABLE dbo.KHUVUCTIEM (
 MaKhuVuc int IDENTITY(1,1) NOT NULL CONSTRAINT PK_KHUVUCTIEM PRIMARY KEY,
 TenKhuVuc nvarchar(150) NOT NULL CONSTRAINT UQ_KHUVUCTIEM_Ten UNIQUE,
 TinhThanh nvarchar(100) NOT NULL CONSTRAINT DF_KHUVUCTIEM_Tinh DEFAULT N'Thành phố Hồ Chí Minh',
 TrangThai bit NOT NULL CONSTRAINT DF_KHUVUCTIEM_TrangThai DEFAULT 1,
 CONSTRAINT CK_KHUVUCTIEM_HCM CHECK(TinhThanh=N'Thành phố Hồ Chí Minh')
);
IF OBJECT_ID(N'dbo.COSOTIEM',N'U') IS NULL
CREATE TABLE dbo.COSOTIEM (
 MaCoSoTiem int IDENTITY(1,1) NOT NULL CONSTRAINT PK_COSOTIEM PRIMARY KEY,
 MaKhuVuc int NOT NULL CONSTRAINT FK_COSOTIEM_KhuVuc REFERENCES dbo.KHUVUCTIEM(MaKhuVuc),
 TenCoSo nvarchar(150) NOT NULL CONSTRAINT UQ_COSOTIEM_Ten UNIQUE,
 DiaChi nvarchar(255) NOT NULL,
 PhuongXa nvarchar(100) NOT NULL,
 TinhThanh nvarchar(100) NOT NULL CONSTRAINT DF_COSOTIEM_Tinh DEFAULT N'Thành phố Hồ Chí Minh',
 SoDienThoai varchar(20) NULL,
 TrangThai bit NOT NULL CONSTRAINT DF_COSOTIEM_TrangThai DEFAULT 1,
 GhiChu nvarchar(1000) NULL,
 CONSTRAINT CK_COSOTIEM_HCM CHECK(TinhThanh=N'Thành phố Hồ Chí Minh'),
 CONSTRAINT CK_COSOTIEM_DiaChi CHECK(LEN(LTRIM(RTRIM(DiaChi)))>0 AND LEN(LTRIM(RTRIM(PhuongXa)))>0)
);
IF OBJECT_ID(N'dbo.PHANCONG_COSOTIEM',N'U') IS NULL
CREATE TABLE dbo.PHANCONG_COSOTIEM (
 MaTaiKhoan int NOT NULL CONSTRAINT FK_PHANCONG_TaiKhoan REFERENCES dbo.TAIKHOAN(MaTaiKhoan),
 MaCoSoTiem int NOT NULL CONSTRAINT FK_PHANCONG_CoSo REFERENCES dbo.COSOTIEM(MaCoSoTiem),
 MaNguoiPhanCong int NULL CONSTRAINT FK_PHANCONG_NguoiPhanCong REFERENCES dbo.TAIKHOAN(MaTaiKhoan),
 NgayPhanCong datetime2(0) NOT NULL CONSTRAINT DF_PHANCONG_Ngay DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_PHANCONG_COSOTIEM PRIMARY KEY(MaTaiKhoan,MaCoSoTiem)
);
IF OBJECT_ID(N'dbo.COSOTIEM_VACCINE',N'U') IS NULL
CREATE TABLE dbo.COSOTIEM_VACCINE (
 MaCoSoTiem int NOT NULL CONSTRAINT FK_COSOTIEM_VACCINE_CoSo REFERENCES dbo.COSOTIEM(MaCoSoTiem),
 MaVaccine int NOT NULL CONSTRAINT FK_COSOTIEM_VACCINE_Vaccine REFERENCES dbo.VACCINE(MaVaccine),
 TrangThai bit NOT NULL CONSTRAINT DF_COSOTIEM_VACCINE_TrangThai DEFAULT 1,
 CONSTRAINT PK_COSOTIEM_VACCINE PRIMARY KEY(MaCoSoTiem,MaVaccine)
);
GO
/* Adding a NOT NULL column WITH VALUES does not run UPDATE triggers or alter
   existing clinical fields. The temporary default is removed immediately: every
   future write must explicitly supply a verified facility ID. */
BEGIN TRY
 BEGIN TRANSACTION;
 IF NOT EXISTS(SELECT 1 FROM dbo.KHUVUCTIEM WHERE TenKhuVuc=N'Chuyển đổi dữ liệu — cần đối soát')
  INSERT dbo.KHUVUCTIEM(TenKhuVuc,TrangThai) VALUES(N'Chuyển đổi dữ liệu — cần đối soát',0);
 DECLARE @Area int=(SELECT MaKhuVuc FROM dbo.KHUVUCTIEM WHERE TenKhuVuc=N'Chuyển đổi dữ liệu — cần đối soát');
 IF NOT EXISTS(SELECT 1 FROM dbo.COSOTIEM WHERE TenCoSo=N'Cơ sở dữ liệu cũ — cần đối soát')
  INSERT dbo.COSOTIEM(MaKhuVuc,TenCoSo,DiaChi,PhuongXa,TrangThai,GhiChu)
  VALUES(@Area,N'Cơ sở dữ liệu cũ — cần đối soát',N'Chưa xác minh địa chỉ từ dữ liệu cũ',N'Chưa đối soát',0,N'Khu lưu giữ dữ liệu nâng cấp. Không hiển thị cho người dân đặt mới. Admin phải đối soát địa chỉ và khu vực trước khi kích hoạt; chuỗi cơ sở lịch sử được giữ nguyên.');
 DECLARE @Legacy int=(SELECT MaCoSoTiem FROM dbo.COSOTIEM WHERE TenCoSo=N'Cơ sở dữ liệu cũ — cần đối soát'),@Statement nvarchar(max),@Table sysname;
 DECLARE FacilityTables CURSOR LOCAL FAST_FORWARD FOR SELECT Name FROM (VALUES(N'LOVACCINE'),(N'LICHTIEM'),(N'MUITIEM'),(N'CHONGCHIDINH')) t(Name);
 OPEN FacilityTables; FETCH NEXT FROM FacilityTables INTO @Table;
 WHILE @@FETCH_STATUS=0
 BEGIN
  IF COL_LENGTH(N'dbo.'+@Table,N'MaCoSoTiem') IS NULL
  BEGIN
   SET @Statement=N'ALTER TABLE dbo.'+QUOTENAME(@Table)+N' ADD MaCoSoTiem int NOT NULL CONSTRAINT '+QUOTENAME(N'DF_'+@Table+N'_FacilityUpgrade')+N' DEFAULT '+CONVERT(nvarchar(12),@Legacy)+N' WITH VALUES; ALTER TABLE dbo.'+QUOTENAME(@Table)+N' DROP CONSTRAINT '+QUOTENAME(N'DF_'+@Table+N'_FacilityUpgrade')+N';';
   EXEC sys.sp_executesql @Statement;
  END;
  IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name=N'FK_'+@Table+N'_CoSoTiem')
  BEGIN
   SET @Statement=N'ALTER TABLE dbo.'+QUOTENAME(@Table)+N' WITH CHECK ADD CONSTRAINT '+QUOTENAME(N'FK_'+@Table+N'_CoSoTiem')+N' FOREIGN KEY(MaCoSoTiem) REFERENCES dbo.COSOTIEM(MaCoSoTiem);';
   EXEC sys.sp_executesql @Statement;
  END;
  FETCH NEXT FROM FacilityTables INTO @Table;
 END;
 CLOSE FacilityTables; DEALLOCATE FacilityTables;
 IF NOT EXISTS(SELECT 1 FROM dbo.SCHEMAVERSION WHERE VersionNo=2)
  INSERT dbo.SCHEMAVERSION(VersionNo,Description) VALUES(2,N'Ho Chi Minh City facilities, vaccine offerings, per-facility inventory and staff assignments; legacy locations held for review without rewriting medical history.');
 COMMIT;
END TRY
BEGIN CATCH
 IF @@TRANCOUNT>0 ROLLBACK;
 THROW;
END CATCH;
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.LOVACCINE') AND name=N'IX_LOVACCINE_CoSo_FEFO')
 CREATE INDEX IX_LOVACCINE_CoSo_FEFO ON dbo.LOVACCINE(MaCoSoTiem,MaVaccine,TrangThai,HanSuDung,MaLo) INCLUDE(SoLuongCon,SoLuongDatTruoc);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.LICHTIEM') AND name=N'IX_LICHTIEM_CoSo_NguoiDan')
 CREATE INDEX IX_LICHTIEM_CoSo_NguoiDan ON dbo.LICHTIEM(MaCoSoTiem,MaNguoiDan) INCLUDE(TrangThai,MaLoDuKien,NgayDuKien);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.MUITIEM') AND name=N'IX_MUITIEM_CoSo_NguoiDan')
 CREATE INDEX IX_MUITIEM_CoSo_NguoiDan ON dbo.MUITIEM(MaCoSoTiem,MaNguoiDan) INCLUDE(MaVaccine,NgayTiem);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.CHONGCHIDINH') AND name=N'IX_CHONGCHIDINH_CoSo')
 CREATE INDEX IX_CHONGCHIDINH_CoSo ON dbo.CHONGCHIDINH(MaCoSoTiem,MaNguoiDan) INCLUDE(TrangThai);
GO
/* Current account role/status is checked on every query; a stale JWT or a revoked
   assignment cannot preserve access. History remains readable for an assigned
   facility after the facility stops accepting NEW appointments. */
CREATE OR ALTER FUNCTION dbo.fn_CoSoDuocPhep(@MaTaiKhoan int,@MaCoSoTiem int)
RETURNS bit
AS
BEGIN
 DECLARE @Allowed bit=0;
 IF EXISTS(SELECT 1 FROM dbo.TAIKHOAN t JOIN dbo.VAITRO r ON r.MaVaiTro=t.MaVaiTro
  WHERE t.MaTaiKhoan=@MaTaiKhoan AND t.TrangThai=1 AND r.TrangThai=1
   AND (r.TenVaiTro=N'Quản trị viên' OR (r.TenVaiTro=N'Nhân viên' AND EXISTS(
    SELECT 1 FROM dbo.PHANCONG_COSOTIEM p WHERE p.MaTaiKhoan=t.MaTaiKhoan AND p.MaCoSoTiem=@MaCoSoTiem))))
  SET @Allowed=1;
 RETURN @Allowed;
END;
GO
CREATE OR ALTER FUNCTION dbo.fn_NguoiDanDuocPhep(@MaTaiKhoan int,@MaNguoiDan int)
RETURNS bit
AS
BEGIN
 DECLARE @Allowed bit=0;
 IF EXISTS(SELECT 1 FROM dbo.TAIKHOAN t JOIN dbo.VAITRO r ON r.MaVaiTro=t.MaVaiTro
  WHERE t.MaTaiKhoan=@MaTaiKhoan AND t.TrangThai=1 AND r.TrangThai=1 AND r.TenVaiTro=N'Quản trị viên')
  SET @Allowed=1;
 ELSE IF EXISTS(SELECT 1 FROM dbo.LICHTIEM l WHERE l.MaNguoiDan=@MaNguoiDan AND dbo.fn_CoSoDuocPhep(@MaTaiKhoan,l.MaCoSoTiem)=1)
   OR EXISTS(SELECT 1 FROM dbo.MUITIEM m WHERE m.MaNguoiDan=@MaNguoiDan AND dbo.fn_CoSoDuocPhep(@MaTaiKhoan,m.MaCoSoTiem)=1)
  SET @Allowed=1;
 RETURN @Allowed;
END;
GO
