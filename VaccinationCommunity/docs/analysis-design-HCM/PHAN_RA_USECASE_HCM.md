# Phân rã đầy đủ 20 use case chính — bản TP.HCM

**[Bản chỉ gồm 20 sơ đồ chính PR01–PR20, mỗi sơ đồ một trang](xml/Phan_ra_20_usecase_chinh_HCM.xml)**. Bản này giữ nguyên nội dung phân rã cấp một và kế thừa tác nhân; đã bỏ các ký hiệu trỏ tới trang chi tiết không đi kèm.

**[Tải một file XML chứa toàn bộ phân rã](xml/Phan_ra_usecase_HCM_day_du.xml)**

File có **63 trang: một mục lục và 62 sơ đồ**. Trên draw.io/diagrams.net, chọn **File → Open From → Device**, mở file XML và chuyển tab phía dưới. Đây là file `mxfile` nhiều trang; cách mở trực tiếp sẽ giữ đủ các trang.

Nội dung bám 20 mục tiêu chính của [sơ đồ tổng quát đã chốt](xml/Usecase_tong_quat_HCM.xml), phiên bản tài liệu `8bea38a63fecd22b4885a1c469e143735b39cd4c`. Đối chiếu mã nguồn ứng dụng `21ac32f3239a1dabdc2e039209fda56a63def54a`; code ứng dụng không thay đổi khi làm bộ phân rã này.

## Cách tổ chức các trang

| Nhóm trang | Nội dung | Số sơ đồ |
|---|---|---:|
| PR01–PR20 | Phân rã trực tiếp từng use case chính | 20 |
| PR21–PR39 | Tách mục tiêu con của các use case tổng hợp | 19 |
| PR40–PR62 | Phân tích sâu nghiệp vụ ghi dữ liệu, phân quyền, tồn kho, ưu tiên và trạng thái | 23 |

Trang đầu là mục lục nối từng use case chính với các trang con tương ứng. Chữ `[PRxx]` trong ellipse chỉ trang phân rã tiếp. Có thể tra đầy đủ tên ở [Danh_muc_phan_ra_HCM.csv](xml/Danh_muc_phan_ra_HCM.csv). Mã **UC** giữ nguyên để đối chiếu chức năng trong đặc tả/code; mã **PR** là số trang trong bộ phân rã mới, không dùng theo các bộ XML cũ.

| Trang chính | Use case chính | Các trang chi tiết liên quan |
|---|---|---|
| PR01 | Đăng nhập | PR40 |
| PR02 | Đăng xuất | Đã phân rã ngay tại PR02 |
| PR03 | Đổi mật khẩu | PR41 |
| PR04 | Đăng ký tài khoản Người dân | PR42 |
| PR05 | Quản lý hồ sơ cá nhân | PR43 |
| PR06 | Quản lý lịch tiêm cá nhân | PR21, PR22, PR23 |
| PR07 | Tra cứu lịch sử tiêm và chống chỉ định | PR24, PR25 |
| PR08 | Xem thông báo | Đã phân rã ngay tại PR08 |
| PR09 | Theo dõi sức khỏe sau tiêm | PR26, PR27, PR44, PR45 |
| PR10 | Tra cứu hồ sơ người dân thuộc phạm vi | Đã phân rã ngay tại PR10 |
| PR11 | Quản lý vaccine tiếp nhận tại cơ sở | PR28, PR29, PR46 |
| PR12 | Quản lý lô vaccine và tồn kho tại cơ sở | PR47, PR48 |
| PR13 | Quản lý, điều phối lịch tiêm | PR49, PR50 |
| PR14 | Ghi nhận mũi tiêm | PR51, PR52 |
| PR15 | Quản lý chống chỉ định | PR53 |
| PR16 | Tra cứu lịch sử và truy vết tiêm chủng | PR30, PR31, PR54, PR55 |
| PR17 | Tiếp nhận và xử lý theo dõi sau tiêm | PR32, PR33, PR56, PR57, PR58 |
| PR18 | Quản lý danh mục vaccine dùng chung | PR59 |
| PR19 | Quản lý tài khoản và phân quyền | PR34, PR35, PR36, PR60 |
| PR20 | Quản lý khu vực, cơ sở và phân công nhân viên | PR37, PR38, PR39, PR61, PR62 |

## Ý nghĩa quan hệ

