# Phân tích use case tổng quát và phân rã

Sơ đồ tổng quát giữ 18 mục tiêu chính để dễ đọc. Một ellipse có thể tổng hợp nhiều use case chi tiết cùng phạm vi; các mã UC01–UC28 vẫn được giữ ở đặc tả và sơ đồ phân rã. Không tạo thêm chức năng nghiệp vụ chỉ để tăng số hình.

## Các mục tiêu chính

| Mục tiêu tổng quát | Tác nhân | Use case chi tiết | Phạm vi theo code |
|---|---|---|---|
| Đăng ký tài khoản (tạo tài khoản Người dân) | Khách | UC01 | Khách tự đăng ký; luôn tạo Người dân. Admin cấp vai trò bằng UC26. |
| Đăng nhập | Khách / Người dân / Nhân viên / Quản trị viên | UC02 | Cùng màn hình/API cho cả ba vai trò; Khách cũng tham gia trước khi xác thực. |
| Đăng xuất | Người dân / Nhân viên / Quản trị viên | UC03 | Xóa phiên ở trình duyệt; không thu hồi mọi bản sao JWT trên server. |
| Đổi mật khẩu | Người dân / Nhân viên / Quản trị viên | UC04 | Kiểm tra mật khẩu hiện tại; đổi hash và yêu cầu đăng nhập lại. |
| Quản lý hồ sơ cá nhân | Người dân | UC05 | Xem định danh; chỉ cập nhật liên hệ và địa chỉ của chính mình. |
| Quản lý lịch tiêm cá nhân | Người dân | UC06, UC07, UC08 | Xem, đăng ký và hủy lịch của mình; giữ liều FEFO và giải phóng khi hủy. |
| Tra cứu lịch sử tiêm và chống chỉ định | Người dân | UC09, UC10 | Chỉ đọc mũi tiêm đã ghi và chống chỉ định của chính hồ sơ. |
| Xem thông báo | Người dân | UC11 | Danh sách thông báo Website, đánh dấu từng thông báo đã đọc. |
| Theo dõi sức khỏe sau tiêm | Người dân | UC12, UC13 | Gửi nhiều lần cập nhật riêng; xem phản hồi/nhật ký và các mốc gợi ý. |
| Tra cứu hồ sơ người dân | Nhân viên / Quản trị viên | UC14 | Nhân viên/admin chỉ tra cứu danh sách và chi tiết, không CRUD hồ sơ. |
| Quản lý vaccine và lô tồn kho | Nhân viên / Quản trị viên | UC15, UC16 | Quản lý vaccine/lô/trạng thái; biểu mẫu sửa không ghi đè tồn kho. |
| Điều phối lịch tiêm | Nhân viên / Quản trị viên | UC17 | Tạo, sửa hoặc đổi trạng thái lịch theo điều kiện; chưa quản lý công suất khung giờ. |
| Ghi nhận mũi tiêm | Nhân viên / Quản trị viên | UC18 | Ghi có hoặc không có lịch; retry khớp trả bản cũ, không trừ kho thêm. |
| Quản lý chống chỉ định | Nhân viên / Quản trị viên | UC19 | Ghi nhận/cập nhật và hủy trạng thái; không xóa vật lý hay gắn riêng vaccine. |
| Tra cứu lịch sử và truy vết tiêm chủng | Nhân viên / Quản trị viên | UC20, UC21 | Tra lịch sử theo người dân; truy từ lô đến mũi và từ mũi về lô. |
| Tiếp nhận và xử lý theo dõi sau tiêm | Nhân viên / Quản trị viên | UC22, UC23 | Hàng đợi, xử lý, phản hồi, hẹn và chuyển trạng thái; kiểm soát revision. |
| Quản lý tài khoản và phân quyền | Quản trị viên | UC25, UC26, UC27 | Tra cứu tài khoản, đổi vai trò, khóa/mở khóa; không tạo/xóa/reset mật khẩu trực tiếp. |
| Xem tổng quan theo vai trò | Người dân / Nhân viên / Quản trị viên | UC24 | Nguồn GET theo từng vai trò; số liệu tổng hợp tại client, không có API dashboard riêng. |

## Đăng ký và quyền nhân viên/admin

POST /api/auth/register là API công khai; /register là tuyến công khai. Service chỉ nhận thông tin được phép, repository tạo tài khoản với vai trò cố định Người dân. Nhân viên/admin có thể mở URL công khai như một người dùng chưa xác thực, nhưng kết quả vẫn là một tài khoản Người dân mới; đây không phải cơ chế tự cấp quyền đặc biệt. Vì vậy sơ đồ nối Khách tới Đăng ký, và nối cả ba loại tài khoản tới một use case Đăng nhập dùng chung.

Căn cứ: server/routes/authRoutes.js:13–16; client/src/routes/AppRoutes.jsx:71–74; server/services/authService.js:8–25; server/repositories/authRepository.js:85–99; server/services/userService.js:17–25.

## Phân rã

PR01–PR28 tương ứng UC01–UC28. Một mục tiêu đơn giản được giữ gọn; nghiệp vụ có các mục tiêu con bắt buộc dùng include, hành vi tùy chọn dùng extend có điều kiện, các lựa chọn thêm/sửa/đổi trạng thái dùng khái quát hóa. Đăng nhập là tiền điều kiện, không bị gọi lặp như một include của mọi nghiệp vụ.

| Trang bổ sung | Nội dung | Lý do tách riêng |
|---|---|---|
| PR29 / UC15 | Lưu vaccine | Kiểm tra tên duy nhất, dữ liệu và lưu thêm/sửa. |
| PR30 / UC16 | Cập nhật lô | Kiểm tra giữ chỗ, hạn dùng, trạng thái và nhật ký trong giao dịch. |
| PR31 / UC17 | Lưu lịch | Giữ nguyên chủ, giữ/đổi lô FEFO và rollback nếu không đủ điều kiện. |
| PR32 / UC18 | Tạo mũi mới | Tồn kho, mũi, lịch và thông báo nguyên tử; phân biệt với retry. |
| PR33 / UC23 | Theo dõi, kết thúc và mở lại | Monitoring cần hẹn; resolved bỏ hẹn; mở lại theo trạng thái hợp lệ. |
| PR34 / UC26 | Cấp quyền nhân viên | Admin hợp lệ, tài khoản đích, vai trò và audit. |

UC28 chỉ là API tạo nhắc lịch chủ động, chưa có nút web. Chức năng này có sơ đồ phân rã riêng, không chiếm một ellipse chính trên sơ đồ tổng quát giao diện.
