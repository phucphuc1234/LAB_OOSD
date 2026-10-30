/* NÂNG CẤP TP. HỒ CHÍ MINH — DATABASE ĐANG CÓ DỮ LIỆU.
   Stop the application during this schema upgrade. Run against the existing demo DB.
   Preserves existing clinical fields, IDs, people, password hashes and stock balances.
   Old free-text locations are linked to an inactive holding facility for admin review.
   No data reset, no automatic demo seeding, no trigger disabling.
   Contains migration + all replacement routines/views/triggers + seed definitions + verification.
   Optional demo catalog/data: EXEC dbo.usp_SeedDemo @ConfirmDemo=1;
   If your database uses another name, replace every VaccinationCommunity_Demo token first. */
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

USE [VaccinationCommunity_Demo];
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
/* Errors: 51000 invalid input; 51001 not found; 51002 forbidden;
   51003 conflict/stale version; 51004 insufficient usable inventory.
   Stock is changed ONLY by usp_GhiNhanMuiTiem, never by a trigger. */
CREATE OR ALTER PROCEDURE dbo.usp_LuuLichTiem
 @MaLichTiem int=NULL, @MaNguoiDan int, @MaVaccine int, @MuiSo int,
 @NgayDuKien datetime2(0), @CoSoTiem nvarchar(255)=NULL,
 @TrangThai nvarchar(50)=N'Đã lên lịch', @GhiChu nvarchar(1000)=NULL,
 @MaNhanVienTao int=NULL, @MaLoDuKien int=NULL, @ReturnRow bit=1,
 @MaCoSoTiem int=NULL, @MaTaiKhoanNguoiDan int=NULL
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
 IF @MaNguoiDan IS NULL OR @MaNguoiDan<=0 OR @MaVaccine IS NULL OR @MaVaccine<=0 OR @MuiSo IS NULL OR @MuiSo NOT BETWEEN 1 AND 20 OR @NgayDuKien IS NULL OR @NgayDuKien<=SYSUTCDATETIME()
  THROW 51000,N'Ngày hẹn phải ở tương lai và mũi số hợp lệ.',1;
 IF @TrangThai IS NULL OR @TrangThai NOT IN (N'Đã lên lịch',N'Đã xác nhận')
  THROW 51000,N'Chỉ tạo hoặc sửa lịch đang hoạt động.',1;
 IF @MaCoSoTiem IS NULL OR @MaCoSoTiem<=0 THROW 51000,N'Cần chọn cơ sở tiêm từ danh mục TP. Hồ Chí Minh.',1;
 IF (@MaNhanVienTao IS NULL AND @MaTaiKhoanNguoiDan IS NULL) OR (@MaNhanVienTao IS NOT NULL AND @MaTaiKhoanNguoiDan IS NOT NULL)
  THROW 51002,N'Cần xác định đúng một tài khoản thực hiện đặt lịch.',1;
 BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @LockResult int;
  EXEC @LockResult=sys.sp_getapplock @Resource=N'VaccinationCommunity.Inventory',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;
  IF @LockResult<0 THROW 51003,N'Hệ thống đang xử lý tồn kho; vui lòng thử lại.',1;
  SET @CoSoTiem=NULL;
  SELECT @CoSoTiem=c.TenCoSo FROM dbo.COSOTIEM c WITH(HOLDLOCK)
   JOIN dbo.KHUVUCTIEM k WITH(HOLDLOCK) ON k.MaKhuVuc=c.MaKhuVuc
   WHERE c.MaCoSoTiem=@MaCoSoTiem AND c.TrangThai=1 AND k.TrangThai=1
    AND c.TinhThanh=N'Thành phố Hồ Chí Minh';
  IF @CoSoTiem IS NULL THROW 51000,N'Cơ sở tiêm không tiếp nhận đặt lịch hoặc chưa được xác minh tại TP. Hồ Chí Minh.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.COSOTIEM_VACCINE WITH(HOLDLOCK) WHERE MaCoSoTiem=@MaCoSoTiem AND MaVaccine=@MaVaccine AND TrangThai=1)
   THROW 51003,N'Cơ sở không triển khai vaccine đã chọn.',1;
  IF @MaNhanVienTao IS NOT NULL AND (dbo.fn_CoSoDuocPhep(@MaNhanVienTao,@MaCoSoTiem)=0 OR dbo.fn_NguoiDanDuocPhep(@MaNhanVienTao,@MaNguoiDan)=0)
   THROW 51002,N'Nhân viên không được phân công cơ sở hoặc hồ sơ người dân này.',1;
  IF @MaTaiKhoanNguoiDan IS NOT NULL
  BEGIN
   IF @MaLichTiem IS NOT NULL OR @TrangThai<>N'Đã lên lịch' OR NOT EXISTS(
    SELECT 1 FROM dbo.NGUOIDAN n WITH(HOLDLOCK) JOIN dbo.TAIKHOAN t WITH(HOLDLOCK) ON t.MaTaiKhoan=n.MaTaiKhoan
    JOIN dbo.VAITRO r WITH(HOLDLOCK) ON r.MaVaiTro=t.MaVaiTro
    WHERE n.MaNguoiDan=@MaNguoiDan AND t.MaTaiKhoan=@MaTaiKhoanNguoiDan AND t.TrangThai=1 AND n.TrangThai=1 AND r.TrangThai=1 AND r.TenVaiTro=N'Người dân')
    THROW 51002,N'Người dân chỉ được đăng ký lịch mới cho chính hồ sơ của mình.',1;
  END;
  IF NOT EXISTS(SELECT 1 FROM dbo.NGUOIDAN WITH(UPDLOCK,HOLDLOCK) WHERE MaNguoiDan=@MaNguoiDan AND TrangThai=1)
   THROW 51001,N'Không tìm thấy hồ sơ người dân đang hoạt động.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.VACCINE WITH(HOLDLOCK) WHERE MaVaccine=@MaVaccine AND TrangThai=1)
   THROW 51000,N'Vaccine không tồn tại hoặc đang ngừng sử dụng.',1;
  IF @MaNhanVienTao IS NOT NULL AND NOT EXISTS(SELECT 1 FROM dbo.TAIKHOAN t JOIN dbo.VAITRO r ON r.MaVaiTro=t.MaVaiTro WHERE t.MaTaiKhoan=@MaNhanVienTao AND t.TrangThai=1 AND r.TrangThai=1 AND r.TenVaiTro IN (N'Nhân viên',N'Quản trị viên'))
   THROW 51002,N'Tài khoản lập lịch không có quyền.',1;
  IF EXISTS(SELECT 1 FROM dbo.CHONGCHIDINH WHERE MaNguoiDan=@MaNguoiDan AND TrangThai=N'Đã xác nhận')
   THROW 51003,N'Hồ sơ có chống chỉ định đang hiệu lực; cần nhân viên y tế đánh giá.',1;
  DECLARE @OldBatch int, @OldStatus nvarchar(50), @ExistingCitizen int, @OldFacility int;
  IF @MaLichTiem IS NOT NULL
  BEGIN
   SELECT @OldBatch=MaLoDuKien,@OldStatus=TrangThai,@ExistingCitizen=MaNguoiDan,@OldFacility=MaCoSoTiem FROM dbo.LICHTIEM WITH(UPDLOCK,HOLDLOCK) WHERE MaLichTiem=@MaLichTiem;
   IF @ExistingCitizen IS NULL THROW 51001,N'Không tìm thấy lịch tiêm.',1;
   IF dbo.fn_CoSoDuocPhep(@MaNhanVienTao,@OldFacility)=0 THROW 51002,N'Không được sửa lịch thuộc cơ sở ngoài phạm vi phân công.',1;
   IF @ExistingCitizen<>@MaNguoiDan THROW 51003,N'Không được chuyển lịch sang người dân khác.',1;
   IF @OldStatus NOT IN (N'Đã lên lịch',N'Đã xác nhận') THROW 51003,N'Lịch đã đóng; không thể sửa.',1;
  END;
  IF EXISTS(SELECT 1 FROM dbo.LICHTIEM WITH(UPDLOCK,HOLDLOCK) WHERE MaNguoiDan=@MaNguoiDan AND MaVaccine=@MaVaccine AND TrangThai IN(N'Đã lên lịch',N'Đã xác nhận') AND (@MaLichTiem IS NULL OR MaLichTiem<>@MaLichTiem))
   THROW 51003,N'Đã có lịch tiêm vaccine này đang chờ xử lý.',1;
  IF EXISTS(SELECT 1 FROM dbo.MUITIEM WHERE MaNguoiDan=@MaNguoiDan AND MaVaccine=@MaVaccine AND MuiSo=@MuiSo)
   THROW 51003,N'Mũi vaccine này đã được ghi nhận.',1;
  IF @OldBatch IS NOT NULL
  BEGIN
   UPDATE dbo.LOVACCINE SET SoLuongDatTruoc=SoLuongDatTruoc-1 WHERE MaLo=@OldBatch AND SoLuongDatTruoc>0;
   IF @@ROWCOUNT=0 THROW 51003,N'Số lượng giữ chỗ không nhất quán; cần kiểm tra dữ liệu.',1;
  END;
  IF @MaLoDuKien IS NULL
   SELECT TOP(1) @MaLoDuKien=MaLo FROM dbo.LOVACCINE WITH(UPDLOCK,HOLDLOCK)
   WHERE MaVaccine=@MaVaccine AND MaCoSoTiem=@MaCoSoTiem AND TrangThai=N'Đang sử dụng' AND HanSuDung>=CAST(DATEADD(hour,7,@NgayDuKien) AS date) AND SoLuongCon>SoLuongDatTruoc
   ORDER BY HanSuDung,MaLo;
  IF NOT EXISTS(SELECT 1 FROM dbo.LOVACCINE WITH(UPDLOCK,HOLDLOCK) WHERE MaLo=@MaLoDuKien AND MaVaccine=@MaVaccine AND MaCoSoTiem=@MaCoSoTiem AND TrangThai=N'Đang sử dụng' AND HanSuDung>=CAST(DATEADD(hour,7,@NgayDuKien) AS date) AND SoLuongCon>SoLuongDatTruoc)
   THROW 51004,N'Không còn lô vaccine đủ hạn và đủ lượng để giữ chỗ ngày đã chọn.',1;
  UPDATE dbo.LOVACCINE SET SoLuongDatTruoc=SoLuongDatTruoc+1 WHERE MaLo=@MaLoDuKien;
  IF @MaLichTiem IS NULL
  BEGIN
   INSERT dbo.LICHTIEM(MaNguoiDan,MaVaccine,MaLoDuKien,MuiSo,NgayDuKien,CoSoTiem,TrangThai,GhiChu,MaNhanVienTao,MaCoSoTiem)
   VALUES(@MaNguoiDan,@MaVaccine,@MaLoDuKien,@MuiSo,@NgayDuKien,@CoSoTiem,@TrangThai,@GhiChu,@MaNhanVienTao,@MaCoSoTiem);
   SET @MaLichTiem=CONVERT(int,SCOPE_IDENTITY());
  END
  ELSE UPDATE dbo.LICHTIEM SET MaVaccine=@MaVaccine,MaLoDuKien=@MaLoDuKien,MuiSo=@MuiSo,NgayDuKien=@NgayDuKien,CoSoTiem=@CoSoTiem,MaCoSoTiem=@MaCoSoTiem,TrangThai=@TrangThai,GhiChu=@GhiChu,NgayCapNhat=SYSUTCDATETIME() WHERE MaLichTiem=@MaLichTiem;
  COMMIT TRANSACTION;
  IF @ReturnRow=1 SELECT * FROM dbo.LICHTIEM WHERE MaLichTiem=@MaLichTiem;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
  THROW;
 END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_DoiTrangThaiLichTiem
 @MaLichTiem int, @TrangThai nvarchar(50), @MaTaiKhoan int=NULL
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
 IF @MaTaiKhoan IS NULL THROW 51002,N'Cần tài khoản thực hiện để đổi trạng thái lịch.',1;
 IF @TrangThai IS NULL OR @TrangThai NOT IN(N'Đã lên lịch',N'Đã xác nhận',N'Đã tiêm',N'Hoàn thành',N'Đã hủy',N'Vắng mặt')
  THROW 51000,N'Trạng thái lịch không hợp lệ.',1;
 BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @LockResult int;
  EXEC @LockResult=sys.sp_getapplock @Resource=N'VaccinationCommunity.Inventory',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;
  IF @LockResult<0 THROW 51003,N'Hệ thống đang xử lý tồn kho; vui lòng thử lại.',1;
  DECLARE @OldStatus nvarchar(50),@Batch int,@Citizen int,@Date datetime2(0),@Facility int;
  SELECT @OldStatus=TrangThai,@Batch=MaLoDuKien,@Citizen=MaNguoiDan,@Date=NgayDuKien,@Facility=MaCoSoTiem FROM dbo.LICHTIEM WITH(UPDLOCK,HOLDLOCK) WHERE MaLichTiem=@MaLichTiem;
  IF @Citizen IS NULL THROW 51001,N'Không tìm thấy lịch tiêm.',1;
  IF @MaTaiKhoan IS NOT NULL AND NOT EXISTS(SELECT 1 FROM dbo.TAIKHOAN t JOIN dbo.VAITRO r ON r.MaVaiTro=t.MaVaiTro WHERE t.MaTaiKhoan=@MaTaiKhoan AND t.TrangThai=1 AND r.TrangThai=1 AND (dbo.fn_CoSoDuocPhep(@MaTaiKhoan,@Facility)=1 OR (r.TenVaiTro=N'Người dân' AND @TrangThai=N'Đã hủy' AND EXISTS(SELECT 1 FROM dbo.NGUOIDAN n WHERE n.MaNguoiDan=@Citizen AND n.MaTaiKhoan=t.MaTaiKhoan))))
   THROW 51002,N'Không có quyền đổi trạng thái lịch này.',1;
  IF @OldStatus=@TrangThai
  BEGIN
   COMMIT; SELECT * FROM dbo.LICHTIEM WHERE MaLichTiem=@MaLichTiem; RETURN;
  END;
  IF @TrangThai IN(N'Đã tiêm',N'Hoàn thành') AND NOT EXISTS(SELECT 1 FROM dbo.MUITIEM WHERE MaLichTiem=@MaLichTiem)
   THROW 51003,N'Phải ghi nhận mũi tiêm trước khi hoàn thành lịch.',1;
  IF @OldStatus IN(N'Đã hủy',N'Vắng mặt',N'Hoàn thành') OR (@OldStatus=N'Đã tiêm' AND @TrangThai<>N'Hoàn thành')
   THROW 51003,N'Lịch đã đóng; hãy lập lịch mới khi cần.',1;
  IF @TrangThai IN(N'Đã lên lịch',N'Đã xác nhận') AND @OldStatus NOT IN(N'Đã lên lịch',N'Đã xác nhận')
   THROW 51003,N'Không thể mở lại lịch đã đóng.',1;
  IF @TrangThai=N'Vắng mặt' AND @Date>SYSUTCDATETIME()
   THROW 51000,N'Chưa đến ngày hẹn; không thể đánh dấu vắng mặt.',1;
  IF @OldStatus IN(N'Đã lên lịch',N'Đã xác nhận') AND @TrangThai NOT IN(N'Đã lên lịch',N'Đã xác nhận') AND @Batch IS NOT NULL
  BEGIN
   UPDATE dbo.LOVACCINE SET SoLuongDatTruoc=SoLuongDatTruoc-1 WHERE MaLo=@Batch AND SoLuongDatTruoc>0;
   IF @@ROWCOUNT=0 THROW 51003,N'Số lượng giữ chỗ không nhất quán.',1;
  END;
  UPDATE dbo.LICHTIEM SET TrangThai=@TrangThai,NgayCapNhat=SYSUTCDATETIME() WHERE MaLichTiem=@MaLichTiem;
  COMMIT;
  SELECT * FROM dbo.LICHTIEM WHERE MaLichTiem=@MaLichTiem;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK;
  THROW;
 END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_GhiNhanMuiTiem
 @MaNguoiDan int,@MaVaccine int,@MaLo int,@MaLichTiem int=NULL,@MuiSo int,
 @NgayTiem datetime2(0)=NULL,@CoSoTiem nvarchar(255)=NULL,@MaNhanVien int,
 @KetQua nvarchar(255)=N'Đã tiêm',@PhanUngSauTiem nvarchar(2000)=NULL,@GhiChu nvarchar(1000)=NULL,@ReturnRow bit=1,
 @MaCoSoTiem int=NULL
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
 SET @NgayTiem=COALESCE(@NgayTiem,CONVERT(datetime2(0),CONVERT(varchar(19),SYSUTCDATETIME(),126)));
 IF @MaNguoiDan IS NULL OR @MaNguoiDan<=0 OR @MaVaccine IS NULL OR @MaVaccine<=0 OR @MaLo IS NULL OR @MaLo<=0 OR @MuiSo IS NULL OR @MuiSo NOT BETWEEN 1 AND 20 OR @NgayTiem>SYSUTCDATETIME()
  THROW 51000,N'Mũi số hoặc thời điểm tiêm không hợp lệ.',1;
 BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @LockResult int;
  EXEC @LockResult=sys.sp_getapplock @Resource=N'VaccinationCommunity.Inventory',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;
  IF @LockResult<0 THROW 51003,N'Hệ thống đang xử lý tồn kho; vui lòng thử lại.',1;
  IF @MaCoSoTiem IS NULL OR @MaCoSoTiem<=0 THROW 51000,N'Cần chọn cơ sở tiêm từ danh mục TP. Hồ Chí Minh.',1;
  IF dbo.fn_CoSoDuocPhep(@MaNhanVien,@MaCoSoTiem)=0 OR dbo.fn_NguoiDanDuocPhep(@MaNhanVien,@MaNguoiDan)=0
   THROW 51002,N'Nhân viên không được phân công cơ sở hoặc hồ sơ người dân này.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.TAIKHOAN t JOIN dbo.VAITRO r ON r.MaVaiTro=t.MaVaiTro WHERE t.MaTaiKhoan=@MaNhanVien AND t.TrangThai=1 AND r.TrangThai=1 AND r.TenVaiTro IN(N'Nhân viên',N'Quản trị viên'))
   THROW 51002,N'Nhân viên ghi nhận không hợp lệ.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.NGUOIDAN WITH(UPDLOCK,HOLDLOCK) WHERE MaNguoiDan=@MaNguoiDan AND TrangThai=1)
   THROW 51001,N'Không tìm thấy hồ sơ người dân đang hoạt động.',1;
  DECLARE @Existing int;
  SELECT TOP(1) @Existing=MaMuiTiem FROM dbo.MUITIEM WITH(UPDLOCK,HOLDLOCK)
   WHERE (@MaLichTiem IS NOT NULL AND MaLichTiem=@MaLichTiem) OR (MaNguoiDan=@MaNguoiDan AND MaVaccine=@MaVaccine AND MuiSo=@MuiSo);
  IF @Existing IS NOT NULL
  BEGIN
   IF NOT EXISTS(SELECT 1 FROM dbo.MUITIEM WHERE MaMuiTiem=@Existing AND MaNguoiDan=@MaNguoiDan AND MaVaccine=@MaVaccine AND MuiSo=@MuiSo AND MaLo=@MaLo AND MaCoSoTiem=@MaCoSoTiem AND (MaLichTiem=@MaLichTiem OR (MaLichTiem IS NULL AND @MaLichTiem IS NULL)))
    THROW 51003,N'Mũi tiêm hoặc lịch đã được sử dụng với thông tin khác.',1;
   COMMIT;
   IF @ReturnRow=1 SELECT * FROM dbo.MUITIEM WHERE MaMuiTiem=@Existing;
   RETURN;
  END;
  SET @CoSoTiem=NULL;
  SELECT @CoSoTiem=c.TenCoSo FROM dbo.COSOTIEM c WITH(HOLDLOCK)
   JOIN dbo.KHUVUCTIEM k WITH(HOLDLOCK) ON k.MaKhuVuc=c.MaKhuVuc
   WHERE c.MaCoSoTiem=@MaCoSoTiem AND c.TrangThai=1 AND k.TrangThai=1 AND c.TinhThanh=N'Thành phố Hồ Chí Minh';
  IF @CoSoTiem IS NULL THROW 51003,N'Cơ sở tiêm đang ngừng tiếp nhận hoặc chưa được đối soát.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.COSOTIEM_VACCINE WITH(HOLDLOCK) WHERE MaCoSoTiem=@MaCoSoTiem AND MaVaccine=@MaVaccine AND TrangThai=1)
   THROW 51003,N'Cơ sở không triển khai vaccine đã chọn.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.VACCINE WHERE MaVaccine=@MaVaccine AND TrangThai=1)
   THROW 51000,N'Vaccine không tồn tại hoặc đang ngừng sử dụng.',1;
  IF EXISTS(SELECT 1 FROM dbo.CHONGCHIDINH WHERE MaNguoiDan=@MaNguoiDan AND TrangThai=N'Đã xác nhận' AND COALESCE(NgayXacNhan,NgayTao)<=@NgayTiem)
   THROW 51003,N'Hồ sơ có chống chỉ định đang hiệu lực; cần đánh giá y tế.',1;
  IF EXISTS(SELECT 1 FROM dbo.MUITIEM WITH(UPDLOCK,HOLDLOCK) WHERE MaNguoiDan=@MaNguoiDan AND MaVaccine=@MaVaccine AND MuiSo=@MuiSo)
   THROW 51003,N'Mũi vaccine này đã được ghi nhận; không được trừ kho lần hai.',1;
  DECLARE @ReservedBatch int=NULL,@ScheduleStatus nvarchar(50),@ScheduleCitizen int,@ScheduleVaccine int,@ScheduleDose int,@ScheduleFacility int;
  IF @MaLichTiem IS NOT NULL
  BEGIN
   SELECT @ReservedBatch=MaLoDuKien,@ScheduleStatus=TrangThai,@ScheduleCitizen=MaNguoiDan,@ScheduleVaccine=MaVaccine,@ScheduleDose=MuiSo,@ScheduleFacility=MaCoSoTiem FROM dbo.LICHTIEM WITH(UPDLOCK,HOLDLOCK) WHERE MaLichTiem=@MaLichTiem;
   IF @ScheduleCitizen IS NULL THROW 51001,N'Không tìm thấy lịch tiêm.',1;
   IF @ScheduleCitizen<>@MaNguoiDan OR @ScheduleVaccine<>@MaVaccine OR @ScheduleDose<>@MuiSo OR @ScheduleFacility<>@MaCoSoTiem
    THROW 51003,N'Người dân, vaccine hoặc mũi số không khớp lịch.',1;
   IF @ScheduleStatus NOT IN(N'Đã lên lịch',N'Đã xác nhận') OR EXISTS(SELECT 1 FROM dbo.MUITIEM WHERE MaLichTiem=@MaLichTiem)
    THROW 51003,N'Lịch không còn hiệu lực hoặc đã được ghi nhận tiêm.',1;
  END;
  DECLARE @Stock int,@Reservations int,@Expiry date,@BatchVaccine int,@BatchStatus nvarchar(50),@Manufactured date,@BatchFacility int;
  SELECT @Stock=SoLuongCon,@Reservations=SoLuongDatTruoc,@Expiry=HanSuDung,@BatchVaccine=MaVaccine,@BatchStatus=TrangThai,@Manufactured=NgaySanXuat,@BatchFacility=MaCoSoTiem FROM dbo.LOVACCINE WITH(UPDLOCK,HOLDLOCK) WHERE MaLo=@MaLo;
  IF @BatchVaccine IS NULL THROW 51001,N'Không tìm thấy lô vaccine.',1;
  IF @BatchVaccine<>@MaVaccine OR @BatchFacility<>@MaCoSoTiem THROW 51000,N'Lô không thuộc vaccine hoặc cơ sở đã chọn.',1;
  IF @BatchStatus<>N'Đang sử dụng' OR @Expiry<CAST(DATEADD(hour,7,@NgayTiem) AS date) OR @Expiry<CAST(DATEADD(hour,7,SYSUTCDATETIME()) AS date) OR (@Manufactured IS NOT NULL AND @Manufactured>CAST(DATEADD(hour,7,@NgayTiem) AS date))
   THROW 51004,N'Lô vaccine không được sử dụng hoặc không đủ hạn.',1;
  IF @Stock<=0 OR (@ReservedBatch=@MaLo AND @Reservations<=0) OR ((@ReservedBatch IS NULL OR @ReservedBatch<>@MaLo) AND @Stock<=@Reservations)
   THROW 51004,N'Lô vaccine không còn lượng khả dụng.',1;
  IF @ReservedBatch IS NOT NULL AND @ReservedBatch<>@MaLo
  BEGIN
   UPDATE dbo.LOVACCINE SET SoLuongDatTruoc=SoLuongDatTruoc-1 WHERE MaLo=@ReservedBatch AND SoLuongDatTruoc>0;
   IF @@ROWCOUNT=0 THROW 51003,N'Số lượng giữ chỗ không nhất quán.',1;
  END;
  UPDATE dbo.LOVACCINE SET SoLuongCon=SoLuongCon-1,SoLuongDatTruoc=SoLuongDatTruoc-CASE WHEN @ReservedBatch=@MaLo THEN 1 ELSE 0 END,
   TrangThai=CASE WHEN SoLuongCon=1 THEN N'Hết hàng' ELSE TrangThai END WHERE MaLo=@MaLo;
  INSERT dbo.MUITIEM(MaNguoiDan,MaVaccine,MaLo,MaLichTiem,MuiSo,NgayTiem,CoSoTiem,MaNhanVien,KetQua,PhanUngSauTiem,GhiChu,MaCoSoTiem)
  VALUES(@MaNguoiDan,@MaVaccine,@MaLo,@MaLichTiem,@MuiSo,@NgayTiem,@CoSoTiem,@MaNhanVien,COALESCE(@KetQua,N'Đã tiêm'),@PhanUngSauTiem,@GhiChu,@MaCoSoTiem);
  DECLARE @Id int=CONVERT(int,SCOPE_IDENTITY());
  IF @MaLichTiem IS NOT NULL UPDATE dbo.LICHTIEM SET TrangThai=N'Đã tiêm',NgayCapNhat=SYSUTCDATETIME() WHERE MaLichTiem=@MaLichTiem;
  INSERT dbo.THONGBAO(MaNguoiDan,MaLichTiem,TieuDe,NoiDung,ThoiGianGui)
  VALUES(@MaNguoiDan,@MaLichTiem,N'Theo dõi sức khỏe sau tiêm',N'Mũi tiêm đã được ghi nhận. Bạn có thể gửi tình trạng sức khỏe tại mục Theo dõi sau tiêm. Khi có khó thở, ngất hoặc dấu hiệu nguy hiểm, hãy gọi 115 hoặc đến cơ sở y tế ngay; không chờ phản hồi trên website.',SYSUTCDATETIME());
  COMMIT;
  IF @ReturnRow=1 SELECT * FROM dbo.MUITIEM WHERE MaMuiTiem=@Id;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK;
  THROW;
 END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_BaoCaoSauTiem
 @MaTaiKhoan int,@MaMuiTiem int,@KhoiPhatLuc datetime2(0)=NULL,@ThoiLuongGio decimal(6,2)=NULL,
 @NhietDo decimal(4,1)=NULL,@TrieuChung nvarchar(2000)=N'',@MucDo varchar(16)='none',@TrieuChungJson nvarchar(max)=N'[]'
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF @MucDo IS NULL OR @MucDo NOT IN('none','mild','moderate','severe','emergency') OR (@NhietDo IS NOT NULL AND @NhietDo NOT BETWEEN 30 AND 45) OR (@ThoiLuongGio IS NOT NULL AND @ThoiLuongGio NOT BETWEEN 0 AND 8760)
  THROW 51000,N'Dữ liệu theo dõi không hợp lệ.',1;
 IF ISNULL(ISJSON(@TrieuChungJson),0)<>1 OR LEFT(LTRIM(@TrieuChungJson),1)<>'['
  THROW 51000,N'Danh sách triệu chứng phải là mảng JSON.',1;
 IF EXISTS(SELECT 1 FROM OPENJSON(@TrieuChungJson) j LEFT JOIN dbo.DANHMUCTRIEUCHUNG d ON d.MaTrieuChung=j.value AND d.DangHoatDong=1 WHERE j.type<>1 OR d.MaTrieuChung IS NULL)
  THROW 51000,N'Mã triệu chứng không hợp lệ.',1;
 BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @Citizen int,@Vaccinated datetime2(0);
  SELECT @Citizen=m.MaNguoiDan,@Vaccinated=m.NgayTiem FROM dbo.MUITIEM m JOIN dbo.NGUOIDAN n ON n.MaNguoiDan=m.MaNguoiDan JOIN dbo.TAIKHOAN t ON t.MaTaiKhoan=n.MaTaiKhoan JOIN dbo.VAITRO r ON r.MaVaiTro=t.MaVaiTro WHERE m.MaMuiTiem=@MaMuiTiem AND n.MaTaiKhoan=@MaTaiKhoan AND t.TrangThai=1 AND r.TrangThai=1 AND r.TenVaiTro=N'Người dân';
  IF @Citizen IS NULL THROW 51002,N'Chỉ được gửi theo dõi cho mũi tiêm của chính mình.',1;
  IF @KhoiPhatLuc IS NOT NULL AND (@KhoiPhatLuc<@Vaccinated OR @KhoiPhatLuc>SYSUTCDATETIME())
   THROW 51000,N'Thời điểm khởi phát phải từ lúc tiêm đến hiện tại.',1;
  DECLARE @Warning bit=0,@Severity int=CASE @MucDo WHEN 'none' THEN 0 WHEN 'mild' THEN 1 WHEN 'moderate' THEN 2 WHEN 'severe' THEN 3 ELSE 4 END;
  IF EXISTS(SELECT 1 FROM OPENJSON(@TrieuChungJson) j JOIN dbo.DANHMUCTRIEUCHUNG d ON d.MaTrieuChung=j.value WHERE d.LaDauHieuCanhBao=1)
   BEGIN SET @Warning=1; SET @Severity=4; END;
  IF (@NhietDo>=39 OR @NhietDo<35) AND @Severity<3 SET @Severity=3;
  IF @NhietDo>=38.5 AND @Severity<2 SET @Severity=2;
  IF (@NhietDo>=38 OR LEN(LTRIM(RTRIM(COALESCE(@TrieuChung,N''))))>0 OR EXISTS(SELECT 1 FROM OPENJSON(@TrieuChungJson))) AND @Severity<1 SET @Severity=1;
  SET @MucDo=CASE @Severity WHEN 0 THEN 'none' WHEN 1 THEN 'mild' WHEN 2 THEN 'moderate' WHEN 3 THEN 'severe' ELSE 'emergency' END;
  DECLARE @Status varchar(16)=CASE WHEN @Severity>=3 OR @Warning=1 THEN 'escalated' ELSE 'new' END;
  INSERT dbo.THEODOISAUTIEM(MaMuiTiem,MaNguoiDan,KhoiPhatLuc,ThoiLuongGio,NhietDo,TrieuChung,MucDo,CoDauHieuCanhBao,TrangThai)
  VALUES(@MaMuiTiem,@Citizen,@KhoiPhatLuc,@ThoiLuongGio,@NhietDo,COALESCE(@TrieuChung,N''),@MucDo,@Warning,@Status);
  DECLARE @Id int=CONVERT(int,SCOPE_IDENTITY());
  INSERT dbo.THEODOI_TRIEUCHUNG(MaTheoDoi,MaTrieuChung) SELECT DISTINCT @Id,CONVERT(varchar(40),value) FROM OPENJSON(@TrieuChungJson);
  INSERT dbo.THEODOI_LICHSU(MaTheoDoi,MaTaiKhoan,TrangThaiMoi,LanCapNhat,HanhDong,NoiDung)
  VALUES(@Id,@MaTaiKhoan,@Status,1,N'Gửi báo cáo',CASE WHEN @Status='escalated' THEN N'Ưu tiên tiếp nhận do có dấu hiệu cảnh báo hoặc mức độ nặng; không phải chẩn đoán tự động.' ELSE N'Người dân gửi tình trạng sau tiêm.' END);
  COMMIT;
  SELECT * FROM dbo.THEODOISAUTIEM WHERE MaTheoDoi=@Id;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK;
  THROW;
 END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_XuLyTheoDoi
 @MaTaiKhoan int,@MaTheoDoi int,@TrangThai varchar(16),@HuongXuLy nvarchar(2000),
 @HenTheoDoiLuc datetime2(0)=NULL,@LanCapNhatMongDoi int
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
 IF @LanCapNhatMongDoi IS NULL OR @LanCapNhatMongDoi<1 OR @TrangThai IS NULL OR @TrangThai NOT IN('new','reviewing','monitoring','escalated','resolved') OR LEN(LTRIM(RTRIM(COALESCE(@HuongXuLy,N''))))=0
  THROW 51000,N'Cần trạng thái và nội dung xử lý hợp lệ.',1;
 IF @TrangThai='monitoring' AND (@HenTheoDoiLuc IS NULL OR @HenTheoDoiLuc<=SYSUTCDATETIME())
  THROW 51000,N'Hồ sơ đang theo dõi cần hẹn kiểm tra lại trong tương lai.',1;
 IF @HenTheoDoiLuc IS NOT NULL AND @HenTheoDoiLuc<=SYSUTCDATETIME()
  THROW 51000,N'Lần theo dõi tiếp theo phải ở tương lai.',1;
 IF @TrangThai='resolved' SET @HenTheoDoiLuc=NULL;
 BEGIN TRY
  BEGIN TRANSACTION;
  IF NOT EXISTS(SELECT 1 FROM dbo.TAIKHOAN t JOIN dbo.VAITRO r ON r.MaVaiTro=t.MaVaiTro WHERE t.MaTaiKhoan=@MaTaiKhoan AND t.TrangThai=1 AND r.TrangThai=1 AND r.TenVaiTro IN(N'Nhân viên',N'Quản trị viên'))
   THROW 51002,N'Chỉ nhân viên y tế hoặc quản trị viên được xử lý theo dõi.',1;
  DECLARE @Old varchar(16),@Revision int,@Citizen int;
  SELECT @Old=TrangThai,@Revision=LanCapNhat,@Citizen=MaNguoiDan FROM dbo.THEODOISAUTIEM WITH(UPDLOCK,HOLDLOCK) WHERE MaTheoDoi=@MaTheoDoi;
  IF @Old IS NULL THROW 51001,N'Không tìm thấy báo cáo.',1;
  DECLARE @Facility int=(SELECT m.MaCoSoTiem FROM dbo.THEODOISAUTIEM d WITH(HOLDLOCK) JOIN dbo.MUITIEM m WITH(HOLDLOCK) ON m.MaMuiTiem=d.MaMuiTiem WHERE d.MaTheoDoi=@MaTheoDoi);
  IF dbo.fn_CoSoDuocPhep(@MaTaiKhoan,@Facility)=0 THROW 51002,N'Phiếu theo dõi thuộc cơ sở ngoài phạm vi phân công.',1;
  IF @Revision<>@LanCapNhatMongDoi THROW 51003,N'Hồ sơ đã được cập nhật; tải lại trước khi xử lý.',1;
  IF NOT(@Old=@TrangThai OR (@Old='new' AND @TrangThai IN('reviewing','escalated')) OR (@Old='reviewing' AND @TrangThai IN('monitoring','escalated','resolved')) OR (@Old='monitoring' AND @TrangThai IN('reviewing','escalated','resolved')) OR (@Old='escalated' AND @TrangThai IN('reviewing','monitoring','resolved')) OR (@Old='resolved' AND @TrangThai IN('reviewing','escalated')))
   THROW 51003,N'Không được chuyển trạng thái theo dõi theo cách này.',1;
  UPDATE dbo.THEODOISAUTIEM SET TrangThai=@TrangThai,HuongXuLy=@HuongXuLy,HenTheoDoiLuc=@HenTheoDoiLuc,MaNhanVienXuLy=@MaTaiKhoan,ThoiDiemXuLy=SYSUTCDATETIME(),LanCapNhat=LanCapNhat+1,NgayCapNhat=SYSUTCDATETIME() WHERE MaTheoDoi=@MaTheoDoi;
  INSERT dbo.THEODOI_LICHSU(MaTheoDoi,MaTaiKhoan,TrangThaiCu,TrangThaiMoi,LanCapNhat,HanhDong,NoiDung)
  VALUES(@MaTheoDoi,@MaTaiKhoan,@Old,@TrangThai,@Revision+1,N'Cập nhật xử lý',@HuongXuLy);
  INSERT dbo.THONGBAO(MaNguoiDan,TieuDe,NoiDung,ThoiGianGui)
  VALUES(@Citizen,N'Phản hồi theo dõi sau tiêm',@HuongXuLy,SYSUTCDATETIME());
  COMMIT;
  SELECT * FROM dbo.THEODOISAUTIEM WHERE MaTheoDoi=@MaTheoDoi;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK;
  THROW;
 END CATCH;
