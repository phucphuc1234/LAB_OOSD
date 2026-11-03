# 20 sơ đồ hoạt động chính — bản TP.HCM

**[Tải file XML gồm đủ 20 trang AD01–AD20](xml/Hoat_dong_20_usecase_chinh_HCM.xml)**

Mở draw.io/diagrams.net, chọn **File → Open From → Device**, chọn file XML và chuyển sơ đồ bằng các tab phía dưới. Đây là file nhiều trang; mở trực tiếp để giữ đủ 20 trang. Có thể chỉnh sửa toàn bộ hình, chữ và đường nối.

Mỗi trang dùng **hai làn: tác nhân bên trái, HỆ THỐNG bên phải**, theo mẫu đã cung cấp. Nút bắt đầu màu đen, nút kết thúc có vòng đỏ; hình thoi ghi điều kiện rẽ nhánh, hình thoi nhỏ hợp nhất các nhánh thay thế. Các thao tác xem, thêm, sửa hoặc đổi trạng thái là lựa chọn khi phù hợp, không phải chuỗi bắt buộc.

## Danh mục trang

Mỗi AD tương ứng cùng số PR trong [bản phân rã 20 use case chính](xml/Phan_ra_20_usecase_chinh_HCM.xml).

| Hoạt động | Phân rã | Use case chính |
|---|---|---|
| AD01 | PR01 | Đăng nhập |
| AD02 | PR02 | Đăng xuất |
| AD03 | PR03 | Đổi mật khẩu |
| AD04 | PR04 | Đăng ký tài khoản Người dân |
| AD05 | PR05 | Quản lý hồ sơ cá nhân |
| AD06 | PR06 | Quản lý lịch tiêm cá nhân |
| AD07 | PR07 | Tra cứu lịch sử tiêm và chống chỉ định |
| AD08 | PR08 | Xem thông báo |
| AD09 | PR09 | Theo dõi sức khỏe sau tiêm |
| AD10 | PR10 | Tra cứu hồ sơ người dân thuộc phạm vi |
| AD11 | PR11 | Quản lý vaccine tiếp nhận tại cơ sở |
| AD12 | PR12 | Quản lý lô vaccine và tồn kho tại cơ sở |
| AD13 | PR13 | Quản lý, điều phối lịch tiêm |
| AD14 | PR14 | Ghi nhận mũi tiêm |
| AD15 | PR15 | Quản lý chống chỉ định |
| AD16 | PR16 | Tra cứu lịch sử và truy vết tiêm chủng |
| AD17 | PR17 | Tiếp nhận và xử lý theo dõi sau tiêm |
| AD18 | PR18 | Quản lý danh mục vaccine dùng chung |
| AD19 | PR19 | Quản lý tài khoản và phân quyền |
| AD20 | PR20 | Quản lý khu vực, cơ sở và phân công nhân viên |

## Phạm vi đối chiếu

Đối chiếu mã nguồn ứng dụng `21ac32f3239a1dabdc2e039209fda56a63def54a`: giao diện React, service/repository Node.js và SQL Server. Mỗi trang có ghi chú phạm vi và nguồn; dữ liệu đối chiếu chi tiết nằm trong [activity_20_HCM_manifest.json](sources/activity_20_HCM_manifest.json). Bộ này mô tả luồng chính và các nhánh nghiệp vụ quan trọng của 20 mục tiêu đã chốt; không bổ sung chức năng mới vào ứng dụng.

- Đăng ký chỉ tạo Người dân; đăng xuất giao diện chỉ xóa phiên trình duyệt. Hồ sơ cá nhân chỉ sửa liên hệ/địa chỉ.
- Nhân viên xử lý theo các cơ sở được giao; Admin quản lý danh mục vaccine dùng chung và phân công nhiều cơ sở tại TP.HCM. Tiếp nhận vaccine tại cơ sở là chức năng riêng.
- Đặt lịch chọn cơ sở từ danh sách có tồn kho phù hợp; chưa có số suất theo khung giờ. Giữ liều khi đặt lịch và trừ tồn khi ghi mũi là hai bước khác nhau; gửi lại mũi đã ghi khớp thông tin không trừ kho lần nữa.
- Theo dõi sau tiêm hiện cảnh báo trước khi gửi; không tự chẩn đoán, xác nhận an toàn hoặc gọi cấp cứu. Xung đột phiên bản 409 giữ bản nháp và tải lại phiếu để đối chiếu.
- Lỗi đọc lại sau khi giao dịch đã commit không hoàn tác dữ liệu đã lưu. Thông báo dùng trong website; chưa có gửi SMS/email thật.
- Không thêm Dashboard hoặc API tạo nhắc lịch chưa có nút web vào 20 trang hoạt động.

Đã kiểm tra cấu trúc XML, đủ 20 trang, điều kiện rẽ nhánh, các điểm hợp nhất và khả năng đi từ đầu đến cuối. Các trang được render bằng mxGraph trong Chromium để kiểm tra bố cục. Lần xuất này chỉ bổ sung tài liệu, không sửa ứng dụng hoặc chạy lại database.

[Xem ví dụ AD06](examples/Hoat_dong_AD06.png) · [Kết quả kiểm tra](sources/KIEM_TRA_HOAT_DONG_20_HCM.json) · [Bộ 20 sơ đồ tuần tự tương ứng](TUAN_TU_20_USECASE_HCM.md).
