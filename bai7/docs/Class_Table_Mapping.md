# Ánh xạ lớp → bảng

Kế thừa dùng Table-per-Type: 5 bảng con dùng PK đồng thời FK đến QuyetDinh. Các bảng phụ phân bổ/căn cứ hiện thực quan hệ nhiều–nhiều.

|Lớp / bảng|Khóa chính|
|---|---|
|PhongBan|maPhongBan|
|ChucVu|maChucVu|
|NhanVien|maNhanVien|
|QuyetDinh|soQuyetDinh|
|QuyetDinhTuyenDung|soQuyetDinh|
|QuyetDinhChucVu|soQuyetDinh|
|QuyetDinhLuong|soQuyetDinh|
|QuyetDinhKhenThuong|soQuyetDinh|
|QuyetDinhKyLuat|soQuyetDinh|
|HopDongLaoDong|soHopDong|
|HoSoBaoHiem|maHoSoBaoHiem|
|CaLamViec|maCa|
|KeHoachPhanCong|maKeHoach|
|ChiTietPhanCong|maChiTietPhanCong|
|BangChamCong|maBangChamCong|
|ChiTietChamCong|maChiTietChamCong|
|PhieuPhuTroi|soPhieuPhuTroi|
|ChiTietPhuTroi|maChiTietPhuTroi|
|BangLuong|maBangLuong|
|ChiTietBangLuong|maChiTietLuong|
|PhieuChiKhenThuong|soPhieuChi|
|PhieuThuNopPhat|soPhieuThu|