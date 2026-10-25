USE QuanLyNhanSuDongA;
GO
CREATE PROCEDURE sp_XacNhanPhieu @loai nvarchar(10),@id nvarchar(40) AS
BEGIN
 SET XACT_ABORT ON; SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; BEGIN TRAN;
 DECLARE @tong decimal(18,2),@phanbo decimal(18,2),@qd nvarchar(40),@method nvarchar(500),@nv nvarchar(40),@pb nvarchar(40),@money decimal(18,2);
 IF @loai=N'Thuong' BEGIN
 SELECT @tong=soTien,@qd=soQuyetDinh,@method=phuongThucChi FROM PhieuChiKhenThuong WITH(UPDLOCK,HOLDLOCK) WHERE soPhieuChi=@id AND trangThai=N'Nhap';
 SELECT @nv=maNhanVien,@pb=maPhongBan,@money=soTienThuong FROM QuyetDinhKhenThuong WHERE soQuyetDinh=@qd;
 SELECT @phanbo=SUM(soTien) FROM PhanBoThuong WHERE soPhieuChi=@id;
 IF EXISTS(SELECT 1 FROM PhanBoThuong p JOIN NhanVien n ON n.maNhanVien=p.maNhanVien WHERE p.soPhieuChi=@id AND ((@nv IS NOT NULL AND p.maNhanVien<>@nv) OR (@pb IS NOT NULL AND n.maPhongBan<>@pb))) THROW 51000,N'Phân bổ sai đối tượng.',1;
 END ELSE BEGIN
 SELECT @tong=soTien,@qd=soQuyetDinh,@method=phuongThucThu FROM PhieuThuNopPhat WITH(UPDLOCK,HOLDLOCK) WHERE soPhieuThu=@id AND trangThai=N'Nhap';
 SELECT @nv=maNhanVien,@pb=maPhongBan,@money=soTienPhat FROM QuyetDinhKyLuat WHERE soQuyetDinh=@qd;
 SELECT @phanbo=SUM(soTien) FROM PhanBoPhat WHERE soPhieuThu=@id;
 IF EXISTS(SELECT 1 FROM PhanBoPhat p JOIN NhanVien n ON n.maNhanVien=p.maNhanVien WHERE p.soPhieuThu=@id AND ((@nv IS NOT NULL AND p.maNhanVien<>@nv) OR (@pb IS NOT NULL AND n.maPhongBan<>@pb))) THROW 51000,N'Phân bổ sai đối tượng.',1;
 END;
 IF @tong IS NULL OR @tong<=0 OR @tong<>@money THROW 51000,N'Phiếu phải bằng số tiền quyết định và lớn hơn 0.',1;
 IF NOT EXISTS(SELECT 1 FROM QuyetDinh WHERE soQuyetDinh=@qd AND trangThai=N'DaKy') THROW 51000,N'Quyết định chưa ký.',1;
 IF @method=N'QuaLuong' AND ISNULL(@phanbo,0)<>@tong THROW 51000,N'Tổng phân bổ phải bằng tiền phiếu.',1;
 IF @loai=N'Thuong' UPDATE PhieuChiKhenThuong SET trangThai=N'XacNhan',ngayChi=CASE WHEN @method=N'TrucTiep' THEN CONVERT(date,GETDATE()) ELSE NULL END WHERE soPhieuChi=@id;
 ELSE UPDATE PhieuThuNopPhat SET trangThai=N'XacNhan',ngayThu=CASE WHEN @method=N'TrucTiep' THEN CONVERT(date,GETDATE()) ELSE NULL END WHERE soPhieuThu=@id;
 COMMIT;
END;
GO
