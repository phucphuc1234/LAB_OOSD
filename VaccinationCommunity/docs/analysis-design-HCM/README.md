# Use case tổng quát và ERD — bản cuối TP.HCM

Đối chiếu mã nguồn `21ac32f3239a1dabdc2e039209fda56a63def54a` của dự án VaccinationCommunity. Cập nhật: 02/11/2026. Đây là sơ đồ cho bản đã có cơ sở tiêm, danh mục vaccine tại cơ sở và phân công nhiều cơ sở cho nhân viên; thay bản tổng quát/ERD trước khi có các chức năng này.

**[Tải một XML gồm hai trang](xml/Usecase_tong_quat_va_ERD_HCM.xml)**

**Bộ phân rã đầy đủ:** [một XML có 63 trang, gồm mục lục và 62 sơ đồ phân rã](xml/Phan_ra_usecase_HCM_day_du.xml). Xem [danh mục và hướng dẫn phân rã](PHAN_RA_USECASE_HCM.md).

**Bản 20 sơ đồ chính:** [một XML chỉ có PR01–PR20, mỗi sơ đồ một trang](xml/Phan_ra_20_usecase_chinh_HCM.xml).

Trong draw.io/diagrams.net, chọn **File → Open From → Device**, mở file XML, rồi chuyển trang bằng các tab ở dưới:

1. **Use case tổng quát:** 20 mục tiêu chính; ba tác nhân Người dân, Nhân viên y tế, Quản trị viên. Admin kế thừa Nhân viên, gồm cả đăng nhập/đăng xuất/đổi mật khẩu, để giảm các đường nối lặp. Đã bỏ mục tiêu hỗ trợ “Xem tổng quan theo vai trò”.
2. **ERD vật lý:** đủ 19 bảng, 159 cột và 34 khóa ngoại của database hiện tại.

Nếu chỉ cần use case: [XML riêng một trang](xml/Usecase_tong_quat_HCM.xml). Nếu muốn dán mã vào **Extras → Edit Diagram**, dùng [bản mxGraphModel để dán](xml/Usecase_dan_Edit_Diagram.xml); không dán nguyên file mxfile nhiều trang vào ô này. [XML ERD riêng](xml/ERD_HCM.xml) cũng có thể mở trực tiếp.

## Quy tắc đã giữ đúng theo code

- Không có tác nhân Khách riêng. Người dân đại diện cả người chuẩn bị đăng ký tài khoản.
- Đăng nhập, đăng xuất và đổi mật khẩu mỗi chức năng chỉ có một ellipse. Người dân và Nhân viên nối trực tiếp; Admin có quyền tham gia thông qua kế thừa Nhân viên.
- Quan hệ khái quát hóa đi từ **Quản trị viên → Nhân viên y tế**, nét liền và tam giác rỗng ở phía Nhân viên. Admin chỉ nối trực tiếp tới ba mục tiêu quản trị riêng; các nghiệp vụ chung được kế thừa. Tổng cộng có 23 đường tham gia trực tiếp và một đường kế thừa, giữ nguyên 34 quyền tham gia hiệu lực của bản trước.
- Đăng ký chỉ vẽ một lần và nối Người dân. API tự đăng ký luôn tạo vai trò Người dân; admin cấp quyền nhân viên và phân công cơ sở.
- Nhân viên quản lý dữ liệu trong các cơ sở được giao. Danh mục vaccine dùng chung chỉ admin được thêm/sửa/ngừng; nhân viên quản lý vaccine tiếp nhận tại cơ sở.
- Quản lý khu vực, cơ sở và phân công được nhóm thành một mục tiêu chính; không coi mọi thao tác thêm/sửa/khóa là một use case tổng quát riêng.
- Trên sơ đồ tổng quát, lịch sử và chống chỉ định cá nhân được nhóm; lịch sử và truy vết nghiệp vụ được nhóm; các thao tác con không bị xếp thành chuỗi bắt buộc.
- API tạo nhắc lịch chủ động có trong code nhưng chưa có nút web, được ghi ở chú thích thay vì thêm thành chức năng giao diện chính.

## Quy tắc ERD

- Tên bảng, tên/kiểu cột, PK, FK, tính nullable và bội số đối chiếu `database/01-schema.sql` + `database/06-facilities.sql`.
- Tài khoản–người dân và lịch hẹn–mũi tiêm đều có bội số **0..1 ở hai đầu**. FK nullable kết hợp unique index có điều kiện; không ép mọi tài khoản có hồ sơ hoặc mọi mũi phải có lịch.
- Ba bảng nối có PK ghép: `PHANCONG_COSOTIEM`, `COSOTIEM_VACCINE`, `THEODOI_TRIEUCHUNG`. Các cột đánh dấu PK cùng tạo thành một khóa ghép, không có nghĩa từng cột là duy nhất độc lập.
- `PHANCONG_COSOTIEM` có hai FK khác nhau đến tài khoản: nhân viên được giao và người phân công. Nhân viên/admin không có bảng riêng, được phân biệt bởi vai trò.
- Không vẽ FK trực tiếp từ người dân hoặc phiếu theo dõi đến cơ sở: quan hệ cơ sở đi qua lịch/mũi thực tế. Không thêm FK giữa lô và bảng vaccine triển khai tại cơ sở.
- Không có FK từ thông báo đến phiếu/mũi tiêm. `LICHSUHIEUCHINH.TenBang/MaBanGhi` là tham chiếu logic. `SCHEMAVERSION` độc lập.
- Đường nối thể hiện FK với bội số bằng số; không biểu thị xóa dây chuyền. Tất cả FK hiện dùng `NO ACTION`.

## Kiểm tra và hình xem trước

Đã kiểm tra ID/XML, các đầu nối, số lần xuất hiện chức năng chung, 159 ô cột, 34 đường FK và tính tương đương giữa các file tách/gộp. Hai trang được render bằng mxGraph trong Chromium; không có cảnh báo tràn chiều ngang của nhãn. Chỉ xuất tài liệu, không sửa ứng dụng hoặc chạy lại database.

[Xem use case tổng quát](examples/Usecase_tong_quat_HCM.png) · [Xem ERD](examples/ERD_HCM.png)

ERD chứa đủ cột nên cần phóng to trên draw.io để đọc; toàn bộ hình và chữ đều chỉnh sửa được. Dữ liệu đối chiếu và kết quả kiểm tra nằm trong `sources/`.