END;
GO
/* Explicitly invoked, repeatable reminder generation. No SQL Agent/background job
   is silently installed. Date comparisons use the Vietnam calendar (UTC+07). */
CREATE OR ALTER PROCEDURE dbo.usp_TaoNhacLich @DaysAhead int=3
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF @DaysAhead IS NULL OR @DaysAhead NOT BETWEEN 0 AND 30 THROW 51000,N'Số ngày nhắc phải từ 0 đến 30.',1;
 BEGIN TRY
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  BEGIN TRANSACTION;
  DECLARE @LockResult int;
  EXEC @LockResult=sys.sp_getapplock @Resource=N'VaccinationCommunity.Inventory',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;
  IF @LockResult<0 THROW 51003,N'Hệ thống đang xử lý lịch; vui lòng thử lại.',1;
  INSERT dbo.THONGBAO(MaNguoiDan,MaLichTiem,TieuDe,NoiDung,ThoiGianGui)
  SELECT l.MaNguoiDan,l.MaLichTiem,N'Nhắc lịch tiêm',N'Bạn có lịch tiêm '+v.TenVaccine+N' tại '+COALESCE(l.CoSoTiem,N'cơ sở đã đăng ký')+N'. Xem lịch trên website để kiểm tra thời gian.',SYSUTCDATETIME()
  FROM dbo.LICHTIEM l JOIN dbo.VACCINE v ON v.MaVaccine=l.MaVaccine
  WHERE l.TrangThai=N'Đã xác nhận' AND l.NgayDuKien>=SYSUTCDATETIME() AND DATEDIFF(day,CAST(DATEADD(hour,7,SYSUTCDATETIME()) AS date),CAST(DATEADD(hour,7,l.NgayDuKien) AS date)) BETWEEN 0 AND @DaysAhead
   AND NOT EXISTS(SELECT 1 FROM dbo.THONGBAO t WITH(UPDLOCK,HOLDLOCK) WHERE t.MaLichTiem=l.MaLichTiem AND t.TieuDe=N'Nhắc lịch tiêm');
  DECLARE @Created int=@@ROWCOUNT;
  COMMIT;
  SELECT @Created AS created;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK;
  THROW;
 END CATCH;
