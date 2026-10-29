# XML sơ đồ theo mẫu — Cổng theo dõi tiêm chủng cộng đồng

**[Tải toàn bộ bộ XML (.zip)](../../../VaccinationCommunity_XML_theo_mau.zip)**

Bộ sơ đồ đối chiếu mã nguồn tại commit `27fdf334fbb2fb3762498796c8fa4fddf395adbf`. Có **98 sơ đồ**, giữ mã **UC01–UC28** để đối chiếu bảng đặc tả.

Sơ đồ tổng quát chỉ giữ **18 mục tiêu chính**. Đăng nhập, đăng xuất, đổi mật khẩu và tổng quan đều chỉ có **một hình dùng chung**, các tác nhân được nối tới cùng hình đó. Phân rã tăng lên **34 sơ đồ**: PR01–PR28 tương ứng từng UC01–UC28 và PR29–PR34 làm rõ sáu nghiệp vụ phức tạp.

Xem [phân tích các mục tiêu chính và ánh xạ use case](PHAN_TICH_USECASE_CHINH.md).

| Nhóm | Số sơ đồ | XML riêng để dán | Tệp draw.io cả nhóm |
|---|---:|---|---|
| Tổng quát toàn hệ thống | 1 | [Mở thư mục](xml-rieng/XML_dan_Edit_Diagram/01_Use_case_tong_quat) | [Tổng quát](diagrams/01-Use-case-tong-quat.drawio) |
| Phân rã use case | 34 | [Mở thư mục](xml-rieng/XML_dan_Edit_Diagram/02_Phan_ra_use_case) | [Phân rã](diagrams/02-Phan-ra-use-case.drawio) |
| Hoạt động | 28 | [Mở thư mục](xml-rieng/XML_dan_Edit_Diagram/03_Hoat_dong) | [Hoạt động](diagrams/03-Hoat-dong.drawio) |
| Lớp và kiến trúc | 2 | [Mở thư mục](xml-rieng/XML_dan_Edit_Diagram/04_Lop_va_kien_truc) | [Lớp/kiến trúc](diagrams/04-Lop-va-kien-truc.drawio) |
| ERD tổng thể và chi tiết | 5 | [Mở thư mục](xml-rieng/XML_dan_Edit_Diagram/05_ERD) | [ERD](diagrams/05-ERD.drawio) |
| Tuần tự | 28 | [Mở thư mục](xml-rieng/XML_dan_Edit_Diagram/06_Tuan_tu) | [Tuần tự](diagrams/06-Tuan-tu.drawio) |

## Cách mở

1. Tải và giải nén ZIP.
2. Muốn mở trực tiếp: trong draw.io, chọn **File → Open From → Device**, rồi chọn file trong `XML_mo_truc_tiep`.
3. Muốn dán mã: mở file trong `XML_dan_Edit_Diagram` bằng Notepad/VS Code, copy toàn bộ mã, rồi vào **Extras → Edit Diagram → dán → Apply**. Các file này có phần tử gốc `mxGraphModel`, đúng dạng cần dán.
4. Muốn mở tất cả: chọn [00_Tat_ca_so_do.drawio](xml-rieng/00_Tat_ca_so_do.drawio) hoặc [bản XML](xml-rieng/00_Tat_ca_so_do.xml). Mỗi tab là một sơ đồ.

Tra tên và đường dẫn trong [Danh_muc_so_do.csv](xml-rieng/Danh_muc_so_do.csv). `AD_UC07` là hoạt động đăng ký lịch; `SD_UC07` là tuần tự đăng ký lịch.

## Mở nhanh một số sơ đồ

- [Use case tổng quát](xml-rieng/XML_dan_Edit_Diagram/01_Use_case_tong_quat/UC_Tong_quat.xml)
- [Phân rã đăng ký lịch tiêm](xml-rieng/XML_dan_Edit_Diagram/02_Phan_ra_use_case/PR07.xml)
- [Phân rã cập nhật hồ sơ cá nhân](xml-rieng/XML_dan_Edit_Diagram/02_Phan_ra_use_case/PR05.xml)
- [Phân rã xử lý theo dõi sau tiêm](xml-rieng/XML_dan_Edit_Diagram/02_Phan_ra_use_case/PR23.xml)
- [Hoạt động đăng ký lịch](xml-rieng/XML_dan_Edit_Diagram/03_Hoat_dong/AD_UC07.xml)
- [Tuần tự đăng ký lịch](xml-rieng/XML_dan_Edit_Diagram/06_Tuan_tu/SD_UC07.xml)

## Phạm vi mô hình

- Tổng quát và phân rã đen trắng theo mẫu mới; hoạt động hai làn và tuần tự BCE. Use case chung trong sơ đồ tổng quát chỉ vẽ một lần, không lặp theo từng vai trò.
- Ba vai trò dùng chung đăng nhập/đăng xuất/đổi mật khẩu. Đăng ký là chức năng công khai của Khách và chỉ tạo tài khoản Người dân; quyền nhân viên/admin được cấp qua UC26. Khách cũng nối tới use case Đăng nhập dùng chung.
- `include` là mục tiêu con bắt buộc trong kịch bản tương ứng; `extend` có điều kiện ghi trên hình. Các thao tác CRUD lựa chọn dùng khái quát hóa thay vì bắt thực hiện tất cả.
- Đặt lịch kiểm tra liều vaccine khả dụng theo FEFO; project chưa quản lý số suất theo khung giờ/cơ sở.
- Ghi mũi có thể có hoặc không có lịch; gửi lại khớp định danh không trừ kho lần nữa.
- Riêng đăng xuất chỉ có các đối tượng trình duyệt, vì giao diện không gọi API/SQL.
- Control trong sơ đồ tuần tự gộp controller/service/repository ở mức thiết kế; code thực tế dùng module JavaScript.
- UC28 là API admin đã có, chưa có nút web hay lịch chạy tự động.
- ERD giữ đúng 15 bảng, 135 cột và 24 khóa ngoại; không thêm quan hệ chưa có.

Đã kiểm tra toàn vẹn ZIP, cấu trúc XML, độ tương đương của 98 cặp XML và các bản render. Xem [KIEM_TRA.json](xml-rieng/KIEM_TRA.json) và [hướng dẫn chi tiết](xml-rieng/HUONG_DAN.txt). Lần xuất tài liệu này không chạy lại kiểm thử ứng dụng hoặc SQL Server.

## Xem bố cục trước khi mở XML

[Tổng quát](examples/Usecase_tong_quat.png) · [Phân rã đăng ký lịch](examples/Phan_ra_Dang_ky_lich.png) · [Phân rã xử lý sau tiêm](examples/Phan_ra_Xu_ly_sau_tiem.png)
