USE [VaccinationCommunity_Demo];
GO
/* DEFINES the opt-in seed procedure. Nothing below runs it automatically.
   To populate this isolated demo database, explicitly execute:
       EXEC dbo.usp_SeedDemo @ConfirmDemo = 1;
   Accounts: admin.demo; nv01..nv12; nd001..nd200.
   Shared local-demo password: Demo@123456. All people/contact data is fictitious.
   Vaccine dose/interval numbers are software fixtures, not clinical guidance. */
CREATE OR ALTER PROCEDURE dbo.usp_SeedDemo @ConfirmDemo bit=0
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF @ConfirmDemo<>1 THROW 51000,N'Cần chủ động gọi EXEC dbo.usp_SeedDemo @ConfirmDemo=1 để thêm dữ liệu minh họa.',1;
 IF DB_NAME()<>N'VaccinationCommunity_Demo' THROW 51002,N'Chỉ tạo dữ liệu mẫu trong VaccinationCommunity_Demo.',1;
 IF EXISTS(SELECT 1 FROM dbo.SCHEMAVERSION WHERE VersionNo=100)
 BEGIN
  SELECT N'Dữ liệu mẫu đã tồn tại; không thêm lại, không thay đổi ngày hoặc mật khẩu.' AS KetQua;
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
  DECLARE @i int=1,@VaccineId int,@BatchId int,@CitizenId int,@StaffId int,@Dose int,@Date datetime2(0),@ScheduleId int,@VaccineNo int,@BatchCode varchar(50);
  WHILE @i<=30
  BEGIN
   SELECT @VaccineId=Id FROM @Vaccines WHERE N=1+((@i-1)%14);
   SET @BatchCode='DEMO-'+RIGHT('00'+CONVERT(varchar(3),@i),2)+'-'+CONVERT(char(4),YEAR(@Now));
   IF EXISTS(SELECT 1 FROM dbo.LOVACCINE WHERE MaLoVaccine=@BatchCode) THROW 51003,N'Mã lô mẫu đã tồn tại; không ghi đè.',1;
   INSERT dbo.LOVACCINE(MaLoVaccine,MaVaccine,NgaySanXuat,HanSuDung,SoLuongNhap,SoLuongCon,NgayNhap,TrangThai,GhiChu)
   VALUES(@BatchCode,@VaccineId,DATEADD(day,-500,CAST(@Now AS date)),CASE WHEN @i=30 THEN DATEADD(day,-5,CAST(@Now AS date)) ELSE DATEADD(day,150+@i*7,CAST(@Now AS date)) END,
    100+@i*5,100+@i*5,DATEADD(day,-470,@Now),CASE WHEN @i=29 THEN N'Tạm ngừng' WHEN @i=30 THEN N'Hết hạn' ELSE N'Đang sử dụng' END,N'Lô mô phỏng; không phải lô hàng thực tế.');
   SET @i+=1;
  END;
  DECLARE @Administrations TABLE(N int PRIMARY KEY,Id int,CitizenId int,VaccineId int,Vaccinated datetime2(0));
  SET @i=1;
  WHILE @i<=300
  BEGIN
   SELECT @CitizenId=Id FROM @Citizens WHERE N=CASE WHEN @i<=200 THEN @i ELSE @i-200 END;
   SET @VaccineNo=1+((CASE WHEN @i<=200 THEN @i ELSE @i-200 END-1)%14);
   SET @Dose=1;
   IF @i>200
   BEGIN
    IF (SELECT Doses FROM @Vaccines WHERE N=@VaccineNo)>1 SET @Dose=2;
    ELSE SET @VaccineNo=1+(@VaccineNo%14);
   END;
   SELECT @VaccineId=Id FROM @Vaccines WHERE N=@VaccineNo;
   SELECT TOP(1) @BatchId=MaLo FROM dbo.LOVACCINE WHERE MaVaccine=@VaccineId AND MaLoVaccine LIKE 'DEMO-%' AND TrangThai=N'Đang sử dụng' AND SoLuongCon>SoLuongDatTruoc ORDER BY HanSuDung,MaLo;
   SELECT @StaffId=MaTaiKhoan FROM dbo.TAIKHOAN WHERE TenDangNhap='nv'+RIGHT('00'+CONVERT(varchar(3),1+(@i%12)),2);
   DECLARE @FixtureGap int=(SELECT Gap FROM @VaccineNames WHERE N=@VaccineNo);
   SET @Date=CASE WHEN @i<=200 THEN DATEADD(day,-(CASE WHEN @FixtureGap>=365 THEN 410 WHEN @FixtureGap>=180 THEN 240 WHEN @FixtureGap>=90 THEN 150 WHEN @FixtureGap>=60 THEN 120 ELSE 90 END+@i%30),@Now) ELSE DATEADD(hour,-(24+((@i-200)%12)*24+(@i%8)),@Now) END;
   SET @ScheduleId=NULL;
   IF @i<=50
   BEGIN
    /* Reconstruct historical bookings before recording their administrations. */
    UPDATE dbo.LOVACCINE SET SoLuongDatTruoc=SoLuongDatTruoc+1 WHERE MaLo=@BatchId;
    INSERT dbo.LICHTIEM(MaNguoiDan,MaVaccine,MaLoDuKien,MuiSo,NgayDuKien,CoSoTiem,TrangThai,MaNhanVienTao,NgayTao,NgayCapNhat,GhiChu)
    VALUES(@CitizenId,@VaccineId,@BatchId,@Dose,@Date,N'Trung tâm Tiêm chủng An Tâm',N'Đã xác nhận',@StaffId,DATEADD(day,-7,@Date),@Date,N'Lịch sử mẫu đã được thực hiện.');
    SET @ScheduleId=CONVERT(int,SCOPE_IDENTITY());
   END;
   EXEC dbo.usp_GhiNhanMuiTiem @MaNguoiDan=@CitizenId,@MaVaccine=@VaccineId,@MaLo=@BatchId,@MaLichTiem=@ScheduleId,@MuiSo=@Dose,@NgayTiem=@Date,@CoSoTiem=N'Trung tâm Tiêm chủng An Tâm',@MaNhanVien=@StaffId,@KetQua=N'Đã tiêm',@GhiChu=N'Dữ liệu trình diễn giả lập, không phải hồ sơ bệnh nhân thực.',@ReturnRow=0;
   INSERT @Administrations SELECT @i,MaMuiTiem,MaNguoiDan,MaVaccine,NgayTiem FROM dbo.MUITIEM WHERE MaNguoiDan=@CitizenId AND MaVaccine=@VaccineId AND MuiSo=@Dose;
   SET @i+=1;
  END;
  /* Current appointments: reserve one usable dose each via the production SP. */
  SET @i=141;
  WHILE @i<=200
  BEGIN
   SELECT @CitizenId=Id FROM @Citizens WHERE N=@i;
   SET @VaccineNo=1+((@i-1)%14); SET @Dose=2;
   IF (SELECT Doses FROM @Vaccines WHERE N=@VaccineNo)=1 BEGIN SET @VaccineNo=1+(@VaccineNo%14); SET @Dose=1; END;
   SELECT @VaccineId=Id FROM @Vaccines WHERE N=@VaccineNo;
   SET @Date=DATEADD(hour,1+(@i%8),DATEADD(day,1+(@i%28),CAST(CAST(@Now AS date) AS datetime2(0))));
   DECLARE @Status nvarchar(50)=CASE WHEN @i%3=0 THEN N'Đã lên lịch' ELSE N'Đã xác nhận' END;
   EXEC dbo.usp_LuuLichTiem @MaNguoiDan=@CitizenId,@MaVaccine=@VaccineId,@MuiSo=@Dose,@NgayDuKien=@Date,@CoSoTiem=N'Trung tâm Tiêm chủng An Tâm',@TrangThai=@Status,@GhiChu=N'Lịch hẹn mẫu cho bản trình diễn.',@MaNhanVienTao=NULL,@ReturnRow=0;
   SET @i+=1;
  END;
  /* Closed appointments consume no reservation. */
  INSERT dbo.LICHTIEM(MaNguoiDan,MaVaccine,MuiSo,NgayDuKien,CoSoTiem,TrangThai,GhiChu,MaNhanVienTao)
  SELECT c.Id,v.Id,2,DATEADD(day,-1-n.N,@Now),N'Trạm y tế Bình Minh',CASE WHEN n.N%2=0 THEN N'Đã hủy' ELSE N'Vắng mặt' END,N'Lịch hẹn mẫu đã đóng; không giữ tồn kho.',@AdminId
  FROM @Numbers n JOIN @Citizens c ON c.N=100+n.N JOIN @Vaccines v ON v.N=1+(n.N%14) WHERE n.N<=20;
  /* Contraindications are sample records added after historical administrations;
     they do not retroactively imply an unsafe historical administration. */
  INSERT dbo.CHONGCHIDINH(MaNguoiDan,NoiDung,NgayXacNhan,MaNguoiXacNhan,TrangThai,GhiChu)
  SELECT c.Id,CASE n.N%3 WHEN 0 THEN N'Tạm hoãn do bệnh cấp tính; cần tái khám sàng lọc.' WHEN 1 THEN N'Tiền sử phản ứng cần được bác sĩ đánh giá trước khi chỉ định.' ELSE N'Cần bổ sung hồ sơ chuyên khoa trước buổi tiêm tiếp theo.' END,
   DATEADD(hour,-n.N,@Now),@AdminId,CASE WHEN n.N%4=0 THEN N'Đã hủy' ELSE N'Đã xác nhận' END,N'Tình huống giả lập cho quy trình sàng lọc, không phải chẩn đoán.'
  FROM @Numbers n JOIN @Citizens c ON c.N=120+n.N WHERE n.N<=18;
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
    SELECT @StaffId=MaTaiKhoan FROM dbo.TAIKHOAN WHERE TenDangNhap='nv'+RIGHT('00'+CONVERT(varchar(3),1+(@i%12)),2);
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
  INSERT dbo.SCHEMAVERSION(VersionNo,Description) VALUES(100,N'Demo fixtures: 200 citizens, 12 staff, 14 vaccines, 30 batches, 300 administrations, 60 future appointments and 90 follow-up reports; UTC-relative dates at first seed.');
  COMMIT;
  SELECT N'Tạo dữ liệu mẫu thành công. Chạy 05-verify.sql để kiểm tra số lượng và tính nhất quán.' AS KetQua;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK;
  THROW;
 END CATCH;
END;
GO