END;
GO

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

USE [VaccinationCommunity_Demo];
GO
/* DEFINES the opt-in seed procedure. Nothing below runs it automatically.
   To populate this isolated demo database, explicitly execute:
       EXEC dbo.usp_SeedDemo @ConfirmDemo = 1;
   Accounts: admin.demo; nv01..nv12; nd001..nd200.
   Shared local-demo password: Demo@123456. All people/contact data is fictitious.
   Vaccine dose/interval numbers are software fixtures, not clinical guidance. */
/* Optional, additive facility fixtures. No real medical location or contact is
   represented. Re-running does not restore a revoked assignment or overwrite a
   location edited by the administrator. */
CREATE OR ALTER PROCEDURE dbo.usp_SeedFacilityDemo @ConfirmDemo bit=0
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF @ConfirmDemo<>1 THROW 51000,N'Cần xác nhận để tạo dữ liệu cơ sở mô phỏng.',1;
 IF DB_NAME()<>N'VaccinationCommunity_Demo' THROW 51002,N'Chỉ dùng dữ liệu mẫu trong database demo.',1;
 IF EXISTS(SELECT 1 FROM dbo.SCHEMAVERSION WHERE VersionNo=101) RETURN;
 DECLARE @AdminId int=(SELECT t.MaTaiKhoan FROM dbo.TAIKHOAN t JOIN dbo.VAITRO r ON r.MaVaiTro=t.MaVaiTro WHERE t.TenDangNhap='admin.demo' AND r.TenVaiTro=N'Quản trị viên' AND t.TrangThai=1 AND r.TrangThai=1);
 IF @AdminId IS NULL THROW 51003,N'Cần tài khoản admin.demo hợp lệ trước khi tạo cơ sở mẫu.',1;
 BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @Lock int;
  EXEC @Lock=sys.sp_getapplock @Resource=N'VaccinationCommunity.Inventory',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;
  IF @Lock<0 THROW 51003,N'Dữ liệu đang được xử lý.',1;
  DECLARE @Sites TABLE(N int PRIMARY KEY,AreaName nvarchar(150),Ward nvarchar(100),SiteName nvarchar(150),Id int NULL);
  INSERT @Sites(N,AreaName,Ward,SiteName) VALUES
   (1,N'Khu phục vụ Trung tâm',N'Phường Bến Thành',N'Điểm tiêm Bến Thành — DEMO'),
   (2,N'Khu phục vụ Trung tâm',N'Phường Tân Định',N'Điểm tiêm Tân Định — DEMO'),
   (3,N'Khu phục vụ Trung tâm',N'Phường Bình Thạnh',N'Điểm tiêm Bình Thạnh — DEMO'),
   (4,N'Khu phục vụ Trung tâm',N'Phường Phú Nhuận',N'Điểm tiêm Phú Nhuận — DEMO'),
   (5,N'Khu phục vụ phía Đông',N'Phường Thủ Đức',N'Điểm tiêm Thủ Đức — DEMO'),
   (6,N'Khu phục vụ phía Đông',N'Phường An Khánh',N'Điểm tiêm An Khánh — DEMO'),
   (7,N'Khu phục vụ phía Tây',N'Phường Tân Bình',N'Điểm tiêm Tân Bình — DEMO'),
   (8,N'Khu phục vụ phía Tây',N'Phường Bình Tân',N'Điểm tiêm Bình Tân — DEMO'),
   (9,N'Khu phục vụ phía Nam',N'Xã Bình Chánh',N'Điểm tiêm Bình Chánh — DEMO'),
   (10,N'Khu phục vụ phía Nam',N'Xã Nhà Bè',N'Điểm tiêm Nhà Bè — DEMO'),
   (11,N'Khu phục vụ phía Bắc',N'Xã Củ Chi',N'Điểm tiêm Củ Chi — DEMO'),
   (12,N'Khu phục vụ phía Bắc',N'Xã Hóc Môn',N'Điểm tiêm Hóc Môn — DEMO');
  INSERT dbo.KHUVUCTIEM(TenKhuVuc)
   SELECT DISTINCT AreaName FROM @Sites s WHERE NOT EXISTS(SELECT 1 FROM dbo.KHUVUCTIEM k WITH(UPDLOCK,HOLDLOCK) WHERE k.TenKhuVuc=s.AreaName);
  INSERT dbo.COSOTIEM(MaKhuVuc,TenCoSo,DiaChi,PhuongXa,TinhThanh,SoDienThoai,GhiChu)
   SELECT k.MaKhuVuc,s.SiteName,N'Lô mô phỏng '+CONVERT(nvarchar(3),s.N)+N', đường Cộng Đồng (địa chỉ giả lập)',s.Ward,N'Thành phố Hồ Chí Minh',NULL,
    N'Cơ sở và địa chỉ hoàn toàn giả lập cho đồ án. Không phải cơ sở đang hoạt động hoặc địa điểm đến tiêm thực tế. Khu phục vụ là cách nhóm nội bộ, không phải danh mục hành chính chính thức.'
   FROM @Sites s JOIN dbo.KHUVUCTIEM k ON k.TenKhuVuc=s.AreaName WHERE NOT EXISTS(SELECT 1 FROM dbo.COSOTIEM c WITH(UPDLOCK,HOLDLOCK) WHERE c.TenCoSo=s.SiteName);
  UPDATE s SET Id=c.MaCoSoTiem FROM @Sites s JOIN dbo.COSOTIEM c ON c.TenCoSo=s.SiteName;
  INSERT dbo.PHANCONG_COSOTIEM(MaTaiKhoan,MaCoSoTiem,MaNguoiPhanCong)
   SELECT t.MaTaiKhoan,s.Id,@AdminId FROM @Sites s JOIN dbo.TAIKHOAN t
    ON t.TenDangNhap='nv'+RIGHT('00'+CONVERT(varchar(3),s.N),2)
      OR t.TenDangNhap='nv'+RIGHT('00'+CONVERT(varchar(3),CASE WHEN s.N=1 THEN 12 ELSE s.N-1 END),2)
   JOIN dbo.VAITRO r ON r.MaVaiTro=t.MaVaiTro AND r.TenVaiTro=N'Nhân viên' AND r.TrangThai=1
   WHERE t.TrangThai=1 AND NOT EXISTS(SELECT 1 FROM dbo.PHANCONG_COSOTIEM p WITH(UPDLOCK,HOLDLOCK) WHERE p.MaTaiKhoan=t.MaTaiKhoan AND p.MaCoSoTiem=s.Id);
  INSERT dbo.COSOTIEM_VACCINE(MaCoSoTiem,MaVaccine)
   SELECT s.Id,v.MaVaccine FROM @Sites s CROSS JOIN dbo.VACCINE v
    WHERE v.TenVaccine IN(N'Engerix-B',N'Influvac Tetra',N'Gardasil 9',N'Priorix',N'Varivax',N'Prevenar 13',N'Adacel',N'Menactra',N'Bexsero',N'Avaxim 160U',N'Imojev',N'Verorab',N'Typhim Vi',N'Tetavax')
    AND NOT EXISTS(SELECT 1 FROM dbo.COSOTIEM_VACCINE cv WITH(UPDLOCK,HOLDLOCK) WHERE cv.MaCoSoTiem=s.Id AND cv.MaVaccine=v.MaVaccine);
  DECLARE @Now datetime2(0)=SYSUTCDATETIME();
  INSERT dbo.LOVACCINE(MaLoVaccine,MaVaccine,NgaySanXuat,HanSuDung,SoLuongNhap,SoLuongCon,NgayNhap,TrangThai,GhiChu,MaCoSoTiem)
   SELECT 'DEMO-HCM-'+RIGHT('00'+CONVERT(varchar(3),s.N),2)+'-V'+CONVERT(varchar(10),v.MaVaccine),v.MaVaccine,
    DATEADD(day,-500,CAST(@Now AS date)),DATEADD(day,365+s.N*10,CAST(@Now AS date)),250,250,DATEADD(day,-470,@Now),N'Đang sử dụng',N'Tồn kho mô phỏng riêng cho từng cơ sở; không phải lô vaccine thực.',s.Id
   FROM @Sites s JOIN dbo.COSOTIEM_VACCINE cv ON cv.MaCoSoTiem=s.Id JOIN dbo.VACCINE v ON v.MaVaccine=cv.MaVaccine
   WHERE NOT EXISTS(SELECT 1 FROM dbo.LOVACCINE l WITH(UPDLOCK,HOLDLOCK) WHERE l.MaLoVaccine='DEMO-HCM-'+RIGHT('00'+CONVERT(varchar(3),s.N),2)+'-V'+CONVERT(varchar(10),v.MaVaccine));
  INSERT dbo.LICHSUHIEUCHINH(TenBang,MaBanGhi,HanhDong,DuLieuMoi,MaTaiKhoan)
   VALUES('COSOTIEM',0,N'Tạo cấu hình cơ sở DEMO',N'{"facilities":12,"city":"Thành phố Hồ Chí Minh","fictional":true}',@AdminId);
  INSERT dbo.SCHEMAVERSION(VersionNo,Description) VALUES(101,N'Additive opt-in demo: 5 internal service areas, 12 fictional HCM facilities, 24 staff assignments and site-specific vaccine offerings/stock. Existing medical records preserved.');
  COMMIT;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK;
  THROW;
 END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_SeedDemo @ConfirmDemo bit=0
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF @ConfirmDemo<>1 THROW 51000,N'Cần chủ động gọi EXEC dbo.usp_SeedDemo @ConfirmDemo=1 để thêm dữ liệu minh họa.',1;
 IF DB_NAME()<>N'VaccinationCommunity_Demo' THROW 51002,N'Chỉ tạo dữ liệu mẫu trong VaccinationCommunity_Demo.',1;
 IF EXISTS(SELECT 1 FROM dbo.SCHEMAVERSION WHERE VersionNo=100)
 BEGIN
  EXEC dbo.usp_SeedFacilityDemo @ConfirmDemo=1;
  SELECT N'Dữ liệu mẫu đã tồn tại; cấu hình cơ sở được bổ sung một lần, hồ sơ/ngày/mật khẩu cũ được giữ nguyên.' AS KetQua;
  RETURN;
 END;
 IF EXISTS(SELECT 1 FROM dbo.TAIKHOAN WHERE TenDangNhap IN('admin.demo','nv01','nd001'))
  THROW 51003,N'Tên tài khoản mẫu đã tồn tại nhưng thiếu dấu mốc seed; không ghi đè dữ liệu.',1;
 BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @LockResult int;
  EXEC @LockResult=sys.sp_getapplock @Resource=N'VaccinationCommunity.Inventory',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;
  IF @LockResult<0 THROW 51003,N'Hệ thống đang xử lý dữ liệu; vui lòng thử lại.',1;
  DECLARE @Now datetime2(0)=CONVERT(datetime2(0),CONVERT(varchar(19),SYSUTCDATETIME(),126)),@Hash varchar(255)='$2b$10$kh/ON9VfESUNROAP986ZuO7ooSBi.0LYSnnOcLXqpjIt8UOdStm9m';
  DECLARE @AdminRole int=(SELECT MaVaiTro FROM dbo.VAITRO WHERE TenVaiTro=N'Quản trị viên'),
   @StaffRole int=(SELECT MaVaiTro FROM dbo.VAITRO WHERE TenVaiTro=N'Nhân viên'),
   @CitizenRole int=(SELECT MaVaiTro FROM dbo.VAITRO WHERE TenVaiTro=N'Người dân');
  INSERT dbo.TAIKHOAN(TenDangNhap,MatKhau,Email,SoDienThoai,MaVaiTro,NgayTao)
  VALUES('admin.demo',@Hash,'admin.demo@example.test','0900000000',@AdminRole,DATEADD(day,-300,@Now));
  DECLARE @AdminId int=CONVERT(int,SCOPE_IDENTITY());
  DECLARE @Numbers TABLE(N int PRIMARY KEY);
  INSERT @Numbers SELECT TOP(200) ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) FROM sys.all_objects;
  INSERT dbo.TAIKHOAN(TenDangNhap,MatKhau,Email,SoDienThoai,MaVaiTro,NgayTao)
  SELECT 'nv'+RIGHT('00'+CONVERT(varchar(3),N),2),@Hash,'nv'+RIGHT('00'+CONVERT(varchar(3),N),2)+'@example.test',
   '091000'+RIGHT('0000'+CONVERT(varchar(4),N),4),@StaffRole,DATEADD(day,-280+N,@Now) FROM @Numbers WHERE N<=12;
  INSERT dbo.TAIKHOAN(TenDangNhap,MatKhau,Email,SoDienThoai,MaVaiTro,NgayTao)
  SELECT 'nd'+RIGHT('000'+CONVERT(varchar(3),N),3),@Hash,'nd'+RIGHT('000'+CONVERT(varchar(3),N),3)+'@example.test',
   '092000'+RIGHT('0000'+CONVERT(varchar(4),N),4),@CitizenRole,DATEADD(day,-260+(N%20),@Now) FROM @Numbers;
  INSERT dbo.NGUOIDAN(MaTaiKhoan,HoTen,NgaySinh,GioiTinh,CCCD,SoBHYT,SoDienThoai,Email,DiaChi,PhuongXa,QuanHuyen,TinhThanh,NgayTao,NgayCapNhat)
  SELECT t.MaTaiKhoan,
   CASE N%10 WHEN 0 THEN N'Nguyễn' WHEN 1 THEN N'Trần' WHEN 2 THEN N'Lê' WHEN 3 THEN N'Phạm' WHEN 4 THEN N'Hoàng' WHEN 5 THEN N'Vũ' WHEN 6 THEN N'Đặng' WHEN 7 THEN N'Bùi' WHEN 8 THEN N'Đỗ' ELSE N'Võ' END+N' '+
   CASE N%8 WHEN 0 THEN N'Minh Anh' WHEN 1 THEN N'Thành Đạt' WHEN 2 THEN N'Thảo Nguyên' WHEN 3 THEN N'Quang Huy' WHEN 4 THEN N'Ngọc Hà' WHEN 5 THEN N'Hoài Nam' WHEN 6 THEN N'Lan Phương' ELSE N'Đức Long' END,
   DATEADD(day,-(N*31%365),DATEADD(year,-(18+N%58),CAST(@Now AS date))),
   CASE WHEN N%2=0 THEN N'Nữ' ELSE N'Nam' END,
   '9999'+RIGHT('00000000'+CONVERT(varchar(8),N),8),'DEMO'+RIGHT('0000000000'+CONVERT(varchar(10),N),10),
   t.SoDienThoai,t.Email,CONVERT(nvarchar(10),10+N%180)+N' đường '+CASE N%4 WHEN 0 THEN N'Hoa Mai' WHEN 1 THEN N'Bình Minh' WHEN 2 THEN N'Đồng Tâm' ELSE N'An Phú' END,
   CASE N%4 WHEN 0 THEN N'Phường An Khánh' WHEN 1 THEN N'Phường Tân Định' WHEN 2 THEN N'Phường Bình Thạnh' ELSE N'Phường Phú Nhuận' END,
   N'Khu vực trung tâm',N'Thành phố Hồ Chí Minh',t.NgayTao,t.NgayTao
  FROM @Numbers n JOIN dbo.TAIKHOAN t ON t.TenDangNhap='nd'+RIGHT('000'+CONVERT(varchar(3),n.N),3);
  DECLARE @Citizens TABLE(N int PRIMARY KEY,Id int,AccountId int);
  INSERT @Citizens SELECT n.N,g.MaNguoiDan,t.MaTaiKhoan FROM @Numbers n JOIN dbo.TAIKHOAN t ON t.TenDangNhap='nd'+RIGHT('000'+CONVERT(varchar(3),n.N),3) JOIN dbo.NGUOIDAN g ON g.MaTaiKhoan=t.MaTaiKhoan;
  DECLARE @VaccineNames TABLE(N int PRIMARY KEY,Name nvarchar(150),Type nvarchar(100),Manufacturer nvarchar(150),Doses int,Gap int);
  INSERT @VaccineNames VALUES
   (1,N'Engerix-B',N'Viêm gan B',N'GSK',3,30),(2,N'Influvac Tetra',N'Cúm mùa',N'Abbott Biologicals',1,0),
   (3,N'Gardasil 9',N'HPV',N'MSD',3,60),(4,N'Priorix',N'Sởi - quai bị - rubella',N'GSK',2,30),
   (5,N'Varivax',N'Thủy đậu',N'MSD',2,90),(6,N'Prevenar 13',N'Phế cầu',N'Pfizer',2,60),
   (7,N'Adacel',N'Bạch hầu - ho gà - uốn ván',N'Sanofi',1,0),(8,N'Menactra',N'Não mô cầu ACYW',N'Sanofi',2,180),
   (9,N'Bexsero',N'Não mô cầu B',N'GSK',2,30),(10,N'Avaxim 160U',N'Viêm gan A',N'Sanofi',2,180),
   (11,N'Imojev',N'Viêm não Nhật Bản',N'Sanofi',2,365),(12,N'Verorab',N'Dại',N'Sanofi',3,7),
   (13,N'Typhim Vi',N'Thương hàn',N'Sanofi',1,0),(14,N'Tetavax',N'Uốn ván',N'Sanofi',3,30);
  INSERT dbo.VACCINE(TenVaccine,LoaiVaccine,NhaSanXuat,MoTa,SoMuiKhuyenNghi,KhoangCachMui,NgayTao)
  SELECT v.Name,v.Type,v.Manufacturer,N'Danh mục phục vụ bản trình diễn quản lý tiêm chủng. Phác đồ, chỉ định, độ tuổi và khoảng cách thực tế phải do cơ sở y tế xác định; các con số trong dữ liệu mẫu không phải hướng dẫn điều trị.',v.Doses,v.Gap,DATEADD(day,-300,@Now)
  FROM @VaccineNames v WHERE NOT EXISTS(SELECT 1 FROM dbo.VACCINE x WHERE x.TenVaccine=v.Name);
  DECLARE @Vaccines TABLE(N int PRIMARY KEY,Id int,Doses int);
  INSERT @Vaccines SELECT n.N,v.MaVaccine,n.Doses FROM @VaccineNames n JOIN dbo.VACCINE v ON v.TenVaccine=n.Name;
  EXEC dbo.usp_SeedFacilityDemo @ConfirmDemo=1;
  DECLARE @Sites TABLE(N int PRIMARY KEY,Id int,Name nvarchar(150));
  INSERT @Sites SELECT f.N,c.MaCoSoTiem,c.TenCoSo FROM (VALUES
   (1,N'Điểm tiêm Bến Thành — DEMO'),
   (2,N'Điểm tiêm Tân Định — DEMO'),
   (3,N'Điểm tiêm Bình Thạnh — DEMO'),
   (4,N'Điểm tiêm Phú Nhuận — DEMO'),
   (5,N'Điểm tiêm Thủ Đức — DEMO'),
   (6,N'Điểm tiêm An Khánh — DEMO'),
   (7,N'Điểm tiêm Tân Bình — DEMO'),
   (8,N'Điểm tiêm Bình Tân — DEMO'),
   (9,N'Điểm tiêm Bình Chánh — DEMO'),
   (10,N'Điểm tiêm Nhà Bè — DEMO'),
   (11,N'Điểm tiêm Củ Chi — DEMO'),
   (12,N'Điểm tiêm Hóc Môn — DEMO')) f(N,Name) JOIN dbo.COSOTIEM c ON c.TenCoSo=f.Name;
  IF (SELECT COUNT(*) FROM @Sites)<>12 THROW 51003,N'Cấu hình cơ sở mẫu không đầy đủ; không tạo hồ sơ lịch sử không rõ cơ sở.',1;
  DECLARE @FacilityId int,@FacilityName nvarchar(150),@CitizenNo int;
  DECLARE @i int=1,@VaccineId int,@BatchId int,@CitizenId int,@StaffId int,@Dose int,@Date datetime2(0),@ScheduleId int,@VaccineNo int,@BatchCode varchar(50);
  WHILE @i<=30
  BEGIN
   SELECT @VaccineId=Id FROM @Vaccines WHERE N=1+((@i-1)%14);
   SELECT @FacilityId=Id FROM @Sites WHERE N=1+((@i-1)%12);
   SET @BatchCode='DEMO-'+RIGHT('00'+CONVERT(varchar(3),@i),2)+'-'+CONVERT(char(4),YEAR(@Now));
   IF EXISTS(SELECT 1 FROM dbo.LOVACCINE WHERE MaLoVaccine=@BatchCode) THROW 51003,N'Mã lô mẫu đã tồn tại; không ghi đè.',1;
   INSERT dbo.LOVACCINE(MaLoVaccine,MaVaccine,NgaySanXuat,HanSuDung,SoLuongNhap,SoLuongCon,NgayNhap,TrangThai,GhiChu,MaCoSoTiem)
   VALUES(@BatchCode,@VaccineId,DATEADD(day,-500,CAST(@Now AS date)),CASE WHEN @i=30 THEN DATEADD(day,-5,CAST(@Now AS date)) ELSE DATEADD(day,150+@i*7,CAST(@Now AS date)) END,
    100+@i*5,100+@i*5,DATEADD(day,-470,@Now),CASE WHEN @i=29 THEN N'Tạm ngừng' WHEN @i=30 THEN N'Hết hạn' ELSE N'Đang sử dụng' END,N'Lô mô phỏng; không phải lô hàng thực tế.',@FacilityId);
   SET @i+=1;
  END;
  DECLARE @Administrations TABLE(N int PRIMARY KEY,Id int,CitizenId int,VaccineId int,Vaccinated datetime2(0));
  SET @i=1;
  WHILE @i<=300
  BEGIN
   SET @CitizenNo=CASE WHEN @i<=200 THEN @i ELSE @i-200 END;
   SELECT @CitizenId=Id FROM @Citizens WHERE N=@CitizenNo;
   SELECT @FacilityId=Id,@FacilityName=Name FROM @Sites WHERE N=1+((@CitizenNo-1)%12);
   SET @VaccineNo=1+((CASE WHEN @i<=200 THEN @i ELSE @i-200 END-1)%14);
   SET @Dose=1;
   IF @i>200
   BEGIN
    IF (SELECT Doses FROM @Vaccines WHERE N=@VaccineNo)>1 SET @Dose=2;
    ELSE SET @VaccineNo=1+(@VaccineNo%14);
   END;
   SELECT @VaccineId=Id FROM @Vaccines WHERE N=@VaccineNo;
   SELECT TOP(1) @BatchId=MaLo FROM dbo.LOVACCINE WHERE MaVaccine=@VaccineId AND MaCoSoTiem=@FacilityId AND MaLoVaccine LIKE 'DEMO-%' AND TrangThai=N'Đang sử dụng' AND SoLuongCon>SoLuongDatTruoc ORDER BY HanSuDung,MaLo;
   SELECT @StaffId=MaTaiKhoan FROM dbo.TAIKHOAN WHERE TenDangNhap='nv'+RIGHT('00'+CONVERT(varchar(3),1+((@CitizenNo-1)%12)),2);
   DECLARE @FixtureGap int=(SELECT Gap FROM @VaccineNames WHERE N=@VaccineNo);
   SET @Date=CASE WHEN @i<=200 THEN DATEADD(day,-(CASE WHEN @FixtureGap>=365 THEN 410 WHEN @FixtureGap>=180 THEN 240 WHEN @FixtureGap>=90 THEN 150 WHEN @FixtureGap>=60 THEN 120 ELSE 90 END+@i%30),@Now) ELSE DATEADD(hour,-(24+((@i-200)%12)*24+(@i%8)),@Now) END;
   SET @ScheduleId=NULL;
   IF @i<=200
   BEGIN
    /* Reconstruct historical bookings before recording their administrations. */
    UPDATE dbo.LOVACCINE SET SoLuongDatTruoc=SoLuongDatTruoc+1 WHERE MaLo=@BatchId;
    INSERT dbo.LICHTIEM(MaNguoiDan,MaVaccine,MaLoDuKien,MuiSo,NgayDuKien,CoSoTiem,TrangThai,MaNhanVienTao,NgayTao,NgayCapNhat,GhiChu,MaCoSoTiem)
    VALUES(@CitizenId,@VaccineId,@BatchId,@Dose,@Date,@FacilityName,N'Đã xác nhận',@StaffId,DATEADD(day,-7,@Date),@Date,N'Lịch sử mẫu đã được thực hiện.',@FacilityId);
    SET @ScheduleId=CONVERT(int,SCOPE_IDENTITY());
   END;
   EXEC dbo.usp_GhiNhanMuiTiem @MaNguoiDan=@CitizenId,@MaVaccine=@VaccineId,@MaLo=@BatchId,@MaLichTiem=@ScheduleId,@MuiSo=@Dose,@NgayTiem=@Date,@MaCoSoTiem=@FacilityId,@MaNhanVien=@StaffId,@KetQua=N'Đã tiêm',@GhiChu=N'Dữ liệu trình diễn giả lập, không phải hồ sơ bệnh nhân thực.',@ReturnRow=0;
   INSERT @Administrations SELECT @i,MaMuiTiem,MaNguoiDan,MaVaccine,NgayTiem FROM dbo.MUITIEM WHERE MaNguoiDan=@CitizenId AND MaVaccine=@VaccineId AND MuiSo=@Dose;
   SET @i+=1;
  END;
  /* Current appointments: reserve one usable dose each via the production SP. */
  SET @i=141;
  WHILE @i<=200
  BEGIN
   SELECT @CitizenId=Id FROM @Citizens WHERE N=@i;
   SELECT @FacilityId=Id FROM @Sites WHERE N=1+((@i-1)%12);
   SET @VaccineNo=1+((@i-1)%14); SET @Dose=2;
   IF (SELECT Doses FROM @Vaccines WHERE N=@VaccineNo)=1 BEGIN SET @VaccineNo=1+(@VaccineNo%14); SET @Dose=1; END;
   SELECT @VaccineId=Id FROM @Vaccines WHERE N=@VaccineNo;
   SET @Date=DATEADD(hour,1+(@i%8),DATEADD(day,1+(@i%28),CAST(CAST(@Now AS date) AS datetime2(0))));
   DECLARE @Status nvarchar(50)=CASE WHEN @i%3=0 THEN N'Đã lên lịch' ELSE N'Đã xác nhận' END;
   EXEC dbo.usp_LuuLichTiem @MaNguoiDan=@CitizenId,@MaVaccine=@VaccineId,@MuiSo=@Dose,@NgayDuKien=@Date,@MaCoSoTiem=@FacilityId,@TrangThai=@Status,@GhiChu=N'Lịch hẹn mẫu cho bản trình diễn.',@MaNhanVienTao=@AdminId,@ReturnRow=0;
   SET @i+=1;
  END;
  /* Closed appointments consume no reservation. */
  INSERT dbo.LICHTIEM(MaNguoiDan,MaVaccine,MuiSo,NgayDuKien,CoSoTiem,TrangThai,GhiChu,MaNhanVienTao,MaCoSoTiem)
  SELECT c.Id,v.Id,2,DATEADD(day,-1-n.N,@Now),s.Name,CASE WHEN n.N%2=0 THEN N'Đã hủy' ELSE N'Vắng mặt' END,N'Lịch hẹn mẫu đã đóng; không giữ tồn kho.',@AdminId,s.Id
  FROM @Numbers n JOIN @Citizens c ON c.N=100+n.N JOIN @Vaccines v ON v.N=1+(n.N%14) JOIN @Sites s ON s.N=1+((100+n.N-1)%12) WHERE n.N<=20;
  /* Contraindications are sample records added after historical administrations;
     they do not retroactively imply an unsafe historical administration. */
  INSERT dbo.CHONGCHIDINH(MaNguoiDan,NoiDung,NgayXacNhan,MaNguoiXacNhan,TrangThai,GhiChu,MaCoSoTiem)
  SELECT c.Id,CASE n.N%3 WHEN 0 THEN N'Tạm hoãn do bệnh cấp tính; cần tái khám sàng lọc.' WHEN 1 THEN N'Tiền sử phản ứng cần được bác sĩ đánh giá trước khi chỉ định.' ELSE N'Cần bổ sung hồ sơ chuyên khoa trước buổi tiêm tiếp theo.' END,
   DATEADD(hour,-n.N,@Now),@AdminId,CASE WHEN n.N%4=0 THEN N'Đã hủy' ELSE N'Đã xác nhận' END,N'Tình huống giả lập cho quy trình sàng lọc, không phải chẩn đoán.',s.Id
  FROM @Numbers n JOIN @Citizens c ON c.N=120+n.N JOIN @Sites s ON s.N=1+((120+n.N-1)%12) WHERE n.N<=18;
  /* 90 dated follow-up reports and a genuine append-only event trail. */
  SET @i=1;
  WHILE @i<=90
  BEGIN
   DECLARE @AdministrationId int,@AccountId int,@ReportDate datetime2(0),@Onset datetime2(0),@CaseId int,@Severity varchar(16),@CaseStatus varchar(16),@Warning bit,@Temp decimal(4,1),@Symptoms nvarchar(2000),@SymptomCode varchar(40);
   SELECT @AdministrationId=Id,@CitizenId=CitizenId,@Date=Vaccinated FROM @Administrations WHERE N=200+@i;
   SELECT @AccountId=MaTaiKhoan FROM dbo.NGUOIDAN WHERE MaNguoiDan=@CitizenId;
   SET @ReportDate=DATEADD(hour,8,@Date); SET @Onset=DATEADD(hour,4,@Date);
   SET @Severity=CASE WHEN @i%30=0 THEN 'emergency' WHEN @i%15=0 THEN 'severe' WHEN @i%7=0 THEN 'moderate' WHEN @i%3=0 THEN 'none' ELSE 'mild' END;
   SET @Warning=CASE WHEN @Severity='emergency' THEN 1 ELSE 0 END;
   SET @Temp=CASE @Severity WHEN 'none' THEN 36.7 WHEN 'mild' THEN 37.4 WHEN 'moderate' THEN 38.6 WHEN 'severe' THEN 39.1 ELSE 37.0 END;
   SET @Symptoms=CASE @Severity WHEN 'none' THEN N'' WHEN 'mild' THEN N'Đau nhẹ tại chỗ tiêm và hơi mệt. Báo cáo giả lập.' WHEN 'moderate' THEN N'Sốt và đau đầu; cần nhân viên hướng dẫn. Báo cáo giả lập.' WHEN 'severe' THEN N'Sốt cao kéo dài; đã liên hệ cơ sở y tế. Báo cáo giả lập.' ELSE N'Khó thở; đã gọi cấp cứu và được tiếp nhận trực tiếp. Tình huống giả lập.' END;
   SET @SymptomCode=CASE @Severity WHEN 'none' THEN NULL WHEN 'mild' THEN 'injection_pain' WHEN 'moderate' THEN 'fever' WHEN 'severe' THEN 'fever' ELSE 'breathing_difficulty' END;
   SET @CaseStatus=CASE WHEN @i%11=0 THEN CASE WHEN @Severity IN('severe','emergency') THEN 'escalated' ELSE 'new' END WHEN @i%5=0 THEN 'monitoring' WHEN @i%4=0 THEN 'reviewing' ELSE 'resolved' END;
   INSERT dbo.THEODOISAUTIEM(MaMuiTiem,MaNguoiDan,ThoiDiemBaoCao,KhoiPhatLuc,ThoiLuongGio,NhietDo,TrieuChung,MucDo,CoDauHieuCanhBao,TrangThai,NgayTao,NgayCapNhat)
   VALUES(@AdministrationId,@CitizenId,@ReportDate,CASE WHEN @Severity='none' THEN NULL ELSE @Onset END,CASE WHEN @Severity='none' THEN NULL ELSE 4 END,@Temp,@Symptoms,@Severity,@Warning,CASE WHEN @Severity IN('severe','emergency') THEN 'escalated' ELSE 'new' END,@ReportDate,@ReportDate);
   SET @CaseId=CONVERT(int,SCOPE_IDENTITY());
   IF @SymptomCode IS NOT NULL INSERT dbo.THEODOI_TRIEUCHUNG(MaTheoDoi,MaTrieuChung) VALUES(@CaseId,@SymptomCode);
   INSERT dbo.THEODOI_LICHSU(MaTheoDoi,MaTaiKhoan,TrangThaiMoi,LanCapNhat,HanhDong,NoiDung,NgayTao)
   VALUES(@CaseId,@AccountId,CASE WHEN @Severity IN('severe','emergency') THEN 'escalated' ELSE 'new' END,1,N'Gửi báo cáo',N'Báo cáo tình trạng sức khỏe giả lập.',@ReportDate);
   IF @CaseStatus NOT IN('new','escalated')
   BEGIN
    SELECT @StaffId=MaTaiKhoan FROM dbo.TAIKHOAN WHERE TenDangNhap='nv'+RIGHT('00'+CONVERT(varchar(3),1+((@i-1)%12)),2);
    UPDATE dbo.THEODOISAUTIEM SET TrangThai='reviewing',HuongXuLy=N'Nhân viên đã tiếp nhận và liên hệ người dân.',MaNhanVienXuLy=@StaffId,ThoiDiemXuLy=DATEADD(hour,1,@ReportDate),LanCapNhat=2,NgayCapNhat=DATEADD(hour,1,@ReportDate) WHERE MaTheoDoi=@CaseId;
    INSERT dbo.THEODOI_LICHSU(MaTheoDoi,MaTaiKhoan,TrangThaiCu,TrangThaiMoi,LanCapNhat,HanhDong,NoiDung,NgayTao)
    VALUES(@CaseId,@StaffId,CASE WHEN @Severity IN('severe','emergency') THEN 'escalated' ELSE 'new' END,'reviewing',2,N'Tiếp nhận',N'Đã liên hệ để đánh giá và hướng dẫn; nội dung trình diễn.',DATEADD(hour,1,@ReportDate));
    IF @CaseStatus<>'reviewing'
    BEGIN
     DECLARE @Response nvarchar(2000)=CASE WHEN @CaseStatus='resolved' THEN N'Đã liên hệ, cập nhật tình trạng ổn định và kết thúc theo dõi theo đánh giá của nhân viên. Nếu có dấu hiệu mới, liên hệ cơ sở y tế. Nội dung giả lập.' ELSE N'Đã liên hệ và hẹn cập nhật tình trạng. Nếu có khó thở, ngất hoặc dấu hiệu nguy hiểm, gọi 115 hoặc đến cơ sở y tế ngay. Nội dung giả lập.' END;
     UPDATE dbo.THEODOISAUTIEM SET TrangThai=@CaseStatus,HuongXuLy=@Response,HenTheoDoiLuc=CASE WHEN @CaseStatus='monitoring' THEN DATEADD(hour,4+@i%36,@Now) ELSE NULL END,ThoiDiemXuLy=DATEADD(hour,2,@ReportDate),LanCapNhat=3,NgayCapNhat=DATEADD(hour,2,@ReportDate) WHERE MaTheoDoi=@CaseId;
     INSERT dbo.THEODOI_LICHSU(MaTheoDoi,MaTaiKhoan,TrangThaiCu,TrangThaiMoi,LanCapNhat,HanhDong,NoiDung,NgayTao)
     VALUES(@CaseId,@StaffId,'reviewing',@CaseStatus,3,N'Cập nhật xử lý',@Response,DATEADD(hour,2,@ReportDate));
    END;
   END;
   SET @i+=1;
  END;
  INSERT dbo.THONGBAO(MaNguoiDan,TieuDe,NoiDung,ThoiGianGui,DaDoc,NgayTao)
  SELECT Id,N'Chào mừng đến Cộng đồng Tiêm chủng',N'Hồ sơ và liên hệ trong tài khoản này là dữ liệu mẫu. Kiểm tra lịch hẹn, lịch sử tiêm và báo cáo tình trạng sau tiêm trên website.',DATEADD(day,-20,@Now),CASE WHEN N%3=0 THEN 1 ELSE 0 END,DATEADD(day,-20,@Now) FROM @Citizens;
  INSERT dbo.SCHEMAVERSION(VersionNo,Description) VALUES(100,N'Demo fixtures: 200 citizens, 12 staff, 14 vaccines, 198 site batches, 12 HCM demo facilities, 300 administrations, 60 future appointments and 90 follow-up reports; UTC-relative dates at first seed.');
  COMMIT;
  SELECT N'Tạo dữ liệu mẫu thành công. Chạy 05-verify.sql để kiểm tra số lượng và tính nhất quán.' AS KetQua;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK;
  THROW;
 END CATCH;
