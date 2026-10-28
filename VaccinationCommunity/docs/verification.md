# Kiểm chứng bản nâng cấp

- 56 kiểm thử unit/service/repository/HTTP contract đạt; một suite SQL thật được bỏ qua nếu chưa chủ động bật. Bcrypt và JWT được chạy thật trong kiểm thử xác thực. Các test repository sử dụng SQL mocks.
- 13 kiểm thử Playwright đạt, gồm 3 vai trò, các luồng sau tiêm, lỗi/xung đột, 31 màn hình và hiển thị điện thoại. Các test này dùng fixture HTTP riêng, không thay dữ liệu thật của ứng dụng.
- Build production Vite đạt. Lint không có lỗi; còn các cảnh báo React về setState trong effect và export helper.
- Bộ SQL tổng hợp được SQLFluff dialect T-SQL phân tích với 0 vi phạm và không có đoạn không phân tích được. Đây là kiểm tra cú pháp tĩnh, không thay thế thực thi SQL Server.
- Chưa chạy được SQL Server thật trong môi trường cloud này: việc tải image/binary Microsoft bị chặn ở registry/host chuyển hướng. Đã cung cấp npm run test:sql và job GitHub Actions SQL Server 2022 để kiểm tra cài đặt, seed, tranh liều cuối, quyền, chống trừ kho lặp và nhật ký trên database kiểm thử riêng.

Để xác minh tại máy Windows, chạy npm run db:install, npm run db:seed, npm run db:check và npm run test:sql theo README. Không dùng kết quả test mocks để tuyên bố đã kiểm thử SQL Server thật.