- **include:** mũi tên nét đứt từ mục tiêu đang phân rã đến mục tiêu con bắt buộc trong kịch bản được nêu.
- **extend:** mũi tên nét đứt từ hành vi bổ sung về mục tiêu được mở rộng; điều kiện ghi trong ngoặc vuông.
- **Khái quát hóa use case:** nét liền, tam giác rỗng hướng về mục tiêu tổng quát. Dùng cho lựa chọn thêm/sửa/xem, hoặc các biến thể; không bắt người dùng thực hiện mọi thao tác liên tiếp.
- **Kế thừa tác nhân:** Admin → Nhân viên y tế ở các trang có nghiệp vụ chung. Người dân và Nhân viên nối chức năng xác thực; Admin có quyền đó qua kế thừa. Nhân viên giới hạn theo cơ sở được giao; Admin có phạm vi toàn hệ thống.

Các nhánh thể hiện phân rã mục tiêu và điều kiện, không biểu thị thứ tự thời gian. Phân rã sâu có cả các mục tiêu xử lý bên trong hệ thống; mỗi ellipse không đồng nghĩa với một màn hình hoặc endpoint riêng. Đăng nhập là tiền điều kiện của chức năng bảo vệ, không bị thêm thành `include` ở mọi nghiệp vụ.

## Những điểm đối chiếu quan trọng

- Đăng ký chỉ tạo Người dân. Không có tác nhân Khách riêng, tự cấp quyền nhân viên, OTP hoặc quên mật khẩu trong bộ này.
- Đăng xuất UI chỉ xóa phiên trình duyệt và chuyển về đăng nhập. Endpoint logout hiện có chỉ là stub xác nhận, không được UI gọi và không thu hồi toàn bộ JWT.
- Nhân viên không sửa danh mục vaccine dùng chung; việc bật/ngừng vaccine tiếp nhận tại cơ sở là nghiệp vụ riêng. Bật tiếp nhận không tự nhập tồn kho.
- Người dân chọn cơ sở theo mã, vaccine và ngày hẹn. Chọn lô FEFO khi chưa chỉ định lô; sửa cùng vaccine/cơ sở có thể giữ lô cũ và phải kiểm tra lại điều kiện. Không có quản lý suất theo khung giờ.
- Lô đã nhập không được đổi cơ sở/vaccine/mã hoặc ghi đè số lượng bằng biểu mẫu sửa. Kiểm tra/audit cập nhật lô theo đúng nhánh repository/trigger; không gán audit cho mọi lần đọc hoặc nhập lô khi code không có.
- Ghi mũi mới và trả lại bản ghi đã có được tách riêng, tránh mô tả gửi lại là trừ kho lần hai. Mũi theo lịch và mũi trực tiếp là hai biến thể hợp lệ.
- Hủy lịch giải phóng giữ chỗ khi có lô dự kiến; dữ liệu lịch cũ không có lô bỏ qua nhánh đó. Chống chỉ định cập nhật không gửi ngày sẽ giữ ngày cũ nếu đã có.
- Báo cáo sau tiêm đúng chủ mũi; cảnh báo hiện ngay lúc nhập. Ưu tiên tiếp nhận có thứ tự điều kiện; không tự chẩn đoán hoặc xác nhận an toàn. Lưu xử lý kiểm tra phiên bản, trạng thái, quyền cơ sở và ghi lịch sử/thông báo nguyên tử.
- Phân công nhiều cơ sở, thay thế danh sách và thu hồi toàn bộ nằm trong giao dịch có audit. Thay đổi vai trò thực sự thu hồi phân công cũ; cơ sở mới trong khu vực không tự được cấp quyền.
- Dashboard đã được bỏ theo yêu cầu. API nhắc lịch chủ động UC28 không nằm trong 20 mục tiêu chính đã chốt, nên không thêm thành trang phân rã giao diện.

## Kiểm tra

Đã kiểm tra 63 trang XML, ID và đầu nối, chiều `include`/`extend`/khái quát hóa, kế thừa Admin, các tham chiếu trang và độ phủ của 20 mục tiêu chính/31 use case chi tiết. Đã mở thử toàn bộ 63 trang bằng mxGraph trong Chromium; không có cảnh báo tràn chiều ngang nhãn. Các trang phức tạp được kiểm tra bố cục trực quan; có rà soát nội dung độc lập theo source. Lần xuất tài liệu này không chạy lại ứng dụng hoặc database.

Kết quả: [KIEM_TRA_PHAN_RA_HCM.json](sources/KIEM_TRA_PHAN_RA_HCM.json). Dữ liệu đối chiếu có tên file và dòng mã trong `sources/decomposition_HCM_cases.json`; mỗi trang cũng có ghi chú nguồn ở cuối.

Xem bố cục: [Mục lục](examples/Phan_ra_HCM_Muc_luc.png) · [Ghi nhận mũi tiêm](examples/Phan_ra_HCM_Ghi_mui.png) · [Quản lý mạng lưới](examples/Phan_ra_HCM_Mang_luoi.png).
