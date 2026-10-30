# Kiểm chứng bản cơ sở tiêm TP.HCM

Đối chiếu ngày 30/10/2026. Phạm vi là mã nguồn React/Express/SQL Server của bản quản lý cơ sở và phân công nhiều cơ sở.

## Kiểm tra tại workspace

- Kiểm thử backend: **92 đạt, 1 bài SQL được bỏ qua trong lệnh mặc định**; phân quyền hiện tại, truy cập chéo cơ sở, quyền sở hữu, thu hồi phân công, tồn kho, khóa giao dịch, xử lý theo dõi sau tiêm và lỗi dữ liệu.
- Playwright: **22/22 đạt**, dùng fixture HTTP tách biệt. Có chọn cơ sở/ngày/vaccine, phản hồi HTTP đến trễ, giữ liều cuối theo lịch, phân công nhiều cơ sở, thu hồi, cơ sở ngừng hoạt động và hiển thị điện thoại.
- Build Vite thành công. Lint không có lỗi; vẫn có cảnh báo React về cách nạp dữ liệu trong effect ở các trang cũ/mới.
- SQLFluff phân tích cú pháp T-SQL cả hai file standalone đầy đủ, không bỏ qua file lớn; đạt. Đây là kiểm tra cú pháp, không thay thế SQL Server.
- File SQL tổng hợp đối chiếu đúng thứ tự các thành phần; `git diff --check` đạt.

## SQL Server thật

Bộ `npm run test:sql` tạo database kiểm thử riêng, bao gồm **11 trường hợp tích hợp** về nâng cấp dữ liệu cũ, schema/seed, phân quyền, đặt lịch đồng thời, ghi mũi lặp đồng thời, API cơ sở, phản hồi theo dõi và nhật ký. Không thao tác database demo đang sử dụng. Workflow GitHub Actions chạy SQL Server 2022 và một job Windows Node 22.17 để kiểm tra tương thích thư viện.

Commit mã nguồn **`b8efda935ea1c2a7cf73e3e428851e6e87baa895`**:

- [SQL Server 2022: thành công](https://github.com/phucphuc1234/LAB_OOSD/actions/runs/41064644323/job/124092749164), chạy bộ SQL/HTTP thật, gồm 11 kiểm thử con và các thao tác nâng cấp/seed.
- [Windows Node 22.17: thành công](https://github.com/phucphuc1234/LAB_OOSD/actions/runs/41064644323/job/124092749034), `npm ci --include=optional`, backend tests và build.
- [Lượt CI đầy đủ: thành công cả ba job](https://github.com/phucphuc1234/LAB_OOSD/actions/runs/41064644323), gồm ứng dụng Linux (backend/build/22 Playwright), SQL Server 2022 và Windows Node 22.17. Cập nhật tài liệu/ZIP sau commit trên không thay đổi logic ứng dụng.

Kết quả bản cũ trong `verification.md` được giữ làm lịch sử; các liên kết trên kiểm chứng riêng bản HCM.

## Giao diện

Ảnh dưới đây dùng dữ liệu fixture minh họa, không phải thông tin cơ sở y tế thật:

[Đăng nhập](ui-HCM/Login.png) · [Quản lý mạng lưới](ui-HCM/Network.png) · [Phân công](ui-HCM/Assignment.png) · [Nhân viên](ui-HCM/Staff_facility.png)

## Giới hạn nghiệp vụ

Danh mục khu phục vụ là nhóm nội bộ tại TP.HCM; không tự đồng bộ danh mục hành chính hoặc xác minh địa chỉ qua bản đồ. Chưa có quản lý số suất theo khung giờ, SMS/email, liên thông hệ thống y tế hay chế độ nhân viên trực 24/7. Cảnh báo sau tiêm hỗ trợ tiếp nhận, không chẩn đoán hay xác nhận an toàn. Bộ sơ đồ phân tích thiết kế đã xuất trước đây cần được cập nhật theo mô hình cơ sở mới.
