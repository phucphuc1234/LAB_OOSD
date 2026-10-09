USE QuanLyCongTyDuLich;
GO
IF NOT EXISTS(SELECT 1 FROM Tour) BEGIN
 INSERT Tour(TenTour,SoNgay,SoDem,DonGia) VALUES (N'Đà Lạt 3 ngày',3,2,2500000),(N'Phú Quốc 4 ngày',4,3,4500000),(N'Vũng Tàu 2 ngày',2,1,1200000);
END;
IF NOT EXISTS(SELECT 1 FROM KhachHang) BEGIN
 INSERT KhachHang(TenKH,DiaChi,DienThoai) VALUES (N'Nguyễn Văn An',N'Quận 1, TP.HCM','0901000001'),(N'Công ty Minh Anh',N'Thủ Đức, TP.HCM','0901000002'),(N'Trần Thị Bình',N'Bình Thạnh, TP.HCM','0901000003');
END;
IF NOT EXISTS(SELECT 1 FROM NhanVienHDDL) BEGIN
 INSERT NhanVienHDDL(TenNV,LuongCB) VALUES (N'Lê Quốc Hùng',8000000),(N'Phạm Thị Mai',8500000),(N'Ngô Minh Đức',9000000);
END;
IF NOT EXISTS(SELECT 1 FROM ChuyenDi) BEGIN
 INSERT ChuyenDi(MaTour,NgayDi,NgayVe,SoCho) SELECT MaTour,'2027-01-10','2027-01-12',30 FROM Tour WHERE TenTour=N'Đà Lạt 3 ngày';
 INSERT ChuyenDi(MaTour,NgayDi,NgayVe,SoCho) SELECT MaTour,'2027-02-03','2027-02-06',25 FROM Tour WHERE TenTour=N'Phú Quốc 4 ngày';
END;
IF NOT EXISTS(SELECT 1 FROM DiemThamQuan) INSERT DiemThamQuan(TenDiem,DiaDiem,NoiDung,YNghia) VALUES(N'Hồ Xuân Hương',N'Đà Lạt',N'Tham quan hồ',N'Cảnh quan văn hóa'),(N'Dinh Cậu',N'Phú Quốc',N'Tham quan và tìm hiểu di tích',N'Văn hóa địa phương');
IF NOT EXISTS(SELECT 1 FROM TourChang) INSERT TourChang(MaTour,ThuTu,NoiDi,NoiDen,PhuongTien) SELECT TOP 1 MaTour,1,N'TP.HCM',N'Đà Lạt',N'Xe khách' FROM Tour WHERE TenTour=N'Đà Lạt 3 ngày';
IF NOT EXISTS(SELECT 1 FROM NoiDungChan) INSERT NoiDungChan(MaTour,ThuTu,TenNoi,CoDoiPhuongTien,CoNoiAn,CoKhachSan,LoaiKhachSan) SELECT TOP 1 MaTour,1,N'Trung tâm Đà Lạt',0,1,1,3 FROM Tour WHERE TenTour=N'Đà Lạt 3 ngày';
GO