END;
GO

USE [VaccinationCommunity_Demo];
GO
SET NOCOUNT ON;
SELECT N'TAIKHOAN' AS Entity,COUNT_BIG(*) AS Records FROM dbo.TAIKHOAN
UNION ALL SELECT N'NGUOIDAN',COUNT_BIG(*) FROM dbo.NGUOIDAN
UNION ALL SELECT N'VACCINE',COUNT_BIG(*) FROM dbo.VACCINE
UNION ALL SELECT N'LOVACCINE',COUNT_BIG(*) FROM dbo.LOVACCINE
UNION ALL SELECT N'LICHTIEM',COUNT_BIG(*) FROM dbo.LICHTIEM
UNION ALL SELECT N'MUITIEM',COUNT_BIG(*) FROM dbo.MUITIEM
UNION ALL SELECT N'CHONGCHIDINH',COUNT_BIG(*) FROM dbo.CHONGCHIDINH
UNION ALL SELECT N'THONGBAO',COUNT_BIG(*) FROM dbo.THONGBAO
UNION ALL SELECT N'THEODOISAUTIEM',COUNT_BIG(*) FROM dbo.THEODOISAUTIEM
UNION ALL SELECT N'THEODOI_TRIEUCHUNG',COUNT_BIG(*) FROM dbo.THEODOI_TRIEUCHUNG
UNION ALL SELECT N'THEODOI_LICHSU',COUNT_BIG(*) FROM dbo.THEODOI_LICHSU
UNION ALL SELECT N'KHUVUCTIEM',COUNT_BIG(*) FROM dbo.KHUVUCTIEM
UNION ALL SELECT N'COSOTIEM',COUNT_BIG(*) FROM dbo.COSOTIEM
UNION ALL SELECT N'PHANCONG_COSOTIEM',COUNT_BIG(*) FROM dbo.PHANCONG_COSOTIEM
UNION ALL SELECT N'COSOTIEM_VACCINE',COUNT_BIG(*) FROM dbo.COSOTIEM_VACCINE;
SELECT TrangThai,COUNT(*) AS SoLich FROM dbo.LICHTIEM GROUP BY TrangThai;
SELECT MucDo,TrangThai,COUNT(*) AS SoBaoCao FROM dbo.THEODOISAUTIEM GROUP BY MucDo,TrangThai ORDER BY MucDo,TrangThai;
/* The following anomaly checks must all return zero rows. */
SELECT N'Reservation mismatch' AS Problem,b.MaLo,b.SoLuongDatTruoc,COUNT(l.MaLichTiem) AS ActualReservations
FROM dbo.LOVACCINE b LEFT JOIN dbo.LICHTIEM l ON l.MaLoDuKien=b.MaLo AND l.TrangThai IN(N'Đã lên lịch',N'Đã xác nhận')
GROUP BY b.MaLo,b.SoLuongDatTruoc HAVING b.SoLuongDatTruoc<>COUNT(l.MaLichTiem);
SELECT N'Invalid inventory' AS Problem,* FROM dbo.LOVACCINE
WHERE SoLuongCon<0 OR SoLuongCon>SoLuongNhap OR SoLuongDatTruoc<0 OR SoLuongDatTruoc>SoLuongCon;
SELECT N'Invalid dose/batch relationship' AS Problem,m.MaMuiTiem FROM dbo.MUITIEM m JOIN dbo.LOVACCINE b ON b.MaLo=m.MaLo WHERE m.MaVaccine<>b.MaVaccine OR m.MaCoSoTiem<>b.MaCoSoTiem;
SELECT N'Invalid follow-up ownership' AS Problem,d.MaTheoDoi FROM dbo.THEODOISAUTIEM d JOIN dbo.MUITIEM m ON m.MaMuiTiem=d.MaMuiTiem WHERE d.MaNguoiDan<>m.MaNguoiDan;
SELECT N'Duplicate dose' AS Problem,MaNguoiDan,MaVaccine,MuiSo,COUNT(*) AS n FROM dbo.MUITIEM GROUP BY MaNguoiDan,MaVaccine,MuiSo HAVING COUNT(*)>1;
SELECT N'Duplicate active appointment' AS Problem,MaNguoiDan,MaVaccine,COUNT(*) AS n FROM dbo.LICHTIEM WHERE TrangThai IN(N'Đã lên lịch',N'Đã xác nhận') GROUP BY MaNguoiDan,MaVaccine HAVING COUNT(*)>1;
SELECT N'Revision missing audit' AS Problem,d.MaTheoDoi,d.LanCapNhat FROM dbo.THEODOISAUTIEM d
WHERE NOT EXISTS(SELECT 1 FROM dbo.THEODOI_LICHSU h WHERE h.MaTheoDoi=d.MaTheoDoi AND h.LanCapNhat=d.LanCapNhat);
/* Only demo batches have known opening balances. These should match exactly. */
SELECT N'Demo stock ledger mismatch' AS Problem,b.MaLo,b.SoLuongNhap,b.SoLuongCon,COUNT(m.MaMuiTiem) AS Administrations
FROM dbo.LOVACCINE b LEFT JOIN dbo.MUITIEM m ON m.MaLo=b.MaLo WHERE b.MaLoVaccine LIKE 'DEMO-%'
GROUP BY b.MaLo,b.SoLuongNhap,b.SoLuongCon HAVING b.SoLuongNhap-b.SoLuongCon<>COUNT(m.MaMuiTiem);
SELECT N'Appointment/batch facility mismatch' AS Problem,l.MaLichTiem FROM dbo.LICHTIEM l JOIN dbo.LOVACCINE b ON b.MaLo=l.MaLoDuKien WHERE l.MaCoSoTiem<>b.MaCoSoTiem;
SELECT N'Dose/appointment facility mismatch' AS Problem,m.MaMuiTiem FROM dbo.MUITIEM m JOIN dbo.LICHTIEM l ON l.MaLichTiem=m.MaLichTiem WHERE m.MaCoSoTiem<>l.MaCoSoTiem;
SELECT N'Non-HCM facility' AS Problem,c.MaCoSoTiem FROM dbo.COSOTIEM c WHERE c.TinhThanh<>N'Thành phố Hồ Chí Minh';
SELECT N'Non-HCM area' AS Problem,k.MaKhuVuc FROM dbo.KHUVUCTIEM k WHERE k.TinhThanh<>N'Thành phố Hồ Chí Minh';
/* Legacy free text was not verified by migration: an inactive holding facility
   is intentional, not an anomaly. Admin reviews it before enabling bookings. */
SELECT c.MaCoSoTiem,c.TenCoSo,c.TrangThai,COUNT_BIG(m.MaMuiTiem) AS MuiLichSuCanDoiSoat
FROM dbo.COSOTIEM c LEFT JOIN dbo.MUITIEM m ON m.MaCoSoTiem=c.MaCoSoTiem
WHERE c.TenCoSo=N'Cơ sở dữ liệu cũ — cần đối soát' GROUP BY c.MaCoSoTiem,c.TenCoSo,c.TrangThai;
SELECT * FROM dbo.vw_CoSoTiemTongQuan ORDER BY MaCoSoTiem;
SELECT name,type_desc FROM sys.objects WHERE schema_id=SCHEMA_ID(N'dbo') AND type IN('P','V','TR','FN') ORDER BY type,name;
GO
