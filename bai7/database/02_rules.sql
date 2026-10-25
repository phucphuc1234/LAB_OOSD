USE QuanLyNhanSuDongA;
GO
ALTER TABLE QuyetDinhKhenThuong ADD FOREIGN KEY(maNhanVien) REFERENCES NhanVien(maNhanVien), FOREIGN KEY(maPhongBan) REFERENCES PhongBan(maPhongBan), CHECK ((loaiDoiTuong=N'CaNhan' AND maNhanVien IS NOT NULL AND maPhongBan IS NULL) OR (loaiDoiTuong=N'TapThe' AND maNhanVien IS NULL AND maPhongBan IS NOT NULL));
ALTER TABLE QuyetDinhKyLuat ADD FOREIGN KEY(maNhanVien) REFERENCES NhanVien(maNhanVien), FOREIGN KEY(maPhongBan) REFERENCES PhongBan(maPhongBan), CHECK ((loaiDoiTuong=N'CaNhan' AND maNhanVien IS NOT NULL AND maPhongBan IS NULL) OR (loaiDoiTuong=N'TapThe' AND maNhanVien IS NULL AND maPhongBan IS NOT NULL));
ALTER TABLE QuyetDinhTuyenDung ADD UNIQUE(maNhanVien), CHECK(ngayKetThucThuViec>=ngayBatDauThuViec), CHECK(ketQuaThuViec IN(N'Cho',N'Dat',N'KhongDat'));
ALTER TABLE HopDongLaoDong ADD CHECK(loaiHopDong IN(N'DaiHan',N'NganHan')), CHECK(ngayKetThuc IS NULL OR ngayKetThuc>=ngayBatDau), CHECK(ngayKy<=ngayBatDau);
ALTER TABLE HoSoBaoHiem ADD CHECK(loaiBaoHiem IN(N'BHYT',N'BHXH')), CHECK(tyLeDongNhanVien BETWEEN 0 AND 1), CHECK(ngayKetThuc IS NULL OR ngayKetThuc>=ngayBatDau);
ALTER TABLE CaLamViec ADD CHECK(soGioLamViec>0 AND soGioLamViec<=24);
ALTER TABLE PhieuPhuTroi ADD CHECK(heSoTinhLuong=1.5), CHECK(hinhThucPhuTroi IN(N'TangCa',N'NgayLe',N'NgayNghi'));
ALTER TABLE ChiTietChamCong ADD UNIQUE(maNhanVien,ngayChamCong,maCa), CHECK(soGioLamThucTe<=24);
ALTER TABLE ChiTietPhanCong ADD UNIQUE(maNhanVien,ngayLamViec,maCa);
ALTER TABLE ChiTietPhuTroi ADD UNIQUE(soPhieuPhuTroi,maNhanVien), CHECK(soGioThucTe<=24);
ALTER TABLE BangLuong ADD UNIQUE(thang,nam), CHECK(soGioCongChuan>0);
ALTER TABLE ChiTietBangLuong ADD UNIQUE(maBangLuong,maNhanVien);
ALTER TABLE PhieuChiKhenThuong ADD UNIQUE(soQuyetDinh), CHECK(phuongThucChi IN(N'TrucTiep',N'QuaLuong'));
ALTER TABLE PhieuThuNopPhat ADD UNIQUE(soQuyetDinh), CHECK(phuongThucThu IN(N'TrucTiep',N'QuaLuong'));
CREATE TABLE PhanBoThuong(soPhieuChi nvarchar(40) NOT NULL REFERENCES PhieuChiKhenThuong(soPhieuChi),maNhanVien nvarchar(40) NOT NULL REFERENCES NhanVien(maNhanVien),soTien decimal(18,2) NOT NULL CHECK(soTien>0),maChiTietLuong nvarchar(40) NULL REFERENCES ChiTietBangLuong(maChiTietLuong),PRIMARY KEY(soPhieuChi,maNhanVien));
CREATE TABLE PhanBoPhat(soPhieuThu nvarchar(40) NOT NULL REFERENCES PhieuThuNopPhat(soPhieuThu),maNhanVien nvarchar(40) NOT NULL REFERENCES NhanVien(maNhanVien),soTien decimal(18,2) NOT NULL CHECK(soTien>0),maChiTietLuong nvarchar(40) NULL REFERENCES ChiTietBangLuong(maChiTietLuong),PRIMARY KEY(soPhieuThu,maNhanVien));
CREATE TABLE CanCuLuong(maChiTietLuong nvarchar(40) REFERENCES ChiTietBangLuong(maChiTietLuong),soQuyetDinh nvarchar(40) REFERENCES QuyetDinh(soQuyetDinh),PRIMARY KEY(maChiTietLuong,soQuyetDinh));
CREATE TABLE CanCuBaoHiem(maChiTietLuong nvarchar(40) REFERENCES ChiTietBangLuong(maChiTietLuong),maHoSoBaoHiem nvarchar(40) REFERENCES HoSoBaoHiem(maHoSoBaoHiem),PRIMARY KEY(maChiTietLuong,maHoSoBaoHiem));
ALTER TABLE ChiTietChamCong ADD maChiTietLuong nvarchar(40) NULL REFERENCES ChiTietBangLuong(maChiTietLuong);
ALTER TABLE ChiTietPhuTroi ADD maChiTietLuong nvarchar(40) NULL REFERENCES ChiTietBangLuong(maChiTietLuong);
GO
CREATE TRIGGER tr_HopDong ON HopDongLaoDong AFTER INSERT,UPDATE AS
BEGIN
 IF EXISTS(SELECT 1 FROM inserted i WHERE NOT EXISTS(SELECT 1 FROM QuyetDinhTuyenDung t JOIN QuyetDinh q ON q.soQuyetDinh=t.soQuyetDinh WHERE t.maNhanVien=i.maNhanVien AND t.ketQuaThuViec=N'Dat' AND q.trangThai=N'DaKy' AND i.ngayKy>t.ngayKetThucThuViec)) THROW 51000,N'Chưa hết thử việc hoặc chưa đạt / quyết định tuyển dụng chưa ký.',1;
