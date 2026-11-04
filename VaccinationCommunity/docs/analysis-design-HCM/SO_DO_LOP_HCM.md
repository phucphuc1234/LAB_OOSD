# Sơ đồ lớp — bản TP. Hồ Chí Minh

**[Mở XML gồm hai trang CL01 và CL02](xml/So_do_lop_HCM.xml).** Các hộp, thuộc tính, hàm và đường nối đều chỉnh sửa được trong draw.io/diagrams.net.

Chọn **File → Open From → Device**, mở file XML rồi chuyển giữa hai tab ở dưới. Phóng to từng nhóm để đọc thuộc tính và chữ ký hàm.

| Trang | Nội dung | Số lượng đối chiếu |
| --- | --- | --- |
| **CL01 — Lớp dữ liệu** | Mô hình lớp logic của dữ liệu lưu trong SQL Server, gồm nghiệp vụ, audit và phiên bản lược đồ | 19 lớp: 18 lớp nghiệp vụ/audit và 1 lớp kỹ thuật; 159 thuộc tính; 34 association |
| **CL02 — Module triển khai** | Các module service/repository thực tế của backend JavaScript và quan hệ phụ thuộc | 26 module; kiểm kê 145 hàm export; 18 dependency service → repository |

## Cách đọc CL01

Tên lớp như `TaiKhoan`, `LichTiem`, `CoSoTiem` biểu diễn dữ liệu nghiệp vụ; tên bảng tương ứng và các thuộc tính được đối chiếu lược đồ. Đây là mô hình phân tích dữ liệu của dự án. Phương thức xử lý thực tế nằm trong các module ở CL02.

- Đường **liền** biểu diễn association theo khóa ngoại. Bội số ở mỗi đầu là `1`, `0..1` hoặc `0..*`. Ví dụ `VaiTro 1 — 0..* TaiKhoan`: mỗi tài khoản có một vai trò; một vai trò có thể chưa có hoặc có nhiều tài khoản.
- `TaiKhoan — NguoiDan` và `LichTiem — MuiTiem` đều là **`0..1` ở cả hai đầu**, theo FK nullable kết hợp unique index có điều kiện.
- Ba lớp nối có khóa ghép: `PhanCongCoSoTiem`, `CoSoTiemVaccine`, `TheoDoiTrieuChung`. Các thuộc tính khóa cùng tạo thành một khóa; từng thuộc tính riêng không nhất thiết duy nhất.
- `PhanCongCoSoTiem` có **hai liên kết đến `TaiKhoan`**: nhân viên được phân công và người thực hiện phân công. Cần đọc tên vai trò/thuộc tính trên từng đường.
- Người dân, nhân viên và quản trị viên được phân biệt bằng dữ liệu vai trò của tài khoản. Sơ đồ lớp giữ `TaiKhoan — VaiTro`; sự kế thừa tác nhân trong sơ đồ use case không chuyển thành kế thừa các lớp tài khoản.
- Phạm vi nhiều cơ sở trong TP. Hồ Chí Minh được thể hiện qua `KhuVucTiem`, `CoSoTiem`, phân công nhân viên và vaccine triển khai tại cơ sở. Lô, lịch, mũi tiêm và chống chỉ định liên kết tới cơ sở bằng mã cơ sở.
- `LichSuHieuChinh.TenBang/MaBanGhi` là tham chiếu logic; `PhienBanLuocDo` là lớp kỹ thuật độc lập. Các đường FK giữ đúng những liên kết có trong database, với quy tắc `NO ACTION` hiện tại.

## Cách đọc CL02

Mỗi hộp là một **module CommonJS có thật** trong `server/services/` hoặc `server/repositories/`. Tên hàm và tham số lấy từ các export hiện tại. Backend sử dụng các hàm và factory; bộ kiểm kê không tìm thấy class JavaScript production tự định nghĩa.

Đường **nét đứt** từ service tới repository biểu diễn dependency import. Các đường này **không có bội số đối tượng**. Một service có thể dùng nhiều repository, chẳng hạn `scheduleService` dùng repository lịch, người dân và vaccine.

Hàm khai báo `async` được phân biệt với hàm thường trả Promise. Riêng `followupService` và `followupRepository` có factory tạo object chứa hàm; các export mặc định là delegate `(...args)`. Chữ ký triển khai cụ thể và dòng nguồn của chúng được giữ trong dữ liệu kiểm kê. Các hộp này không ngụ ý có constructor hoặc quan hệ kế thừa trong mã JavaScript.

## Nguồn đối chiếu

- [Kiểm kê lớp dữ liệu, thuộc tính, association và bội số](sources/class_domain_audit.json).
- [Kiểm kê module, hàm export, imports và dữ liệu được truy cập](sources/class_module_audit.json).
- [Danh mục nội dung và bố cục hai trang](sources/class_HCM_manifest.json).
- [Kết quả kiểm tra XML và đối chiếu sơ đồ](sources/KIEM_TRA_SO_DO_LOP_HCM.json).

Các tệp nguồn ghi dẫn chứng `file:dòng` để kiểm tra lại với lược đồ SQL và backend. Bộ tài liệu này mô tả bản đã có phân công nhiều cơ sở trong TP. Hồ Chí Minh.

Đã kiểm tra XML, vị trí 68 nhãn bội số và 34 tên liên kết; các nhãn không đè lên hộp lớp hoặc lên nhau. Hai trang được render bằng mxGraph trong Chromium. Ứng dụng và database không thay đổi trong lần xuất tài liệu này.

[Xem trước CL01](examples/So_do_lop_CL01_HCM.png) · [Xem trước CL02](examples/Module_CL02_HCM.png).
