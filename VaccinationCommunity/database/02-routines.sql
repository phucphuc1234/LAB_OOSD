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
 @MaNhanVienTao int=NULL, @MaLoDuKien int=NULL, @ReturnRow bit=1
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
 IF @MaNguoiDan IS NULL OR @MaNguoiDan<=0 OR @MaVaccine IS NULL OR @MaVaccine<=0 OR @MuiSo IS NULL OR @MuiSo NOT BETWEEN 1 AND 20 OR @NgayDuKien IS NULL OR @NgayDuKien<=SYSUTCDATETIME()
  THROW 51000,N'Ngày hẹn phải ở tương lai và mũi số hợp lệ.',1;
 IF @TrangThai IS NULL OR @TrangThai NOT IN (N'Đã lên lịch',N'Đã xác nhận')
  THROW 51000,N'Chỉ tạo hoặc sửa lịch đang hoạt động.',1;
 BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @LockResult int;
  EXEC @LockResult=sys.sp_getapplock @Resource=N'VaccinationCommunity.Inventory',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;
  IF @LockResult<0 THROW 51003,N'Hệ thống đang xử lý tồn kho; vui lòng thử lại.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.NGUOIDAN WITH(UPDLOCK,HOLDLOCK) WHERE MaNguoiDan=@MaNguoiDan AND TrangThai=1)
   THROW 51001,N'Không tìm thấy hồ sơ người dân đang hoạt động.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.VACCINE WITH(HOLDLOCK) WHERE MaVaccine=@MaVaccine AND TrangThai=1)
   THROW 51000,N'Vaccine không tồn tại hoặc đang ngừng sử dụng.',1;
  IF @MaNhanVienTao IS NOT NULL AND NOT EXISTS(SELECT 1 FROM dbo.TAIKHOAN t JOIN dbo.VAITRO r ON r.MaVaiTro=t.MaVaiTro WHERE t.MaTaiKhoan=@MaNhanVienTao AND t.TrangThai=1 AND r.TrangThai=1 AND r.TenVaiTro IN (N'Nhân viên',N'Quản trị viên'))
   THROW 51002,N'Tài khoản lập lịch không có quyền.',1;
  IF EXISTS(SELECT 1 FROM dbo.CHONGCHIDINH WHERE MaNguoiDan=@MaNguoiDan AND TrangThai=N'Đã xác nhận')
   THROW 51003,N'Hồ sơ có chống chỉ định đang hiệu lực; cần nhân viên y tế đánh giá.',1;
  DECLARE @OldBatch int, @OldStatus nvarchar(50), @ExistingCitizen int;
  IF @MaLichTiem IS NOT NULL
  BEGIN
   SELECT @OldBatch=MaLoDuKien,@OldStatus=TrangThai,@ExistingCitizen=MaNguoiDan FROM dbo.LICHTIEM WITH(UPDLOCK,HOLDLOCK) WHERE MaLichTiem=@MaLichTiem;
   IF @ExistingCitizen IS NULL THROW 51001,N'Không tìm thấy lịch tiêm.',1;
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
   WHERE MaVaccine=@MaVaccine AND TrangThai=N'Đang sử dụng' AND HanSuDung>=CAST(@NgayDuKien AS date) AND SoLuongCon>SoLuongDatTruoc
   ORDER BY HanSuDung,MaLo;
  IF NOT EXISTS(SELECT 1 FROM dbo.LOVACCINE WITH(UPDLOCK,HOLDLOCK) WHERE MaLo=@MaLoDuKien AND MaVaccine=@MaVaccine AND TrangThai=N'Đang sử dụng' AND HanSuDung>=CAST(@NgayDuKien AS date) AND SoLuongCon>SoLuongDatTruoc)
   THROW 51004,N'Không còn lô vaccine đủ hạn và đủ lượng để giữ chỗ ngày đã chọn.',1;
  UPDATE dbo.LOVACCINE SET SoLuongDatTruoc=SoLuongDatTruoc+1 WHERE MaLo=@MaLoDuKien;
  IF @MaLichTiem IS NULL
  BEGIN
   INSERT dbo.LICHTIEM(MaNguoiDan,MaVaccine,MaLoDuKien,MuiSo,NgayDuKien,CoSoTiem,TrangThai,GhiChu,MaNhanVienTao)
   VALUES(@MaNguoiDan,@MaVaccine,@MaLoDuKien,@MuiSo,@NgayDuKien,@CoSoTiem,@TrangThai,@GhiChu,@MaNhanVienTao);
   SET @MaLichTiem=CONVERT(int,SCOPE_IDENTITY());
  END
  ELSE UPDATE dbo.LICHTIEM SET MaVaccine=@MaVaccine,MaLoDuKien=@MaLoDuKien,MuiSo=@MuiSo,NgayDuKien=@NgayDuKien,CoSoTiem=@CoSoTiem,TrangThai=@TrangThai,GhiChu=@GhiChu,NgayCapNhat=SYSUTCDATETIME() WHERE MaLichTiem=@MaLichTiem;
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
  DECLARE @OldStatus nvarchar(50),@Batch int,@Citizen int,@Date datetime2(0);
  SELECT @OldStatus=TrangThai,@Batch=MaLoDuKien,@Citizen=MaNguoiDan,@Date=NgayDuKien FROM dbo.LICHTIEM WITH(UPDLOCK,HOLDLOCK) WHERE MaLichTiem=@MaLichTiem;
  IF @Citizen IS NULL THROW 51001,N'Không tìm thấy lịch tiêm.',1;
  IF @MaTaiKhoan IS NOT NULL AND NOT EXISTS(SELECT 1 FROM dbo.TAIKHOAN t JOIN dbo.VAITRO r ON r.MaVaiTro=t.MaVaiTro WHERE t.MaTaiKhoan=@MaTaiKhoan AND t.TrangThai=1 AND r.TrangThai=1 AND (r.TenVaiTro IN(N'Nhân viên',N'Quản trị viên') OR (@TrangThai=N'Đã hủy' AND EXISTS(SELECT 1 FROM dbo.NGUOIDAN n WHERE n.MaNguoiDan=@Citizen AND n.MaTaiKhoan=t.MaTaiKhoan))))
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
 @KetQua nvarchar(255)=N'Đã tiêm',@PhanUngSauTiem nvarchar(2000)=NULL,@GhiChu nvarchar(1000)=NULL,@ReturnRow bit=1
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
  IF NOT EXISTS(SELECT 1 FROM dbo.TAIKHOAN t JOIN dbo.VAITRO r ON r.MaVaiTro=t.MaVaiTro WHERE t.MaTaiKhoan=@MaNhanVien AND t.TrangThai=1 AND r.TrangThai=1 AND r.TenVaiTro IN(N'Nhân viên',N'Quản trị viên'))
   THROW 51002,N'Nhân viên ghi nhận không hợp lệ.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.NGUOIDAN WITH(UPDLOCK,HOLDLOCK) WHERE MaNguoiDan=@MaNguoiDan AND TrangThai=1)
   THROW 51001,N'Không tìm thấy hồ sơ người dân đang hoạt động.',1;
  DECLARE @Existing int;
  SELECT TOP(1) @Existing=MaMuiTiem FROM dbo.MUITIEM WITH(UPDLOCK,HOLDLOCK)
   WHERE (@MaLichTiem IS NOT NULL AND MaLichTiem=@MaLichTiem) OR (MaNguoiDan=@MaNguoiDan AND MaVaccine=@MaVaccine AND MuiSo=@MuiSo);
  IF @Existing IS NOT NULL
  BEGIN
   IF NOT EXISTS(SELECT 1 FROM dbo.MUITIEM WHERE MaMuiTiem=@Existing AND MaNguoiDan=@MaNguoiDan AND MaVaccine=@MaVaccine AND MuiSo=@MuiSo AND MaLo=@MaLo AND (MaLichTiem=@MaLichTiem OR (MaLichTiem IS NULL AND @MaLichTiem IS NULL)))
    THROW 51003,N'Mũi tiêm hoặc lịch đã được sử dụng với thông tin khác.',1;
   COMMIT;
   IF @ReturnRow=1 SELECT * FROM dbo.MUITIEM WHERE MaMuiTiem=@Existing;
   RETURN;
  END;
  IF NOT EXISTS(SELECT 1 FROM dbo.VACCINE WHERE MaVaccine=@MaVaccine AND TrangThai=1)
   THROW 51000,N'Vaccine không tồn tại hoặc đang ngừng sử dụng.',1;
  IF EXISTS(SELECT 1 FROM dbo.CHONGCHIDINH WHERE MaNguoiDan=@MaNguoiDan AND TrangThai=N'Đã xác nhận' AND COALESCE(NgayXacNhan,NgayTao)<=@NgayTiem)
   THROW 51003,N'Hồ sơ có chống chỉ định đang hiệu lực; cần đánh giá y tế.',1;
  IF EXISTS(SELECT 1 FROM dbo.MUITIEM WITH(UPDLOCK,HOLDLOCK) WHERE MaNguoiDan=@MaNguoiDan AND MaVaccine=@MaVaccine AND MuiSo=@MuiSo)
   THROW 51003,N'Mũi vaccine này đã được ghi nhận; không được trừ kho lần hai.',1;
  DECLARE @ReservedBatch int=NULL,@ScheduleStatus nvarchar(50),@ScheduleCitizen int,@ScheduleVaccine int,@ScheduleDose int;
  IF @MaLichTiem IS NOT NULL
  BEGIN
   SELECT @ReservedBatch=MaLoDuKien,@ScheduleStatus=TrangThai,@ScheduleCitizen=MaNguoiDan,@ScheduleVaccine=MaVaccine,@ScheduleDose=MuiSo FROM dbo.LICHTIEM WITH(UPDLOCK,HOLDLOCK) WHERE MaLichTiem=@MaLichTiem;
   IF @ScheduleCitizen IS NULL THROW 51001,N'Không tìm thấy lịch tiêm.',1;
   IF @ScheduleCitizen<>@MaNguoiDan OR @ScheduleVaccine<>@MaVaccine OR @ScheduleDose<>@MuiSo
    THROW 51003,N'Người dân, vaccine hoặc mũi số không khớp lịch.',1;
   IF @ScheduleStatus NOT IN(N'Đã lên lịch',N'Đã xác nhận') OR EXISTS(SELECT 1 FROM dbo.MUITIEM WHERE MaLichTiem=@MaLichTiem)
    THROW 51003,N'Lịch không còn hiệu lực hoặc đã được ghi nhận tiêm.',1;
  END;
  DECLARE @Stock int,@Reservations int,@Expiry date,@BatchVaccine int,@BatchStatus nvarchar(50),@Manufactured date;
  SELECT @Stock=SoLuongCon,@Reservations=SoLuongDatTruoc,@Expiry=HanSuDung,@BatchVaccine=MaVaccine,@BatchStatus=TrangThai,@Manufactured=NgaySanXuat FROM dbo.LOVACCINE WITH(UPDLOCK,HOLDLOCK) WHERE MaLo=@MaLo;
  IF @BatchVaccine IS NULL THROW 51001,N'Không tìm thấy lô vaccine.',1;
  IF @BatchVaccine<>@MaVaccine THROW 51000,N'Lô không thuộc vaccine đã chọn.',1;
  IF @BatchStatus<>N'Đang sử dụng' OR @Expiry<CAST(@NgayTiem AS date) OR @Expiry<CAST(SYSUTCDATETIME() AS date) OR (@Manufactured IS NOT NULL AND @Manufactured>CAST(@NgayTiem AS date))
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
  INSERT dbo.MUITIEM(MaNguoiDan,MaVaccine,MaLo,MaLichTiem,MuiSo,NgayTiem,CoSoTiem,MaNhanVien,KetQua,PhanUngSauTiem,GhiChu)
  VALUES(@MaNguoiDan,@MaVaccine,@MaLo,@MaLichTiem,@MuiSo,@NgayTiem,@CoSoTiem,@MaNhanVien,COALESCE(@KetQua,N'Đã tiêm'),@PhanUngSauTiem,@GhiChu);
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