END;
GO
CREATE TRIGGER tr_BaoHiem ON HoSoBaoHiem AFTER INSERT,UPDATE AS
BEGIN
 IF EXISTS(SELECT 1 FROM inserted i JOIN HopDongLaoDong h ON h.soHopDong=i.soHopDong WHERE h.loaiHopDong<>N'DaiHan' OR h.maNhanVien<>i.maNhanVien) THROW 51000,N'Bảo hiểm phải thuộc hợp đồng dài hạn của cùng nhân viên.',1;
 IF EXISTS(SELECT 1 FROM inserted i JOIN HoSoBaoHiem h ON h.maNhanVien=i.maNhanVien AND h.loaiBaoHiem=i.loaiBaoHiem AND h.maHoSoBaoHiem<>i.maHoSoBaoHiem AND h.ngayBatDau<=ISNULL(i.ngayKetThuc,'99991231') AND i.ngayBatDau<=ISNULL(h.ngayKetThuc,'99991231')) THROW 51000,N'Trùng thời gian bảo hiểm cùng loại.',1;
END;
GO
CREATE TRIGGER tr_ChamCong ON ChiTietChamCong AFTER INSERT,UPDATE,DELETE AS
BEGIN
 IF EXISTS(SELECT 1 FROM inserted i JOIN BangChamCong b ON b.maBangChamCong=i.maBangChamCong JOIN NhanVien n ON n.maNhanVien=i.maNhanVien WHERE MONTH(i.ngayChamCong)<>b.thang OR YEAR(i.ngayChamCong)<>b.nam OR n.maPhongBan<>b.maPhongBan) THROW 51000,N'Chấm công sai kỳ hoặc đơn vị.',1;
 IF EXISTS(SELECT 1 FROM deleted WHERE maChiTietLuong IS NOT NULL) THROW 51000,N'Công đã tính lương không được sửa/xóa.',1;
END;
GO
CREATE TRIGGER tr_PhuTroi ON ChiTietPhuTroi AFTER INSERT,UPDATE,DELETE AS
BEGIN
 IF EXISTS(SELECT 1 FROM deleted WHERE maChiTietLuong IS NOT NULL) THROW 51000,N'Phụ trội đã tính lương không được sửa/xóa.',1;
 IF EXISTS(SELECT 1 FROM inserted i JOIN PhieuPhuTroi p ON p.soPhieuPhuTroi=i.soPhieuPhuTroi WHERE i.soGioThucTe>p.soGioPhuTroi) THROW 51000,N'Giờ thực tế không vượt giờ phiếu phụ trội.',1;
END;
GO
CREATE TRIGGER tr_PhanCong ON ChiTietPhanCong AFTER INSERT,UPDATE AS
BEGIN
 IF EXISTS(SELECT 1 FROM inserted i JOIN KeHoachPhanCong k ON k.maKeHoach=i.maKeHoach JOIN NhanVien n ON n.maNhanVien=i.maNhanVien WHERE i.ngayLamViec NOT BETWEEN k.ngayBatDauTuan AND k.ngayKetThucTuan OR n.maPhongBan<>k.maPhongBan) THROW 51000,N'Phân công ngoài tuần hoặc sai đơn vị.',1;
END;
GO
