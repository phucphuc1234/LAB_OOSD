# 20 sơ đồ tuần tự chính — bản TP.HCM

**[Tải một file XML gồm đủ 20 trang SD01–SD20](xml/Tuan_tu_20_usecase_chinh_HCM.xml)**

Trong draw.io/diagrams.net, chọn **File → Open From → Device**, mở file XML rồi chuyển trang bằng các tab phía dưới. Mỗi trang chỉnh sửa được và tương ứng cùng số với AD trong [bộ hoạt động](xml/Hoat_dong_20_usecase_chinh_HCM.xml) và PR trong [bộ phân rã](xml/Phan_ra_20_usecase_chinh_HCM.xml). Mở trực tiếp file nhiều trang, không dán toàn bộ `mxfile` vào ô Edit Diagram.

## Cách đọc

Bố cục theo mẫu **Tác nhân → Boundary (giao diện) → Control (xử lý) → SQL Server**. Boundary và Control dùng tên trang React, service thực tế; Control gộp các bước route/controller/service/repository liên quan, không giả định ứng dụng có thêm lớp controller ngoài code. Lời gọi dùng nét liền, phản hồi dùng nét đứt, thanh thực thi màu xanh. Khung `alt` thể hiện các nhánh thay thế; `opt` chỉ thực hiện khi điều kiện ghi trong khung đúng. Các nhánh xem, thêm, sửa hoặc đổi trạng thái là lựa chọn, không phải tất cả đều bắt buộc thực hiện trong một lần dùng.

## Danh mục trang

| Tuần tự | Hoạt động | Phân rã | Use case chính |
|---|---|---|---|
| SD01 | AD01 | PR01 | Đăng nhập |
| SD02 | AD02 | PR02 | Đăng xuất |
| SD03 | AD03 | PR03 | Đổi mật khẩu |
| SD04 | AD04 | PR04 | Đăng ký tài khoản Người dân |
| SD05 | AD05 | PR05 | Quản lý hồ sơ cá nhân |
| SD06 | AD06 | PR06 | Quản lý lịch tiêm cá nhân |
| SD07 | AD07 | PR07 | Tra cứu lịch sử tiêm và chống chỉ định |
| SD08 | AD08 | PR08 | Xem thông báo |
| SD09 | AD09 | PR09 | Theo dõi sức khỏe sau tiêm |
| SD10 | AD10 | PR10 | Tra cứu hồ sơ người dân thuộc phạm vi |
| SD11 | AD11 | PR11 | Quản lý vaccine tiếp nhận tại cơ sở |
| SD12 | AD12 | PR12 | Quản lý lô vaccine và tồn kho tại cơ sở |
| SD13 | AD13 | PR13 | Quản lý, điều phối lịch tiêm |
| SD14 | AD14 | PR14 | Ghi nhận mũi tiêm |
| SD15 | AD15 | PR15 | Quản lý chống chỉ định |
| SD16 | AD16 | PR16 | Tra cứu lịch sử và truy vết tiêm chủng |
| SD17 | AD17 | PR17 | Tiếp nhận và xử lý theo dõi sau tiêm |
| SD18 | AD18 | PR18 | Quản lý danh mục vaccine dùng chung |
| SD19 | AD19 | PR19 | Quản lý tài khoản và phân quyền |
| SD20 | AD20 | PR20 | Quản lý khu vực, cơ sở và phân công nhân viên |

## Phạm vi đối chiếu

Đối chiếu mã nguồn ứng dụng `21ac32f3239a1dabdc2e039209fda56a63def54a`: giao diện React, service/repository Node.js và SQL Server. Nguồn từng trang, thông điệp và các nhánh được lưu trong [sequence_20_HCM_manifest.json](sources/sequence_20_HCM_manifest.json). Sơ đồ tập trung vào luồng chính và các nhánh nghiệp vụ quan trọng; một số lần đọc hoặc bước middleware dùng chung được gộp cho dễ nhìn. Các API được bảo vệ vẫn kiểm tra token, phiên bản thông tin xác thực, trạng thái tài khoản/vai trò và phạm vi hiện tại theo code.

- Đăng ký chỉ tạo vai trò Người dân. Đăng xuất xóa phiên ở trình duyệt; Control và SQL Server không tham gia luồng SD02 dù giữ bốn vị trí để thống nhất bố cục.
- Nhân viên thao tác trong các cơ sở được giao; Admin phân công nhiều cơ sở thuộc TP.HCM. Danh mục vaccine dùng chung chỉ Admin quản lý; nhân viên bật/ngừng vaccine tiếp nhận tại cơ sở. Bật tiếp nhận không tự thêm tồn kho.
- Đặt lịch chọn cơ sở hợp lệ từ dữ liệu hệ thống; chưa có số suất theo khung giờ. Giữ liều khi đặt lịch và trừ tồn khi ghi mũi là hai bước riêng. Gửi lại mũi đã ghi với thông tin khớp trả kết quả hiện có, không ghi thay đổi tồn kho lần nữa.
- Cảnh báo sau tiêm hiển thị trước POST; mức ưu tiên tiếp nhận không phải chẩn đoán hay xác nhận an toàn. Xử lý phiếu kiểm tra phiên bản; HTTP 409 dẫn đến tải lại phiếu để đối chiếu và giữ bản nháp.
- Giao dịch đã commit vẫn có hiệu lực nếu bước đọc lại hoặc tải lại giao diện sau đó lỗi; không gán lỗi này thành rollback. Thông báo hiện trong website; chưa có gửi SMS/email hoặc gọi cấp cứu tự động.

Bộ này chỉ bổ sung tài liệu phân tích thiết kế, không thay đổi chức năng ứng dụng hoặc chạy lại database.

Đã kiểm tra đủ 20 trang, 471 thông điệp, 52 khung `alt` và 23 khung `opt`; toàn bộ trang được render bằng mxGraph trong Chromium, không có cảnh báo tràn chiều ngang của nhãn. [Xem ví dụ SD06](examples/Tuan_tu_SD06.png) · [Kết quả kiểm tra](sources/KIEM_TRA_TUAN_TU_20_HCM.json).
