# Yêu cầu → UML → Form/Service → CSDL → test

UML chung: Class Diagram và UseCase tổng quát; UC04–06 có thêm phân rã và Activity; UC09 có Sequence. Form dùng chung MainForm/EditorForm mở theo bảng tương ứng.

|Yêu cầu|UML|Form / Service|Bảng CSDL|Test|
|---|---|---|---|---|
|Hồ sơ nhân viên|UC01; lớp NhanVien|MainForm/EditorForm → HrService.Save/List|NhanVien|TC01,TC19|
|Phòng ban|UC02; lớp PhongBan|MainForm/EditorForm → HrService.Save/List|PhongBan|TC01|
|Chức vụ|UC03; lớp ChucVu|MainForm/EditorForm → HrService.Save/List|ChucVu|TC01|
|Tuyển dụng|UC04; lớp QuyetDinh, QuyetDinhTuyenDung|MainForm/EditorForm → HrService.Save/List|QuyetDinh, QuyetDinhTuyenDung|TC02|
|Hợp đồng|UC05; lớp HopDongLaoDong|MainForm/EditorForm → HrService.Run|HopDongLaoDong|TC03,TC04|
|Bảo hiểm|UC06; lớp HoSoBaoHiem|MainForm/EditorForm → HrService.Save/List|HoSoBaoHiem|TC04,TC05|
|Bổ nhiệm|UC07; lớp QuyetDinhChucVu|MainForm/EditorForm → HrService.Save/List|QuyetDinhChucVu|TC06|
|Lương quyết định|UC08; lớp QuyetDinhLuong|MainForm/EditorForm → HrService.Save/List|QuyetDinhLuong|TC06,TC18|
|Khen thưởng|UC09; lớp QuyetDinhKhenThuong|MainForm/EditorForm → HrService.Save/List|QuyetDinhKhenThuong|TC07,TC08|
|Kỷ luật|UC10; lớp QuyetDinhKyLuat|MainForm/EditorForm → HrService.Save/List|QuyetDinhKyLuat|TC09|
|Tính lương|UC11; lớp BangLuong, ChiTietBangLuong, CanCuLuong, CanCuBaoHiem|MainForm/EditorForm → HrService.Run|BangLuong, ChiTietBangLuong, CanCuLuong, CanCuBaoHiem|TC15–18|
|Chi thưởng|UC12; lớp PhieuChiKhenThuong, PhanBoThuong|MainForm/EditorForm → HrService.Run|PhieuChiKhenThuong, PhanBoThuong|TC10,TC11,TC17|
|Thu phạt|UC13; lớp PhieuThuNopPhat, PhanBoPhat|MainForm/EditorForm → HrService.Run|PhieuThuNopPhat, PhanBoPhat|TC10,TC11|
|Tra cứu/in bảng lương|UC14; lớp BangLuong, ChiTietBangLuong|MainForm/EditorForm → HrService.Save/List|BangLuong, ChiTietBangLuong|TC19|
|Ca làm việc|UC15; lớp CaLamViec|MainForm/EditorForm → HrService.Save/List|CaLamViec|TC12|
|Phân công tuần|UC16; lớp KeHoachPhanCong, ChiTietPhanCong|MainForm/EditorForm → HrService.Save/List|KeHoachPhanCong, ChiTietPhanCong|TC12|
|Chấm công|UC17; lớp BangChamCong, ChiTietChamCong|MainForm/EditorForm → HrService.Save/List|BangChamCong, ChiTietChamCong|TC13|
|Phụ trội|UC18; lớp PhieuPhuTroi, ChiTietPhuTroi|MainForm/EditorForm → HrService.Run|PhieuPhuTroi, ChiTietPhuTroi|TC14|
|Ký quyết định|UC19; lớp QuyetDinh|MainForm/EditorForm → HrService.Run|QuyetDinh|TC06,TC20|

UC14 hiện thực xem, lọc và xuất CSV để in qua Excel. Không có trình thiết kế báo cáo in riêng. Lớp Domain biểu diễn dữ liệu, Service chứa hành vi và gọi giao dịch CSDL. Phân quyền actor ở UML chưa là cơ chế đăng nhập.
